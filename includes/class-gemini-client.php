<?php
/**
 * Gemini Client Class
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Gemini_Client {

    private $api_key;
    private $model;
    private $base_url = 'https://generativelanguage.googleapis.com/v1beta/models/';

    public function __construct() {
        $options = get_option( 'ai_woo_sa_settings' );
        $this->api_key = isset( $options['gemini_api_key'] ) ? $options['gemini_api_key'] : '';
        $this->model   = isset( $options['gemini_model'] ) ? $options['gemini_model'] : 'gemini-2.5-flash';
    }

    /**
     * Get Embeddings using text-embedding-004
     */
    public function get_embedding( $text ) {
        if ( empty( $this->api_key ) ) {
            return new WP_Error( 'no_api_key', 'Gemini API Key is missing.' );
        }

        $url = $this->base_url . 'gemini-embedding-001:embedContent?key=' . $this->api_key;

        $body = array(
            'model' => 'models/gemini-embedding-001',
            'content' => array(
                'parts' => array(
                    array( 'text' => $text )
                )
            ),
            'outputDimensionality' => 768
        );

        $response = wp_remote_post( $url, array(
            'headers' => array( 'Content-Type' => 'application/json' ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 30
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $body_response = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status_code !== 200 ) {
            return new WP_Error( 'gemini_error', 'Failed to generate embedding.', $body_response );
        }

        if ( isset( $body_response['embedding']['values'] ) ) {
            return $body_response['embedding']['values'];
        }

        return new WP_Error( 'gemini_error', 'Invalid response structure.', $body_response );
    }

    /**
     * Generate response using gemini-1.5-flash
     */
    public function generate_content( $system_instruction, $chat_history ) {
        if ( empty( $this->api_key ) ) {
            return new WP_Error( 'no_api_key', 'Gemini API Key is missing.' );
        }

        $url = $this->base_url . $this->model . ':generateContent?key=' . $this->api_key;

        $body = array(
            'system_instruction' => array(
                'parts' => array(
                    array( 'text' => $system_instruction )
                )
            ),
            'contents' => $chat_history,
            'generationConfig' => array(
                'temperature' => 0.2,
                'topK' => 40,
                'topP' => 0.90,
                'maxOutputTokens' => 2048,
            )
        );

        $response = wp_remote_post( $url, array(
            'headers' => array( 'Content-Type' => 'application/json' ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 45
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $body_response = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status_code !== 200 ) {
            return new WP_Error( 'gemini_error', 'Failed to generate content.', $body_response );
        }

        // Check if blocked by safety settings
        if ( isset( $body_response['promptFeedback']['blockReason'] ) ) {
            return new WP_Error( 'gemini_blocked', 'Request blocked by safety settings: ' . $body_response['promptFeedback']['blockReason'], $body_response );
        }

        $answer_text = $this->extract_answer_text( $body_response );
        if ( $answer_text !== '' ) {
            return $answer_text;
        }

        return new WP_Error( 'gemini_error', 'Invalid response structure or empty candidates.', $body_response );
    }

    /**
     * Joins all visible text parts of the first candidate, skipping 'thought' parts.
     */
    private function extract_answer_text( $body_response ) {
        if ( ! isset( $body_response['candidates'][0]['content']['parts'] ) || ! is_array( $body_response['candidates'][0]['content']['parts'] ) ) {
            return '';
        }

        $segments = array();
        foreach ( $body_response['candidates'][0]['content']['parts'] as $part ) {
            if ( ! empty( $part['thought'] ) || ! isset( $part['text'] ) ) {
                continue;
            }
            $segments[] = (string) $part['text'];
        }

        return trim( implode( '', $segments ) );
    }
}
