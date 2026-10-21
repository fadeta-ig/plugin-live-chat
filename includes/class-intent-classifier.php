<?php
/**
 * Intent Classifier
 *
 * Classifies user messages into structured intents using a combination
 * of local regex pre-checks and Groq LLM classification.
 * Returns: ['intent' => string, 'search_query' => string, 'order_number' => string]
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Intent_Classifier {

    /**
     * Valid intent constants.
     */
    const INTENT_GREETING      = 'GREETING';
    const INTENT_PRODUCT_QUERY = 'PRODUCT_QUERY';
    const INTENT_ORDER_TRACKING = 'ORDER_TRACKING';
    const INTENT_ORDER_DETAIL  = 'ORDER_DETAIL';
    const INTENT_ORDER_LIST    = 'ORDER_LIST';
    const INTENT_STORE_INFO    = 'STORE_INFO';
    const INTENT_OUT_OF_SCOPE  = 'OUT_OF_SCOPE';

    /**
     * Default result structure.
     */
    private static function default_result( $intent = self::INTENT_GREETING ) {
        return array(
            'intent'       => $intent,
            'search_query' => '',
            'order_number' => '',
        );
    }

    /**
     * Classify a user message into a structured intent.
     *
     * @param string $message Raw user message.
     * @return array Structured intent result.
     */
    public static function classify( $message ) {
        $clean = trim( mb_strtolower( $message, 'UTF-8' ) );

        // 1. Local pre-filter: simple greetings (0 API cost)
        if ( self::is_simple_greeting( $clean ) ) {
            return self::default_result( self::INTENT_GREETING );
        }

        // 2. Local pre-filter: extract order number if present
        $order_number = self::extract_order_number( $message );

        // 3. Local pre-filter: order-related keywords
        $order_intent = self::detect_order_intent( $clean );
        if ( $order_intent ) {
            $result = self::default_result( $order_intent );
            $result['order_number'] = $order_number;
            return $result;
        }

        // 4. For ambiguous messages, call Groq 8B classifier
        $groq = new AI_Woo_SA_Groq_Client();
        $llm_result = $groq->classify_intent( $message );

        // Override order_number from regex if LLM missed it
        if ( $order_number && empty( $llm_result['order_number'] ) ) {
            $llm_result['order_number'] = $order_number;
        }

        // Validate intent is recognized
        $valid_intents = array(
            self::INTENT_PRODUCT_QUERY,
            self::INTENT_ORDER_TRACKING,
            self::INTENT_ORDER_DETAIL,
            self::INTENT_ORDER_LIST,
            self::INTENT_STORE_INFO,
            self::INTENT_OUT_OF_SCOPE,
        );
        if ( ! in_array( $llm_result['intent'], $valid_intents, true ) ) {
            $llm_result['intent'] = self::INTENT_PRODUCT_QUERY;
        }

        return $llm_result;
    }

    /**
     * Detect simple greetings locally (no API call).
     */
    private static function is_simple_greeting( $clean_message ) {
        $greetings = array(
            'halo', 'hai', 'hi', 'hey', 'pagi', 'siang', 'sore',
            'malam', 'tes', 'test', 'helo', 'hello', 'p', 'min',
            'kak', 'selamat', 'assalamualaikum', 'permisi', 'bang',
            // Global greetings
            'good', 'morning', 'afternoon', 'evening', 'hola',
            'bonjour', 'ni', 'hao', 'konnichiwa', 'howdy',
        );
        $stripped = preg_replace( '/[^\p{L}\s]/u', '', $clean_message );
        $words = preg_split( '/\s+/', trim( $stripped ), -1, PREG_SPLIT_NO_EMPTY );

        if ( empty( $words ) || count( $words ) > 3 ) {
            return false;
        }

        foreach ( $words as $word ) {
            if ( ! in_array( $word, $greetings, true ) ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Extract order number from message using regex.
     * Matches: #12345, pesanan 12345, order 12345, no 12345
     */
    private static function extract_order_number( $message ) {
        // Match # followed by digits, or standalone 4+ digit numbers
        if ( preg_match( '/#(\d{3,})/', $message, $m ) ) {
            return $m[1];
        }
        // Match "pesanan/order/no/nomor" followed by digits
        if ( preg_match( '/(?:pesanan|order|no|nomor)\s*[:\s]?\s*(\d{3,})/iu', $message, $m ) ) {
            return $m[1];
        }
        return '';
    }

    /**
     * Detect order-related intent from keywords locally.
     *
     * @return string|null Intent constant or null if not order-related.
     */
    private static function detect_order_intent( $clean_message ) {
        $tracking_keywords = array(
            'lacak', 'tracking', 'resi', 'kirim', 'pengiriman',
            'sampai mana', 'sudah dikirim', 'posisi paket',
            'nomor resi', 'cek resi', 'paket saya',
            // Global tracking
            'track', 'where is', 'shipping status', 'shipped',
        );
        foreach ( $tracking_keywords as $kw ) {
            if ( mb_strpos( $clean_message, $kw, 0, 'UTF-8' ) !== false ) {
                return self::INTENT_ORDER_TRACKING;
            }
        }

        $detail_keywords = array(
            'detail pesanan', 'invoice', 'nota', 'struk',
            'total belanja', 'rincian pesanan',
            // Global detail
            'order details', 'receipt', 'bill',
        );
        foreach ( $detail_keywords as $kw ) {
            if ( mb_strpos( $clean_message, $kw, 0, 'UTF-8' ) !== false ) {
                return self::INTENT_ORDER_DETAIL;
            }
        }

        $list_keywords = array(
            'pesanan saya', 'pesanan terakhir', 'riwayat pesanan',
            'riwayat belanja', 'order saya', 'history pesanan',
            'daftar pesanan',
            // Global list
            'my orders', 'order history', 'recent orders',
        );
        foreach ( $list_keywords as $kw ) {
            if ( mb_strpos( $clean_message, $kw, 0, 'UTF-8' ) !== false ) {
                return self::INTENT_ORDER_LIST;
            }
        }

        return null;
    }
}
