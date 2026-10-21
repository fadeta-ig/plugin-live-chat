<?php
/**
 * Sync Manager Class
 *
 * Listens to WooCommerce product events and queues vector synchronization
 * via Action Scheduler for asynchronous background processing.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Sync_Manager {

    public function __construct() {
        // Hook into WooCommerce product lifecycle events
        add_action( 'save_post_product', array( $this, 'queue_product_sync' ), 10, 3 );
        add_action( 'woocommerce_update_product', array( $this, 'queue_product_sync_by_id' ), 10, 1 );
        add_action( 'woocommerce_product_set_stock', array( $this, 'queue_product_sync_by_object' ), 10, 1 );

        // Handle product deletion / trash
        add_action( 'trashed_post', array( $this, 'handle_product_deletion' ), 10, 1 );
        add_action( 'before_delete_post', array( $this, 'handle_product_deletion' ), 10, 1 );

        // Action Scheduler callback for background processing
        add_action( 'ai_woo_sa_process_product_sync', array( $this, 'process_product_sync' ), 10, 1 );
    }

    /**
     * Queue product sync on standard post save (receives $post_id, $post, $update)
     */
    public function queue_product_sync( $post_id, $post, $update ) {
        if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
            return;
        }
        $this->schedule_sync( (int) $post_id );
    }

    /**
     * Queue sync when WooCommerce fires woocommerce_update_product (passes product ID as int)
     */
    public function queue_product_sync_by_id( $product_id ) {
        $this->schedule_sync( (int) $product_id );
    }

    /**
     * Queue sync when WooCommerce fires woocommerce_product_set_stock (passes WC_Product object)
     */
    public function queue_product_sync_by_object( $product ) {
        if ( is_object( $product ) && method_exists( $product, 'get_id' ) ) {
            $this->schedule_sync( (int) $product->get_id() );
        }
    }

    /**
     * Bulk queue all published products for Pinecone sync.
     * Fetches all IDs and leverages Action Scheduler for async background processing.
     * 
     * @return int Number of products queued.
     */
    public function queue_all_products() {
        if ( ! function_exists( 'wc_get_products' ) ) {
            return 0;
        }

        $products = wc_get_products( array(
            'limit'  => -1,
            'status' => 'publish',
            'return' => 'ids',
        ) );

        if ( empty( $products ) ) {
            return 0;
        }

        foreach ( $products as $product_id ) {
            $this->schedule_sync( (int) $product_id );
        }

        // Clear semantic cache so old RAG results (without images) are purged
        delete_transient( 'ai_woo_sa_semantic_cache' );

        return count( $products );
    }

    /**
     * Handle product deletion or trash — remove from Pinecone immediately
     */
    public function handle_product_deletion( $post_id ) {
        if ( get_post_type( $post_id ) !== 'product' ) {
            return;
        }
        $pinecone = new AI_Woo_SA_Pinecone_Client();
        $result = $pinecone->delete( array( 'prod_' . $post_id ) );
        if ( is_wp_error( $result ) ) {
            error_log( 'AI Woo SA: Failed to delete product ' . $post_id . ' from Pinecone - ' . $result->get_error_message() );
        }
    }

    /**
     * Schedule the async sync action. Prevents duplicate queuing.
     */
    private function schedule_sync( $product_id ) {
        if ( function_exists( 'as_enqueue_async_action' ) ) {
            $args = array( 'product_id' => $product_id );
            if ( false === as_next_scheduled_action( 'ai_woo_sa_process_product_sync', $args ) ) {
                as_enqueue_async_action( 'ai_woo_sa_process_product_sync', $args, 'ai_woo_sa' );
            }
        } else {
            // Fallback: synchronous processing if Action Scheduler is unavailable
            $this->process_product_sync( $product_id );
        }
    }

    /**
     * Background processing: embed product text and upsert to Pinecone
     */
    public function process_product_sync( $product_id ) {
        $product = wc_get_product( $product_id );

        // Product deleted or doesn't exist — clean up vector DB
        if ( ! $product ) {
            $pinecone = new AI_Woo_SA_Pinecone_Client();
            $pinecone->delete( array( 'prod_' . $product_id ) );
            return;
        }

        // Unpublished product — remove from vector DB
        if ( $product->get_status() !== 'publish' ) {
            $pinecone = new AI_Woo_SA_Pinecone_Client();
            $pinecone->delete( array( 'prod_' . $product_id ) );
            return;
        }

        // Build clean text for embedding (no HTML tags)
        $title = $product->get_name();
        $short_desc = wp_strip_all_tags( $product->get_short_description() );
        $long_desc = wp_strip_all_tags( $product->get_description() );
        $raw_price = $product->get_price();
        $price_text = is_numeric( $raw_price ) ? 'Rp' . number_format( (float) $raw_price, 0, ',', '.' ) : 'Harga tidak tersedia';

        $categories = wp_get_post_terms( $product_id, 'product_cat', array( 'fields' => 'names' ) );
        $cats_text = ( is_array( $categories ) && ! is_wp_error( $categories ) ) ? implode( ', ', $categories ) : '';

        $text_to_embed = "Produk: {$title}. Kategori: {$cats_text}. Harga: {$price_text}.";
        if ( ! empty( $short_desc ) ) {
            $text_to_embed .= " Deskripsi singkat: {$short_desc}.";
        }
        if ( ! empty( $long_desc ) ) {
            // Truncate long descriptions to avoid exceeding embedding token limits
            $truncated_desc = mb_substr( $long_desc, 0, 500, 'UTF-8' );
            $text_to_embed .= " Deskripsi: {$truncated_desc}";
        }

        // Generate embedding vector
        $gemini = new AI_Woo_SA_Gemini_Client();
        $embedding = $gemini->get_embedding( $text_to_embed );

        if ( is_wp_error( $embedding ) ) {
            error_log( 'AI Woo SA: Embedding failed for product ' . $product_id . ' - ' . $embedding->get_error_message() );
            return;
        }

        // Build metadata for Pinecone
        $image_id = $product->get_image_id();
        $image_url = $image_id ? wp_get_attachment_url( $image_id ) : '';

        $metadata = array(
            'product_id' => (int) $product_id,
            'title'      => $title,
            'price'      => is_numeric( $raw_price ) ? (float) $raw_price : 0,
            'permalink'  => $product->get_permalink(),
            'in_stock'   => $product->is_in_stock(),
            'image_url'  => $image_url ? $image_url : '',
            'short_desc' => mb_substr( $short_desc, 0, 300, 'UTF-8' )
        );

        $vector_data = array(
            array(
                'id'       => 'prod_' . $product_id,
                'values'   => $embedding,
                'metadata' => $metadata
            )
        );

        // Upsert to Pinecone
        $pinecone = new AI_Woo_SA_Pinecone_Client();
        $response = $pinecone->upsert( $vector_data );

        if ( is_wp_error( $response ) ) {
            error_log( 'AI Woo SA: Pinecone Upsert failed for product ' . $product_id . ' - ' . $response->get_error_message() );
        }
    }
}
