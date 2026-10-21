<?php
/**
 * Keyword Search Class
 *
 * Performs exact keyword matching against WooCommerce product titles
 * using WP_Query. Works alongside Pinecone semantic search to form
 * a hybrid retrieval strategy: keyword precision + semantic recall.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Keyword_Search {

    /**
     * Indonesian stop words to filter out before searching.
     * These common words would pollute search results.
     *
     * @var string[]
     */
    private static $stop_words = array(
        'saya', 'mau', 'yang', 'untuk', 'dan', 'di', 'ke', 'dari',
        'ini', 'itu', 'ada', 'bisa', 'apa', 'bagaimana', 'dengan',
        'tidak', 'ya', 'juga', 'atau', 'akan', 'sudah', 'belum',
        'halo', 'hai', 'kak', 'dong', 'nih', 'deh', 'sih', 'loh',
        'tolong', 'cari', 'carikan', 'rekomendasikan', 'minta',
        'punya', 'produk', 'jual', 'harga', 'berapa', 'kasih',
        'lagi', 'bantu', 'tanya', 'mana', 'gimana', 'kayak',
        'pengen', 'ingin', 'butuh', 'pakai', 'cocok', 'bagus',
        'dong', 'kali', 'aja', 'gak', 'nggak', 'enggak', 'ga',
        'selamat', 'pagi', 'siang', 'sore', 'malam', 'shinmates'
    );

    /**
     * Search WooCommerce products by keyword matching on title.
     *
     * @param string $message User's raw message.
     * @param int    $limit   Max number of results.
     * @return array Product metadata array (same format as Pinecone results).
     */
    public static function search( $message, $limit = 3 ) {
        $keywords = self::extract_keywords( $message );

        if ( empty( $keywords ) ) {
            return array();
        }

        $search_term = implode( ' ', $keywords );

        $args = array(
            'post_type'      => 'product',
            'post_status'    => 'publish',
            's'              => $search_term,
            'posts_per_page' => $limit,
            'meta_query'     => array(
                array(
                    'key'     => '_stock_status',
                    'value'   => 'instock',
                    'compare' => '='
                )
            )
        );

        $query = new WP_Query( $args );
        $results = array();

        if ( $query->have_posts() ) {
            while ( $query->have_posts() ) {
                $query->the_post();
                $product = wc_get_product( get_the_ID() );

                if ( ! $product ) {
                    continue;
                }

                $image_id  = $product->get_image_id();
                $image_url = $image_id ? wp_get_attachment_url( $image_id ) : '';
                $raw_price = $product->get_price();

                $results[] = array(
                    'product_id' => (int) $product->get_id(),
                    'title'      => $product->get_name(),
                    'price'      => is_numeric( $raw_price ) ? (float) $raw_price : 0,
                    'permalink'  => $product->get_permalink(),
                    'in_stock'   => $product->is_in_stock(),
                    'image_url'  => $image_url ? $image_url : ''
                );
            }
            wp_reset_postdata();
        }

        return $results;
    }

    /**
     * Extract meaningful keywords from a user message.
     * Removes stop words and short words (< 3 chars).
     *
     * @param string $message Raw user message.
     * @return string[] Filtered keyword array.
     */
    public static function extract_keywords( $message ) {
        $message = mb_strtolower( $message, 'UTF-8' );
        $message = preg_replace( '/[^\p{L}\p{N}\s]/u', '', $message );
        $words   = preg_split( '/\s+/', $message, -1, PREG_SPLIT_NO_EMPTY );

        $filtered = array();
        foreach ( $words as $word ) {
            $is_stop_word = in_array( $word, self::$stop_words, true );
            $is_too_short = mb_strlen( $word, 'UTF-8' ) < 3;

            if ( ! $is_stop_word && ! $is_too_short ) {
                $filtered[] = $word;
            }
        }

        return $filtered;
    }
}
