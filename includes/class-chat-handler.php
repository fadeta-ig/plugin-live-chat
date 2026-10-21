<?php
/**
 * Chat Handler Class
 *
 * Handles the REST API endpoint for the AI Sales Assistant chat.
 * Implements Intent Router: classifies user intent first, then routes
 * to appropriate data source (products, orders, or SOP knowledge).
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Chat_Handler {

    /**
     * Cosine similarity threshold for product relevance.
     */
    const SIMILARITY_THRESHOLD = 0.65;

    public static function register_routes() {
        register_rest_route( 'ai-assistant/v1', '/chat', array(
            'methods'  => 'POST',
            'callback' => array( __CLASS__, 'handle_chat_request' ),
            'permission_callback' => '__return_true',
        ) );
    }

    public static function handle_chat_request( WP_REST_Request $request ) {
        // ============================================================
        // SECURITY LAYER 0: IP Firewall Check (Immediate Early Drop)
        // ============================================================
        $client_ip = AI_Woo_SA_Security_Guard::get_client_ip();
        if ( AI_Woo_SA_Security_Guard::is_ip_blocked( $client_ip ) ) {
            return rest_ensure_response( array(
                'text'     => 'Akses obrolan untuk alamat IP Anda telah diblokir demi alasan keamanan dan integritas sistem.',
                'products' => array(),
                'orders'   => array(),
                'fallback' => false,
                'blocked'  => true,
            ) );
        }

        // ============================================================
        // SECURITY LAYER 0.1: Anti-CORS / Foreign Domain Siphoning Guard
        // ============================================================
        if ( ! AI_Woo_SA_Security_Guard::is_request_origin_allowed( $request ) ) {
            return new WP_Error( 'cross_origin_forbidden', 'Akses dari domain luar tidak diizinkan.', array( 'status' => 403 ) );
        }

        // ============================================================
        // SECURITY LAYER 0.5: Strict Request Payload Schema Validation
        // ============================================================
        $raw_params = $request->get_json_params();
        $validation = AI_Woo_SA_Security_Guard::validate_request_payload( is_array( $raw_params ) ? $raw_params : array() );
        if ( is_wp_error( $validation ) ) {
            return $validation;
        }

        $message         = $validation['message'];
        $session_id      = $validation['session_id'];
        $current_product = $validation['current_product'];
        $cart_items      = $validation['cart_items'];

        // ============================================================
        // RATE LIMITING (Session & IP-Based)
        // ============================================================
        // 1. Session-based rate limit: max 20 requests per 60s
        $rate_limit_key = 'ai_woo_sa_rate_' . md5( $session_id );
        $rate_data = get_transient( $rate_limit_key );
        if ( ! is_array( $rate_data ) || ( time() - $rate_data['timestamp'] > 60 ) ) {
            $rate_data = array( 'count' => 0, 'timestamp' => time() );
        }
        $rate_data['count']++;
        if ( $rate_data['count'] > 20 ) {
            return new WP_Error( 'too_many_requests', 'Anda telah mencapai batas pesan. Mohon tunggu 1 menit sebelum mengirim pesan lagi.', array( 'status' => 429 ) );
        }
        set_transient( $rate_limit_key, $rate_data, 60 );

        // 2. IP-based rate limit: max 30 requests per 60s (prevents session rotation bypass)
        $ip_rate_key = 'ai_woo_sa_rate_ip_' . md5( $client_ip );
        $ip_rate_data = get_transient( $ip_rate_key );
        if ( ! is_array( $ip_rate_data ) || ( time() - $ip_rate_data['timestamp'] > 60 ) ) {
            $ip_rate_data = array( 'count' => 0, 'timestamp' => time() );
        }
        $ip_rate_data['count']++;
        if ( $ip_rate_data['count'] > 30 ) {
            return new WP_Error( 'too_many_requests', 'Terlalu banyak permintaan dari jaringan Anda. Mohon tunggu 1 menit.', array( 'status' => 429 ) );
        }
        set_transient( $ip_rate_key, $ip_rate_data, 60 );

        // ============================================================
        // SECURITY LAYER 1: Pre-Flight Threat & Injection Inspection
        // ============================================================
        $threat = AI_Woo_SA_Security_Guard::inspect_threat( $message );
        if ( $threat['is_threat'] ) {
            $is_blocked   = AI_Woo_SA_Security_Guard::record_violation( $client_ip, $threat );
            $refusal_text = AI_Woo_SA_Security_Guard::get_security_refusal_message( $is_blocked );

            AI_Woo_SA_Chat_Logger::log(
                $session_id,
                $message,
                $refusal_text,
                false,
                0,
                0.0,
                'SECURITY_VIOLATION'
            );

            return rest_ensure_response( array(
                'text'     => $refusal_text,
                'products' => array(),
                'orders'   => array(),
                'fallback' => false,
                'blocked'  => $is_blocked,
            ) );
        }

        $options = get_option( 'ai_woo_sa_settings' );
        $store_sop = isset( $options['store_sop'] ) ? $options['store_sop'] : '';
        $whatsapp_number = isset( $options['whatsapp_number'] ) ? $options['whatsapp_number'] : '';

        // Early exit: Check for complaint/frustration keywords
        if ( AI_Woo_SA_Chat_Utils::is_complaint( $message ) ) {
            return AI_Woo_SA_Chat_Utils::trigger_human_fallback( $whatsapp_number, $session_id, $message );
        }

        // ============================================================
        //  STEP 1: Intent Classification
        // ============================================================
        $intent_result = AI_Woo_SA_Intent_Classifier::classify( $message );
        $intent        = $intent_result['intent'];
        $search_query  = $intent_result['search_query'];
        $order_number  = $intent_result['order_number'];

        // Out of scope → immediate fallback
        if ( $intent === AI_Woo_SA_Intent_Classifier::INTENT_OUT_OF_SCOPE ) {
            return AI_Woo_SA_Chat_Utils::trigger_human_fallback( $whatsapp_number, $session_id, $message );
        }

        // --- GREETING & STORE_INFO BRANCH ---
        if ( in_array( $intent, array( AI_Woo_SA_Intent_Classifier::INTENT_GREETING, AI_Woo_SA_Intent_Classifier::INTENT_STORE_INFO ), true ) ) {
            // No product or order context needed. SOP is sufficient.
            // Proceed directly to STEP 3 with empty context.
        }

        // ============================================================
        //  STEP 2: Data Fetching based on Intent
        // ============================================================
        $gemini = new AI_Woo_SA_Gemini_Client();
        $embedding = null;
        $context_products = array();
        $recommended_products = array();
        $highest_score = 0;
        $order_context_text = '';
        $order_data_for_frontend = array();

        // Load semantic cache
        $semantic_cache = get_transient( 'ai_woo_sa_semantic_cache' );
        if ( ! is_array( $semantic_cache ) ) {
            $semantic_cache = array();
        }

        $curr_prod_id = isset( $current_product['id'] ) ? $current_product['id'] : '';

        // --- PRODUCT_QUERY BRANCH ---
        if ( $intent === AI_Woo_SA_Intent_Classifier::INTENT_PRODUCT_QUERY ) {
            $resolved = self::resolve_product_context(
                $search_query, $gemini, $semantic_cache,
                $curr_prod_id, $cart_items, $session_id,
                $message, $whatsapp_number
            );

            // Early return if semantic cache hit or error
            if ( isset( $resolved['early_return'] ) ) {
                return $resolved['early_return'];
            }

            $embedding = $resolved['embedding'];
            $context_products = $resolved['context_products'];
            $recommended_products = $resolved['recommended_products'];
            $highest_score = $resolved['highest_score'];
        }

        // --- ORDER BRANCHES ---
        if ( in_array( $intent, array(
            AI_Woo_SA_Intent_Classifier::INTENT_ORDER_TRACKING,
            AI_Woo_SA_Intent_Classifier::INTENT_ORDER_DETAIL,
            AI_Woo_SA_Intent_Classifier::INTENT_ORDER_LIST,
        ), true ) ) {
            $resolved = self::resolve_order_context( $intent, $order_number );
            $order_context_text = $resolved['context_text'];
            $order_data_for_frontend = $resolved['frontend_data'];
        }

        // ============================================================
        //  STEP 3: Assemble System Prompt
        // ============================================================
        $product_context_text = empty( $context_products )
            ? "Tidak ada produk yang relevan ditemukan."
            : implode( "\n", $context_products );

        $system_instruction = AI_Woo_SA_Prompt_Builder::build_system_prompt(
            $store_sop, $product_context_text, $order_context_text,
            $current_product, $cart_items
        );

        // ============================================================
        //  STEP 4: Session Memory
        // ============================================================
        $transient_key = 'ai_woo_sa_' . md5( $session_id );
        $chat_history = get_transient( $transient_key );
        if ( ! is_array( $chat_history ) ) {
            $chat_history = array();
        }

        $chat_history[] = array(
            'role'  => 'user',
            'parts' => array( array( 'text' => $message ) ),
        );

        if ( count( $chat_history ) > 10 ) {
            $chat_history = array_slice( $chat_history, -10 );
        }

        // ============================================================
        //  STEP 5: LLM Generation
        // ============================================================
        $llm_provider = isset( $options['llm_provider'] ) ? $options['llm_provider'] : 'gemini';
        $wants_stream = isset( $params['stream'] ) ? (bool) $params['stream'] : false;

        if ( $llm_provider === 'groq' && $wants_stream ) {
            return AI_Woo_SA_SSE_Handler::handle_streaming_response(
                $system_instruction, $chat_history,
                $recommended_products, $order_data_for_frontend,
                $session_id, $message, $highest_score, $intent
            );
        }

        if ( $llm_provider === 'groq' ) {
            $groq_gen = new AI_Woo_SA_Groq_Client();
            $bot_response_text = $groq_gen->generate_content( $system_instruction, $chat_history );
            $error_prefix = 'AI Woo SA Groq Error: ';
        } else {
            $bot_response_text = $gemini->generate_content( $system_instruction, $chat_history );
            $error_prefix = 'AI Woo SA Gemini Error: ';
        }

        if ( is_wp_error( $bot_response_text ) ) {
            error_log( $error_prefix . $bot_response_text->get_error_message() );
            return AI_Woo_SA_Chat_Utils::trigger_human_fallback( $whatsapp_number, $session_id, $message );
        }

        if ( strpos( trim( $bot_response_text ), 'TRIGGER_HUMAN_FALLBACK' ) !== false ) {
            return AI_Woo_SA_Chat_Utils::trigger_human_fallback( $whatsapp_number, $session_id, $message );
        }

        // ============================================================
        // SECURITY LAYER 3: Outgoing Secret Scrubbing
        // ============================================================
        $bot_response_text = AI_Woo_SA_Security_Guard::sanitize_outgoing_response( $bot_response_text );

        // ============================================================
        //  STEP 6: Persist & Respond
        // ============================================================
        $chat_history[] = array(
            'role'  => 'model',
            'parts' => array( array( 'text' => $bot_response_text ) ),
        );
        set_transient( $transient_key, $chat_history, 24 * HOUR_IN_SECONDS );

        AI_Woo_SA_Chat_Logger::log( $session_id, $message, $bot_response_text, false, count( $recommended_products ), $highest_score, $intent );

        // Update semantic cache (only for product queries with valid embedding)
        if ( $embedding ) {
            $fresh_cache = get_transient( 'ai_woo_sa_semantic_cache' );
            if ( ! is_array( $fresh_cache ) ) {
                $fresh_cache = array();
            }
            $fresh_cache[] = array(
                'vector'             => $embedding,
                'response'           => $bot_response_text,
                'products'           => $recommended_products,
                'current_product_id' => $curr_prod_id,
                'time'               => time(),
            );
            if ( count( $fresh_cache ) > 50 ) {
                array_shift( $fresh_cache );
            }
            set_transient( 'ai_woo_sa_semantic_cache', $fresh_cache, 24 * HOUR_IN_SECONDS );
        }

        return rest_ensure_response( array(
            'text'     => $bot_response_text,
            'products' => $recommended_products,
            'orders'   => $order_data_for_frontend,
            'fallback' => false,
        ) );
    }

    // ================================================================
    //  INTENT DATA RESOLVERS
    // ================================================================

    /**
     * Resolve product context: embedding, Pinecone, keyword search.
     */
    private static function resolve_product_context(
        $search_query, $gemini, $semantic_cache,
        $curr_prod_id, $cart_items, $session_id,
        $message, $whatsapp_number
    ) {
        $context_products = array();
        $recommended_products = array();
        $highest_score = 0;

        $embedding = $gemini->get_embedding( $search_query );
        if ( is_wp_error( $embedding ) ) {
            error_log( 'AI Woo SA Embedding Error: ' . $embedding->get_error_message() );
            return array( 'early_return' => AI_Woo_SA_Chat_Utils::trigger_human_fallback( $whatsapp_number, $session_id, $message ) );
        }

        // Semantic cache check
        foreach ( $semantic_cache as $cache_item ) {
            $cache_prod_id = isset( $cache_item['current_product_id'] ) ? $cache_item['current_product_id'] : '';
            if ( $curr_prod_id === $cache_prod_id && isset( $cache_item['vector'] ) && AI_Woo_SA_Chat_Utils::calculate_cosine_similarity( $embedding, $cache_item['vector'] ) > 0.95 ) {
                AI_Woo_SA_Chat_Logger::log( $session_id, $message, $cache_item['response'], false, count( $cache_item['products'] ), 0.99, 'PRODUCT_QUERY' );
                return array( 'early_return' => rest_ensure_response( array(
                    'text'     => $cache_item['response'],
                    'products' => $cache_item['products'],
                    'orders'   => array(),
                    'fallback' => false,
                ) ) );
            }
        }

        // Pinecone vector search
        $pinecone = new AI_Woo_SA_Pinecone_Client();
        $filter = array( 'in_stock' => array( '$eq' => true ) );
        $pinecone_res = $pinecone->query( $embedding, 3, $filter );

        if ( is_wp_error( $pinecone_res ) ) {
            error_log( 'AI Woo SA Pinecone Error: ' . $pinecone_res->get_error_message() );
            return array( 'early_return' => AI_Woo_SA_Chat_Utils::trigger_human_fallback( $whatsapp_number, $session_id, $message ) );
        }

        $matches = isset( $pinecone_res['matches'] ) ? $pinecone_res['matches'] : array();

        // Build cart filter
        $cart_product_ids = array();
        foreach ( $cart_items as $c_item ) {
            if ( isset( $c_item['id'] ) ) {
                $cart_product_ids[] = (int) $c_item['id'];
            }
        }

        // Evaluate similarity scores
        foreach ( $matches as $match ) {
            $score = isset( $match['score'] ) ? (float) $match['score'] : 0;
            if ( $score > $highest_score ) {
                $highest_score = $score;
            }
            if ( $score >= self::SIMILARITY_THRESHOLD && isset( $match['metadata'] ) ) {
                $meta = $match['metadata'];
                $p_id = isset( $meta['product_id'] ) ? (int) $meta['product_id'] : 0;
                $price_display = isset( $meta['price'] ) ? number_format( (float) $meta['price'], 0, ',', '.' ) : '0';
                $short_desc = isset( $meta['short_desc'] ) ? $meta['short_desc'] : '';
                
                $info_text = ! empty( $short_desc ) ? ". Info: {$short_desc}" : '';
                $context_products[] = "- [ID: {$p_id}] {$meta['title']} (Harga: Rp{$price_display}){$info_text}";

                if ( ! in_array( $p_id, $cart_product_ids, true ) ) {
                    $recommended_products[] = $meta;
                }
            }
        }

        // Hybrid keyword search
        $keyword_results = AI_Woo_SA_Keyword_Search::search( $search_query, 3 );
        if ( ! empty( $keyword_results ) ) {
            $existing_ids = array_map( function( $p ) {
                return isset( $p['product_id'] ) ? (int) $p['product_id'] : 0;
            }, $recommended_products );

            foreach ( $keyword_results as $kw_product ) {
                $kw_p_id = isset( $kw_product['product_id'] ) ? (int) $kw_product['product_id'] : 0;
                if ( ! in_array( $kw_p_id, $existing_ids, true ) ) {
                    $kw_price = number_format( (float) $kw_product['price'], 0, ',', '.' );
                    array_unshift( $context_products, "- [ID: {$kw_p_id}] {$kw_product['title']} (Harga: Rp{$kw_price})" );
                    if ( ! in_array( $kw_p_id, $cart_product_ids, true ) ) {
                        array_unshift( $recommended_products, $kw_product );
                    }
                }
            }
        }

        return array(
            'embedding'            => $embedding,
            'context_products'     => $context_products,
            'recommended_products' => $recommended_products,
            'highest_score'        => $highest_score,
        );
    }

    /**
     * Resolve order context based on intent type.
     */
    private static function resolve_order_context( $intent, $order_number ) {
        $user_id = get_current_user_id();

        // Guest users → redirect to tracking page
        if ( ! $user_id ) {
            $options = get_option( 'ai_woo_sa_settings' );
            $tracking_url = isset( $options['order_tracking_url'] )
                ? $options['order_tracking_url']
                : 'https://shinyoungbeauty.com/lacak-pesanan/';

            return array(
                'context_text'  => "[USER BELUM LOGIN] Tidak bisa mengakses data pesanan. Arahkan ke halaman lacak pesanan.",
                'frontend_data' => array( 'guest_redirect' => $tracking_url ),
            );
        }

        // Logged-in user: fetch order data
        $context_text = '';
        $frontend_data = array();

        switch ( $intent ) {
            case AI_Woo_SA_Intent_Classifier::INTENT_ORDER_TRACKING:
            case AI_Woo_SA_Intent_Classifier::INTENT_ORDER_DETAIL:
                if ( ! empty( $order_number ) ) {
                    $order = AI_Woo_SA_Order_Service::find_order_for_user( $order_number, $user_id );
                    if ( $order ) {
                        $context_text = "[DATA PESANAN]\n" . AI_Woo_SA_Order_Service::build_order_context( $order );
                        $frontend_data = array( 'orders' => array( $order ) );
                    } else {
                        $context_text = "[DATA PESANAN] Pesanan #{$order_number} tidak ditemukan atau bukan milik pelanggan ini.";
                    }
                } else {
                    // No order number specified → show recent orders
                    $orders = AI_Woo_SA_Order_Service::get_recent_orders( $user_id, 2 );
                    $total = AI_Woo_SA_Order_Service::get_total_order_count( $user_id );
                    $context_text = "[DATA PESANAN]\n" . AI_Woo_SA_Order_Service::build_order_list_context( $orders, $total );
                    $frontend_data = array( 'orders' => $orders );
                }
                break;

            case AI_Woo_SA_Intent_Classifier::INTENT_ORDER_LIST:
                $orders = AI_Woo_SA_Order_Service::get_recent_orders( $user_id, 2 );
                $total = AI_Woo_SA_Order_Service::get_total_order_count( $user_id );
                $context_text = "[DATA PESANAN]\n" . AI_Woo_SA_Order_Service::build_order_list_context( $orders, $total );
                $frontend_data = array( 'orders' => $orders );
                break;
        }

        return array(
            'context_text'  => $context_text,
            'frontend_data' => $frontend_data,
        );
    }
}
