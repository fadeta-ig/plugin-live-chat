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

        $groq_stream = new AI_Woo_SA_Groq_Client();
        $groq_stream->generate_content_stream( $system_instruction, $chat_history );

        echo "\nevent: done\ndata: {}\n\n";
        flush();

        // Persist history for streaming
        $chat_history[] = array(
            'role'  => 'model',
            'parts' => array( array( 'text' => '[Streamed via SSE]' ) ),
        );
        $transient_key = 'ai_woo_sa_' . md5( $session_id );
        set_transient( $transient_key, $chat_history, 24 * HOUR_IN_SECONDS );

        AI_Woo_SA_Chat_Logger::log( $session_id, $message, '[Streamed via SSE]', false, count( $recommended_products ), $highest_score, $intent );

        exit;
    }
}
