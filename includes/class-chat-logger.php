<?php
/**
 * Chat Logger Class
 *
 * Persists every chat interaction to a custom database table for
 * analytics, audit trails, and conversion tracking. Includes
 * automatic cleanup of records older than 90 days via WP Cron.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Chat_Logger {

    const TABLE_NAME     = 'ai_woo_sa_chat_logs';
    const RETENTION_DAYS = 90;
    const CRON_HOOK      = 'ai_woo_sa_cleanup_logs';

    /**
     * Create the custom table via dbDelta (idempotent).
     * Called on plugin activation.
     */
    public static function create_table() {
        global $wpdb;
        $table           = $wpdb->prefix . self::TABLE_NAME;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            session_id varchar(64) NOT NULL,
            user_message text NOT NULL,
            bot_response text NOT NULL,
            is_fallback tinyint(1) NOT NULL DEFAULT 0,
            matched_product_count int NOT NULL DEFAULT 0,
            highest_similarity_score float NOT NULL DEFAULT 0,
            intent varchar(30) NOT NULL DEFAULT '',
            user_ip varchar(45) DEFAULT '',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_session_id (session_id),
            KEY idx_created_at (created_at),
            KEY idx_is_fallback (is_fallback)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );
    }

    /**
     * Insert a single chat log entry.
     *
     * @param string $session_id   Unique session identifier.
     * @param string $user_message The user's raw message.
     * @param string $bot_response The bot's response text.
     * @param bool   $is_fallback  Whether this triggered human fallback.
     * @param int    $matched_count Number of products matched.
     * @param float  $score        Highest similarity score from Pinecone.
     * @param string $intent       Detected user intent type.
     */
    public static function log( $session_id, $user_message, $bot_response, $is_fallback, $matched_count = 0, $score = 0.0, $intent = '' ) {
        global $wpdb;
        $table = $wpdb->prefix . self::TABLE_NAME;

        $wpdb->insert(
            $table,
            array(
                'session_id'              => sanitize_text_field( $session_id ),
                'user_message'            => sanitize_textarea_field( $user_message ),
                'bot_response'            => sanitize_textarea_field( $bot_response ),
                'is_fallback'             => (int) $is_fallback,
                'matched_product_count'   => (int) $matched_count,
                'highest_similarity_score' => (float) $score,
                'intent'                  => sanitize_text_field( $intent ),
                'user_ip'                 => self::get_client_ip(),
                'created_at'              => current_time( 'mysql' ),
            ),
            array( '%s', '%s', '%s', '%d', '%d', '%f', '%s', '%s', '%s' )
        );
    }

    /**
     * Aggregate statistics for the analytics dashboard.
     *
     * @param int $days Number of days to look back.
     * @return object|null Stats object with total_messages, total_sessions, etc.
     */
    public static function get_stats( $days = 30 ) {
        global $wpdb;
        $table     = $wpdb->prefix . self::TABLE_NAME;
        $date_from = gmdate( 'Y-m-d H:i:s', strtotime( "-{$days} days" ) );

        return $wpdb->get_row( $wpdb->prepare(
            "SELECT
                COUNT(*) as total_messages,
                COUNT(DISTINCT session_id) as total_sessions,
                SUM(is_fallback) as total_fallbacks,
                AVG(highest_similarity_score) as avg_score,
                AVG(matched_product_count) as avg_products
            FROM {$table}
            WHERE created_at >= %s",
            $date_from
        ) );
    }

    /**
     * Get recent chat log entries with pagination.
     *
     * @param int $limit  Number of rows.
     * @param int $offset Pagination offset.
     * @return array Array of log row objects.
     */
    public static function get_recent_logs( $limit = 20, $offset = 0 ) {
        global $wpdb;
        $table = $wpdb->prefix . self::TABLE_NAME;

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$table} ORDER BY created_at DESC LIMIT %d OFFSET %d",
            $limit,
            $offset
        ) );
    }

    /**
     * Delete records older than RETENTION_DAYS.
     * Triggered via WP Cron (daily event).
     */
    public static function cleanup_old_logs() {
        global $wpdb;
        $table  = $wpdb->prefix . self::TABLE_NAME;
        $cutoff = gmdate( 'Y-m-d H:i:s', strtotime( '-' . self::RETENTION_DAYS . ' days' ) );

        $wpdb->query( $wpdb->prepare(
            "DELETE FROM {$table} WHERE created_at < %s",
            $cutoff
        ) );
    }

    /**
     * Schedule the daily cleanup cron job.
     */
    public static function schedule_cleanup() {
        if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
            wp_schedule_event( time(), 'daily', self::CRON_HOOK );
        }
    }

    /**
     * Clear the cron job on plugin deactivation.
     */
    public static function unschedule_cleanup() {
        wp_clear_scheduled_hook( self::CRON_HOOK );
    }

    /**
     * Safely retrieve the client IP address.
     *
     * @return string Sanitized IP address.
     */
    private static function get_client_ip() {
        if ( class_exists( 'AI_Woo_SA_Security_Guard' ) ) {
            return AI_Woo_SA_Security_Guard::get_client_ip();
        }

        $ip = ! empty( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '127.0.0.1';
        return $ip;
    }
}
