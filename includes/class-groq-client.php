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

    /**
     * Reasoning models (gpt-oss) spend completion tokens on hidden reasoning BEFORE
     * writing the answer, so these limits must leave generous headroom.
     */
    const CLASSIFIER_MODEL                 = 'openai/gpt-oss-20b';
    const CLASSIFIER_MAX_COMPLETION_TOKENS = 600;
    const GENERATION_MAX_COMPLETION_TOKENS = 2048;
    const REASONING_MODEL_PREFIX           = 'openai/gpt-oss';

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

        $messages = $this->to_openai_messages( $system_instruction, $chat_history );
        $body     = $this->build_chat_body( $messages, false );

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

        $content = isset( $body_response['choices'][0]['message']['content'] )
            ? trim( (string) $body_response['choices'][0]['message']['content'] )
            : '';

        if ( $content === '' ) {
            return new WP_Error( 'groq_error', 'Empty or invalid response from Groq (reasoning may have exhausted the token budget).', $body_response );
        }

        return $content;
    }

    /**
     * Generate streaming response using Groq API via raw cURL
     * Directly echoes SSE chunks to the client.
     * 
     * @param string $system_instruction
     * @param array  $chat_history
     * @return string The full assistant text that was streamed ('' if the stream failed).
     */
    public function generate_content_stream( $system_instruction, $chat_history ) {
        if ( empty( $this->api_key ) ) {
            echo "data: [ERROR] API Key Missing\n\n";
            return '';
        }

        $messages = $this->to_openai_messages( $system_instruction, $chat_history );
        $body     = $this->build_chat_body( $messages, true );

        $accumulator = new AI_Woo_SA_Stream_Accumulator();

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
        curl_setopt( $ch, CURLOPT_WRITEFUNCTION, function( $curl_info, $data ) use ( $accumulator ) {
            // Check if the response is a JSON error (e.g., rate limit hit) instead of an SSE stream
            if ( strpos( $data, '"error"' ) !== false && strpos( $data, 'data:' ) === false ) {
                error_log( 'Groq Stream Error Response: ' . $data );
                $accumulator->mark_failed();
                $fallback_payload = wp_json_encode( array(
                    'choices' => array(
                        array( 'delta' => array( 'content' => 'TRIGGER_HUMAN_FALLBACK' ) )
                    )
                ) );
                echo "data: {$fallback_payload}\n\n";
            } else {
                $accumulator->feed( $data );
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
            $accumulator->mark_failed();
            // Send graceful error event so frontend doesn't hang
            echo "event: error\ndata: {\"error\":\"stream_failed\"}\n\n";
            flush();
        }
        curl_close( $ch );

        return $accumulator->get_text();
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
     * @param string $message             Raw user message.
     * @param string $conversation_digest Recent turns so follow-ups can be resolved.
     * @return array Parsed intent structure.
     */
    public function classify_intent( $message, $conversation_digest = '' ) {
        $default = array(
            'intent'       => 'PRODUCT_QUERY',
            'search_query' => $message,
            'order_number' => '',
        );

        if ( empty( $this->api_key ) ) {
            return $default;
        }

        $body = array(
            'model'                 => self::CLASSIFIER_MODEL,
            'messages'              => array(
                array( 'role' => 'system', 'content' => AI_Woo_SA_Intent_Prompt::build( (string) $conversation_digest ) ),
                array( 'role' => 'user', 'content' => 'PESAN TERAKHIR: ' . $message ),
            ),
            'temperature'           => 0.1,
            'max_completion_tokens' => self::CLASSIFIER_MAX_COMPLETION_TOKENS,
        );
        $body = $this->apply_reasoning_options( $body, self::CLASSIFIER_MODEL, 'low' );

        $response = wp_remote_post( $this->base_url, array(
            'headers' => array(
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key,
            ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 8,
        ) );

        if ( is_wp_error( $response ) ) {
            error_log( 'AI Woo SA Intent Router transport error: ' . $response->get_error_message() );
            return $default;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        if ( $status_code !== 200 ) {
            error_log( 'AI Woo SA Intent Router HTTP ' . $status_code . ': ' . wp_remote_retrieve_body( $response ) );
            return $default;
        }

        $body_response = json_decode( wp_remote_retrieve_body( $response ), true );
        $raw_content   = isset( $body_response['choices'][0]['message']['content'] )
            ? (string) $body_response['choices'][0]['message']['content']
            : '';

        $parsed = $this->extract_json_object( $raw_content );
        if ( ! isset( $parsed['intent'] ) ) {
            error_log( 'AI Woo SA Intent Router returned unparseable content: ' . $raw_content );
            return $default;
        }

        return array(
            'intent'       => sanitize_text_field( (string) $parsed['intent'] ),
            'search_query' => isset( $parsed['search_query'] ) ? sanitize_text_field( (string) $parsed['search_query'] ) : '',
            'order_number' => isset( $parsed['order_number'] ) ? sanitize_text_field( (string) $parsed['order_number'] ) : '',
        );
    }

    /**
     * Translate Gemini-format history into OpenAI/Groq chat messages.
     */
    private function to_openai_messages( $system_instruction, $chat_history ) {
        $messages = array(
            array( 'role' => 'system', 'content' => $system_instruction ),
        );

        foreach ( $chat_history as $msg ) {
            $text = isset( $msg['parts'][0]['text'] ) ? $msg['parts'][0]['text'] : '';
            if ( $text === '' ) {
                continue;
            }

            $messages[] = array(
                'role'    => ( $msg['role'] === 'model' ) ? 'assistant' : 'user',
                'content' => $text,
            );
        }

        return $messages;
    }

    private function build_chat_body( array $messages, bool $stream ): array {
        $body = array(
            'model'                 => $this->model,
            'messages'              => $messages,
            'temperature'           => 0.3,
            'top_p'                 => 0.85,
            'max_completion_tokens' => self::GENERATION_MAX_COMPLETION_TOKENS,
        );

        if ( $stream ) {
            $body['stream'] = true;
        }

        $effort = (string) apply_filters( 'ai_woo_sa_groq_reasoning_effort', 'medium' );

        return $this->apply_reasoning_options( $body, $this->model, $effort );
    }

    /**
     * gpt-oss only. Other models (e.g. llama) reject these parameters with HTTP 400.
     * Reasoning text is excluded so chain-of-thought never reaches the browser.
     */
    private function apply_reasoning_options( array $body, string $model, string $effort ): array {
        if ( strpos( $model, self::REASONING_MODEL_PREFIX ) !== 0 ) {
            return $body;
        }

        $body['reasoning_effort']  = $effort;
        $body['include_reasoning'] = false;

        return $body;
    }

    /**
     * Pulls the first JSON object out of a model reply, tolerating code fences and stray prose.
     */
    private function extract_json_object( string $raw ): array {
        $unfenced = preg_replace( '/^```(?:json)?\s*|\s*```$/i', '', trim( $raw ) );
        if ( preg_match( '/\{.*\}/s', (string) $unfenced, $matches ) !== 1 ) {
            return array();
        }

        $decoded = json_decode( $matches[0], true );

        return is_array( $decoded ) ? $decoded : array();
    }
}
