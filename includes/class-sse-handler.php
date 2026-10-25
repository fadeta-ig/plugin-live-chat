<?php
/**
 * SSE Handler Class
 *
 * Handles Server-Sent Events streaming response for the AI Chat.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_SSE_Handler {

    /**
     * Handle Groq SSE streaming response.
     */
    public static function handle_streaming_response(
        $system_instruction, $chat_history,
        $recommended_products, $order_data_for_frontend,
        $session_id, $message, $highest_score, $intent
    ) {
        // Prevent PHP timeout during long SSE streams (Hostinger default: 30s)
        @set_time_limit( 120 );
        ignore_user_abort( true );

        while ( ob_get_level() ) ob_end_clean();

        // Standard SSE headers
        header( 'Content-Type: text/event-stream; charset=utf-8' );
        header( 'Cache-Control: no-cache, no-store, must-revalidate' );
        header( 'Pragma: no-cache' );
        header( 'Connection: keep-alive' );

        // Disable proxy buffering (Nginx, LiteSpeed, Apache)
        header( 'X-Accel-Buffering: no' );              // Nginx
        header( 'X-LiteSpeed-Cache-Control: no-cache' ); // LiteSpeed (Hostinger)

        @ini_set( 'zlib.output_compression', 'Off' );
        @ini_set( 'output_buffering', 'Off' );
        @ini_set( 'implicit_flush', 1 );
        if ( function_exists( 'apache_setenv' ) ) {
            @apache_setenv( 'no-gzip', 1 );
        }

        // LiteSpeed requires a padding block (≥2KB) to force the first flush through its buffer
        echo ':' . str_repeat( ' ', 2048 ) . "\n\n";
        flush();

        $init_data = wp_json_encode( array(
            'products' => $recommended_products,
            'orders'   => $order_data_for_frontend,
            'fallback' => false,
        ) );
        echo "event: init\ndata: {$init_data}\n\n";
        flush();

        $groq_stream   = new AI_Woo_SA_Groq_Client();
        $streamed_text = $groq_stream->generate_content_stream( $system_instruction, $chat_history );

        echo "\nevent: done\ndata: {}\n\n";
        flush();

        self::persist_streamed_turn(
            $session_id, $message, $streamed_text, $chat_history,
            count( $recommended_products ), $highest_score, $intent
        );

        exit;
    }

    /**
     * Stores what was actually streamed so the next turn has real context.
     * - Failed/empty stream: nothing is stored (keeps user/model roles alternating).
     * - Escalation token: a neutral marker turn is stored instead of the raw token.
     */
    private static function persist_streamed_turn(
        $session_id, $message, $streamed_text, $chat_history,
        $matched_product_count, $highest_score, $intent
    ) {
        $is_failed     = $streamed_text === '';
        $is_escalation = ! $is_failed && strpos( $streamed_text, 'TRIGGER_HUMAN' ) !== false;

        if ( $is_failed ) {
            AI_Woo_SA_Chat_Logger::log( $session_id, $message, '[Stream failed]', true, $matched_product_count, $highest_score, $intent );
            return;
        }

        $stored_text = $is_escalation
            ? 'Percakapan dialihkan ke Customer Service.'
            : AI_Woo_SA_Security_Guard::sanitize_outgoing_response( $streamed_text );

        $chat_history[] = array(
            'role'  => 'model',
            'parts' => array( array( 'text' => $stored_text ) ),
        );
        set_transient( 'ai_woo_sa_' . md5( $session_id ), $chat_history, 24 * HOUR_IN_SECONDS );

        AI_Woo_SA_Chat_Logger::log( $session_id, $message, $stored_text, $is_escalation, $matched_product_count, $highest_score, $intent );
    }
}
