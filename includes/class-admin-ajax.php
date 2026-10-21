<?php
/**
 * Admin AJAX Handlers Class
 *
 * Handles AJAX requests from the WP Admin dashboard.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Admin_Ajax {

    public static function init() {
        add_action( 'wp_ajax_ai_woo_sa_test_gemini', array( __CLASS__, 'ajax_test_gemini' ) );
        add_action( 'wp_ajax_ai_woo_sa_test_groq', array( __CLASS__, 'ajax_test_groq' ) );
        add_action( 'wp_ajax_ai_woo_sa_test_pinecone', array( __CLASS__, 'ajax_test_pinecone' ) );
        add_action( 'wp_ajax_ai_woo_sa_bulk_sync', array( __CLASS__, 'ajax_bulk_sync' ) );
        add_action( 'wp_ajax_ai_woo_sa_sync_status', array( __CLASS__, 'ajax_sync_status' ) );
        add_action( 'wp_ajax_ai_woo_sa_unblock_ip', array( __CLASS__, 'ajax_unblock_ip' ) );
        add_action( 'wp_ajax_ai_woo_sa_block_ip', array( __CLASS__, 'ajax_block_ip' ) );
    }

    /**
     * AJAX: Test Gemini API Key by sending a minimal embedding request
     */
    public static function ajax_test_gemini() {
        check_ajax_referer( 'ai_woo_sa_test_api' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Unauthorized.' ) );
        }

        $api_key = isset( $_POST['api_key'] ) ? sanitize_text_field( $_POST['api_key'] ) : '';

        if ( empty( $api_key ) ) {
            wp_send_json_error( array( 'message' => 'API Key kosong. Silakan isi terlebih dahulu.' ) );
        }

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=' . $api_key;
        $body = array(
            'model'   => 'models/gemini-embedding-001',
            'content' => array(
                'parts' => array( array( 'text' => 'connection test' ) )
            ),
            'outputDimensionality' => 768
        );

        $response = wp_remote_post( $url, array(
            'headers' => array( 'Content-Type' => 'application/json' ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 15
        ) );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array( 'message' => 'Gagal terhubung: ' . $response->get_error_message() ) );
        }
        $status_code = wp_remote_retrieve_response_code( $response );
        $body_res = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status_code === 200 && isset( $body_res['embedding']['values'] ) ) {
            $dim_count = count( $body_res['embedding']['values'] );
            wp_send_json_success( array( 'message' => "Terhubung! Model: gemini-embedding-001 ({$dim_count} dimensi)" ) );
        }

        // Parse error detail from Google
        $error_msg = 'API Key tidak valid atau terjadi kesalahan.';
        if ( isset( $body_res['error']['message'] ) ) {
            $error_msg = $body_res['error']['message'];
        }
        wp_send_json_error( array( 'message' => "HTTP {$status_code}: {$error_msg}" ) );
    }

    /**
     * AJAX: Test Groq API Key
     */
    public static function ajax_test_groq() {
        check_ajax_referer( 'ai_woo_sa_test_api' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Unauthorized.' ) );
        }

        $api_key = isset( $_POST['api_key'] ) ? sanitize_text_field( $_POST['api_key'] ) : '';

        if ( empty( $api_key ) ) {
            wp_send_json_error( array( 'message' => 'API Key kosong.' ) );
        }

        $url = 'https://api.groq.com/openai/v1/chat/completions';
        $body = array(
            'model'    => 'llama-3.1-8b-instant',
            'messages' => array( array( 'role' => 'user', 'content' => 'Reply only with OK' ) ),
            'max_tokens' => 5
        );

        $response = wp_remote_post( $url, array(
            'headers' => array(
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $api_key
            ),
            'body'    => wp_json_encode( $body ),
            'timeout' => 15
        ) );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array( 'message' => 'Gagal terhubung: ' . $response->get_error_message() ) );
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $body_res = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status_code === 200 && isset( $body_res['choices'] ) ) {
            wp_send_json_success( array( 'message' => "Terhubung! Llama 3 via Groq merespons cepat." ) );
        }

        $error_msg = 'API Key tidak valid atau terjadi kesalahan.';
        if ( isset( $body_res['error']['message'] ) ) {
            $error_msg = $body_res['error']['message'];
        }
        wp_send_json_error( array( 'message' => "HTTP {$status_code}: {$error_msg}" ) );
    }

    /**
     * AJAX: Test Pinecone connection by calling describe_index_stats
     */
    public static function ajax_test_pinecone() {
        check_ajax_referer( 'ai_woo_sa_test_api' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Unauthorized.' ) );
        }

        $api_key  = isset( $_POST['api_key'] ) ? sanitize_text_field( $_POST['api_key'] ) : '';
        $host_url = isset( $_POST['host_url'] ) ? esc_url_raw( $_POST['host_url'] ) : '';

        if ( empty( $api_key ) || empty( $host_url ) ) {
            wp_send_json_error( array( 'message' => 'API Key atau Host URL kosong. Isi keduanya terlebih dahulu.' ) );
        }

        $url = rtrim( $host_url, '/' ) . '/describe_index_stats';

        $response = wp_remote_post( $url, array(
            'headers' => array(
                'Api-Key'      => $api_key,
                'Content-Type' => 'application/json'
            ),
            'body'    => '{}',
            'timeout' => 15
        ) );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array( 'message' => 'Gagal terhubung: ' . $response->get_error_message() ) );
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $body_res = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status_code === 200 ) {
            $dimension = isset( $body_res['dimension'] ) ? $body_res['dimension'] : '?';
            $total_vectors = isset( $body_res['totalVectorCount'] ) ? (int) $body_res['totalVectorCount'] : 0;

            // Validate dimension
            if ( $dimension !== '?' && (int) $dimension !== 768 ) {
                wp_send_json_error( array(
                    'message' => "Terhubung, TAPI dimensi index = {$dimension}. Harus 768! Hapus index dan buat ulang dengan dimensi 768."
                ) );
            }

            wp_send_json_success( array(
                'message' => "Terhubung! Dimensi: {$dimension}, Total vektor: {$total_vectors}"
            ) );
        }

        $error_msg = 'Koneksi gagal.';
        if ( $status_code === 401 || $status_code === 403 ) {
            $error_msg = 'API Key tidak valid atau tidak memiliki akses.';
        } elseif ( $status_code === 404 ) {
            $error_msg = 'Host URL tidak ditemukan. Periksa kembali URL dari dashboard Pinecone.';
        } elseif ( isset( $body_res['message'] ) ) {
            $error_msg = $body_res['message'];
        }
        wp_send_json_error( array( 'message' => "HTTP {$status_code}: {$error_msg}" ) );
    }

    /**
     * AJAX handler for triggering Bulk Sync
     */
    public static function ajax_bulk_sync() {
        check_ajax_referer( 'ai_woo_sa_test_api' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Unauthorized access' ) );
        }

        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-sync-manager.php';
        $sync_manager = new AI_Woo_SA_Sync_Manager();
        $count = $sync_manager->queue_all_products();

        if ( $count > 0 ) {
            update_option( 'ai_woo_sa_sync_total', $count );
            wp_send_json_success( array( 'message' => "Berhasil menjadwalkan sinkronisasi massal untuk {$count} produk. Proses berjalan di latar belakang." ) );
        } else {
            wp_send_json_error( array( 'message' => 'Tidak ada produk berstatus Publish yang ditemukan untuk disinkronisasi.' ) );
        }
    }

    /**
     * AJAX handler for checking Sync Progress
     */
    public static function ajax_sync_status() {
        check_ajax_referer( 'ai_woo_sa_test_api' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Unauthorized access' ) );
        }

        $total = (int) get_option( 'ai_woo_sa_sync_total', 0 );
        $remaining = 0;

        global $wpdb;
        $table = $wpdb->prefix . 'actionscheduler_actions';
        
        // Cek apakah tabel action scheduler ada (fallback aman)
        if ( $wpdb->get_var( "SHOW TABLES LIKE '{$table}'" ) === $table ) {
            $remaining = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(action_id) FROM {$table} WHERE hook = %s AND status = %s",
                'ai_woo_sa_process_product_sync',
                'pending'
            ) );
        } else {
            // Fallback for older versions storing actions in CPT
            $remaining = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(ID) FROM {$wpdb->posts} WHERE post_title = %s AND post_status = %s AND post_type = %s",
                'ai_woo_sa_process_product_sync',
                'pending',
                'scheduled-action'
            ) );
        }

        if ( $total == 0 ) {
            $percentage = 100;
        } else {
            $processed = $total - $remaining;
            if ( $processed < 0 ) $processed = 0;
            $percentage = round( ( $processed / $total ) * 100 );
        }
        
        if ( $remaining == 0 && $total > 0 ) {
            delete_option( 'ai_woo_sa_sync_total' );
        }

        wp_send_json_success( array(
            'total'      => $total,
            'remaining'  => $remaining,
            'percentage' => $percentage
        ) );
    }

    /**
     * AJAX: Unblock an IP address
     */
    public static function ajax_unblock_ip() {
        check_ajax_referer( 'ai_woo_sa_test_api' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Unauthorized.' ) );
        }

        $ip = isset( $_POST['ip'] ) ? sanitize_text_field( wp_unslash( $_POST['ip'] ) ) : '';
        if ( empty( $ip ) ) {
            wp_send_json_error( array( 'message' => 'Alamat IP tidak valid.' ) );
        }

        $result = AI_Woo_SA_Security_Guard::unblock_ip( $ip );
        if ( $result ) {
            wp_send_json_success( array( 'message' => "IP {$ip} berhasil di-unblock." ) );
        }

        wp_send_json_error( array( 'message' => "Gagal meng-unblock IP {$ip}." ) );
    }

    /**
     * AJAX: Manually block an IP address
     */
    public static function ajax_block_ip() {
        check_ajax_referer( 'ai_woo_sa_test_api' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Unauthorized.' ) );
        }

        $ip     = isset( $_POST['ip'] ) ? sanitize_text_field( wp_unslash( $_POST['ip'] ) ) : '';
        $reason = isset( $_POST['reason'] ) ? sanitize_text_field( wp_unslash( $_POST['reason'] ) ) : 'Blokir manual oleh Admin';
        $hours  = isset( $_POST['hours'] ) ? (int) $_POST['hours'] : 24;

        if ( empty( $ip ) || ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
            wp_send_json_error( array( 'message' => 'Format alamat IP tidak valid.' ) );
        }

        $result = AI_Woo_SA_Security_Guard::block_ip( $ip, $reason, $hours );
        if ( $result ) {
            wp_send_json_success( array( 'message' => "IP {$ip} berhasil diblokir." ) );
        }

        wp_send_json_error( array( 'message' => "Gagal memblokir IP {$ip}." ) );
    }
}
