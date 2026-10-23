<?php
/**
 * Groq API Client Class
 * 
 * Handles communication with Groq API (OpenAI compatible endpoint).
 * Used specifically for chat generation to leverage Groq LPU high-speed inference.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Groq_Client {

    private $api_key;
    private $model;
    private $base_url = 'https://api.groq.com/openai/v1/chat/completions';

    public function __construct() {
        $options = get_option( 'ai_woo_sa_settings' );
        $this->api_key = isset( $options['groq_api_key'] ) ? $options['groq_api_key'] : '';
        $this->model   = isset( $options['groq_model'] ) ? $options['groq_model'] : 'openai/gpt-oss-120b';
    }

    /**
     * Generate response using Groq API
     * 
     * @param string $system_instruction The system prompt.
     * @param array  $chat_history       History in Gemini format: [['role'=>'user', 'parts'=>[['text'=>'hi']]]]
     * @return string|WP_Error           The text response or error.
     */
    public function generate_content( $system_instruction, $chat_history ) {
        if ( empty( $this->api_key ) ) {
            return new WP_Error( 'no_api_key', 'Groq API Key is missing.' );
        }

        // Translate Gemini chat history format to Groq (OpenAI) format
        $messages = array();
        
        // 1. Add System Instruction
        $messages[] = array(
            'role'    => 'system',
            'content' => $system_instruction
        );

        // 2. Add History
        foreach ( $chat_history as $msg ) {
            $role = ( $msg['role'] === 'model' ) ? 'assistant' : 'user';
            $text = isset( $msg['parts'][0]['text'] ) ? $msg['parts'][0]['text'] : '';
            
            if ( ! empty( $text ) ) {
                $messages[] = array(
                    'role'    => $role,
                    'content' => $text
                );
            }
        }

        $body = array(
            'model'       => $this->model,
            'messages'    => $messages,
            'temperature' => 0.3,
            'max_tokens'  => 1536,
            'top_p'       => 0.85
        );

        $response = wp_remote_post( $this->base_url, array(
            'headers' => array(
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key
            ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 45
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $body_response = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status_code !== 200 ) {
            return new WP_Error( 'groq_error', 'Failed to generate content via Groq.', $body_response );
        }

        if ( isset( $body_response['choices'][0]['message']['content'] ) ) {
            return $body_response['choices'][0]['message']['content'];
        }

        return new WP_Error( 'groq_error', 'Invalid response structure from Groq.', $body_response );
    }

    /**
     * Generate streaming response using Groq API via raw cURL
     * Directly echoes SSE chunks to the client.
     * 
     * @param string $system_instruction
     * @param array  $chat_history
     * @return void
     */
    public function generate_content_stream( $system_instruction, $chat_history ) {
        if ( empty( $this->api_key ) ) {
            echo "data: [ERROR] API Key Missing\n\n";
            return;
        }

        $messages = array();
        $messages[] = array( 'role' => 'system', 'content' => $system_instruction );
        
        foreach ( $chat_history as $msg ) {
            $role = ( $msg['role'] === 'model' ) ? 'assistant' : 'user';
            $text = isset( $msg['parts'][0]['text'] ) ? $msg['parts'][0]['text'] : '';
            if ( ! empty( $text ) ) {
                $messages[] = array( 'role' => $role, 'content' => $text );
            }
        }

        $body = array(
            'model'       => $this->model,
            'messages'    => $messages,
            'temperature' => 0.3,
            'max_tokens'  => 1536,
            'top_p'       => 0.85,
            'stream'      => true
        );

        $ch = curl_init( $this->base_url );
        curl_setopt( $ch, CURLOPT_RETURNTRANSFER, false );
        curl_setopt( $ch, CURLOPT_POST, true );
        curl_setopt( $ch, CURLOPT_POSTFIELDS, wp_json_encode( $body ) );
        curl_setopt( $ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->api_key
        ) );

        // Timeout settings for Hostinger LiteSpeed compatibility
        curl_setopt( $ch, CURLOPT_CONNECTTIMEOUT, 10 );
        curl_setopt( $ch, CURLOPT_TIMEOUT, 90 );

        // Callback function to handle incoming stream chunks
        curl_setopt( $ch, CURLOPT_WRITEFUNCTION, function( $curl_info, $data ) {
            // Check if the response is a JSON error (e.g., rate limit hit) instead of an SSE stream
            if ( strpos( $data, '"error"' ) !== false && strpos( $data, 'data:' ) === false ) {
                error_log( 'Groq Stream Error Response: ' . $data );
                $fallback_payload = wp_json_encode( array(
                    'choices' => array(
                        array( 'delta' => array( 'content' => 'TRIGGER_HUMAN_FALLBACK' ) )
                    )
                ) );
                echo "data: {$fallback_payload}\n\n";
            } else {
                $sanitized_data = class_exists( 'AI_Woo_SA_Security_Guard' )
                    ? AI_Woo_SA_Security_Guard::sanitize_outgoing_response( $data )
                    : $data;
                echo $sanitized_data;
            }

            if ( ob_get_level() > 0 ) {
                ob_flush();
            }
            flush();
            return strlen( $data );
        } );

        curl_exec( $ch );
        if ( curl_errno( $ch ) ) {
            $curl_error = curl_error( $ch );
            error_log( 'Groq cURL Error: ' . $curl_error );
            // Send graceful error event so frontend doesn't hang
            echo "event: error\ndata: {\"error\":\"stream_failed\"}\n\n";
            flush();
        }
        curl_close( $ch );
    }

    /**
     * Rewrite conversational user message into a clean search query.
     * Extracts keywords focused on conditions or product names.
     * 
     * @param string $message The raw user message
     * @return string The cleaned search query, or original message if failed
     */
    public function rewrite_query_for_search( $message ) {
        if ( empty( $this->api_key ) ) {
            return $message;
        }

        // Fast and cheap model for rewriting
        $model = 'openai/gpt-oss-20b';

        $system_prompt = "Anda adalah AI ekstraktor niat pencarian e-commerce kecantikan. Tugas Anda melakukan penalaran singkat untuk mendeteksi apakah pesan pembeli mengandung keluhan kondisi kulit/rambut ATAU permintaan produk.\n"
                       . "ATURAN PENALARAN:\n"
                       . "1. JIKA pesan HANYA sapaan (contoh: 'halo', 'pagi') atau pertanyaan umum tanpa niat mencari solusi/produk (contoh: 'bisa COD?', 'terima kasih'), WAJIB balas HANYA dengan: NO_PRODUCT_INTENT\n"
                       . "2. JIKA ada niat mencari produk atau keluhan (contoh: 'rambut lepek', 'kulit kusam', 'ada serum?'), ekstraksi dan simpulkan maksimal 5 kata kunci produk/masalah yang paling relevan untuk pencarian katalog.\n"
                       . "Contoh 1: 'Halo min' -> NO_PRODUCT_INTENT\n"
                       . "Contoh 2: 'Min rambut saya ketombe parah dan rontok' -> 'perawatan rambut ketombe rontok'\n"
                       . "Contoh 3: 'Bisa kirim gojek hari ini?' -> NO_PRODUCT_INTENT\n"
                       . "Contoh 4: 'Muka lagi breakout banyak jerawat pasir' -> 'serum jerawat bruntusan breakout'";

        $body = array(
            'model'       => $model,
            'messages'    => array(
                array( 'role' => 'system', 'content' => $system_prompt ),
                array( 'role' => 'user', 'content' => $message )
            ),
            'temperature' => 0.1, // Low temp for deterministic output
            'max_tokens'  => 30
        );

        $response = wp_remote_post( $this->base_url, array(
            'headers' => array(
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key
            ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 5 // Fast timeout so it doesn't block
        ) );

        if ( is_wp_error( $response ) ) {
            return $message;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        if ( $status_code !== 200 ) {
            return $message;
        }

        $body_response = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( isset( $body_response['choices'][0]['message']['content'] ) ) {
            $rewritten = trim( $body_response['choices'][0]['message']['content'] );
            // Fallback if empty
            return empty( $rewritten ) ? $message : $rewritten;
        }

        return $message;
    }

    /**
     * Classify user message into structured intent using Groq high-speed reasoning model.
     * Returns JSON with: intent, search_query, order_number.
     *
     * @param string $message Raw user message.
     * @return array Parsed intent structure.
     */
    public function classify_intent( $message ) {
        $default = array(
            'intent'       => 'PRODUCT_QUERY',
            'search_query' => $message,
            'order_number' => '',
        );

        if ( empty( $this->api_key ) ) {
            return $default;
        }

        $model = 'openai/gpt-oss-20b';

        $system_prompt  = "Anda adalah AI intent classifier cerdas untuk e-commerce skincare/bodycare. ";
        $system_prompt .= "Gunakan penalaran logis untuk menganalisis kebutuhan pengguna dan output JSON SAJA tanpa format markdown atau penjelasan lain.\n";
        $system_prompt .= "Format: {\"intent\":\"...\",\"search_query\":\"...\",\"order_number\":\"...\"}\n\n";
        $system_prompt .= "Daftar Intent:\n";
        $system_prompt .= "- PRODUCT_QUERY: mencari/tanya produk, konsultasi masalah kulit/rambut, rekomendasi, bahan aktif, cara pakai\n";
        $system_prompt .= "- ORDER_TRACKING: lacak pesanan, status pengiriman, cek resi, paket sudah sampai mana\n";
        $system_prompt .= "- ORDER_DETAIL: detail pesanan, invoice, rincian belanja, isi paket\n";
        $system_prompt .= "- ORDER_LIST: riwayat pesanan, pesanan terakhir, daftar belanjaan saya\n";
        $system_prompt .= "- STORE_INFO: info toko, metode COD, ongkir, kurir, jam operasional, cara order\n";
        $system_prompt .= "- OUT_OF_SCOPE: topik di luar toko, kecantikan, atau perawatan tubuh\n\n";
        $system_prompt .= "Panduan Penalaran (search_query & order_number):\n";
        $system_prompt .= "- JIKA intent=PRODUCT_QUERY: rumuskan kata kunci pencarian yang spesifik dan efektif dalam BAHASA INDONESIA (terjemahkan jika pengguna memakai bahasa asing).\n";
        $system_prompt .= "- JIKA intent selain PRODUCT_QUERY: kosongkan search_query (\"\").\n";
        $system_prompt .= "- JIKA ada angka resi/pesanan (misal #12345 atau 12345): ekstrak ke order_number, jika tidak kosongkan (\"\").\n\n";
        $system_prompt .= "Contoh:\n";
        $system_prompt .= "\"muka kusam banyak flek hitam\" -> {\"intent\":\"PRODUCT_QUERY\",\"search_query\":\"mencerahkan wajah flek hitam\",\"order_number\":\"\"}\n";
        $system_prompt .= "\"best brightening serum for oily skin\" -> {\"intent\":\"PRODUCT_QUERY\",\"search_query\":\"serum pencerah kulit berminyak\",\"order_number\":\"\"}\n";
        $system_prompt .= "\"lacak pesanan #9821\" -> {\"intent\":\"ORDER_TRACKING\",\"search_query\":\"\",\"order_number\":\"9821\"}\n";
        $system_prompt .= "\"pesanan saya 7721 sudah dikirim belum?\" -> {\"intent\":\"ORDER_TRACKING\",\"search_query\":\"\",\"order_number\":\"7721\"}\n";
        $system_prompt .= "\"bisa bayar di tempat (COD)?\" -> {\"intent\":\"STORE_INFO\",\"search_query\":\"\",\"order_number\":\"\"}\n";
        $system_prompt .= "\"siapa presiden prancis?\" -> {\"intent\":\"OUT_OF_SCOPE\",\"search_query\":\"\",\"order_number\":\"\"}";

        $body = array(
            'model'       => $model,
            'messages'    => array(
                array( 'role' => 'system', 'content' => $system_prompt ),
                array( 'role' => 'user', 'content' => $message ),
            ),
            'temperature' => 0.05,
            'max_tokens'  => 100,
        );

        $response = wp_remote_post( $this->base_url, array(
            'headers' => array(
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key,
            ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 5,
        ) );

        if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) !== 200 ) {
            return $default;
        }

        $body_response = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( ! isset( $body_response['choices'][0]['message']['content'] ) ) {
            return $default;
        }

        $raw = trim( $body_response['choices'][0]['message']['content'] );

        // Strip markdown code fences if present
        $raw = preg_replace( '/^```(?:json)?\s*/i', '', $raw );
        $raw = preg_replace( '/\s*```$/', '', $raw );

        $parsed = json_decode( $raw, true );

        if ( ! is_array( $parsed ) || ! isset( $parsed['intent'] ) ) {
            return $default;
        }

        return array(
            'intent'       => sanitize_text_field( $parsed['intent'] ),
            'search_query' => isset( $parsed['search_query'] ) ? sanitize_text_field( $parsed['search_query'] ) : '',
            'order_number' => isset( $parsed['order_number'] ) ? sanitize_text_field( $parsed['order_number'] ) : '',
        );
    }
}
