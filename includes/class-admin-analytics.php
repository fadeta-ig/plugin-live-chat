<?php
/**
 * Admin Analytics Dashboard Class
 *
 * Handles rendering the Analytics page in WP Admin.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Admin_Analytics {

    /**
     * Analytics Dashboard Page
     */
    public static function create_analytics_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $stats = AI_Woo_SA_Chat_Logger::get_stats( 30 );
        $logs  = AI_Woo_SA_Chat_Logger::get_recent_logs( 20 );

        $total_messages = isset( $stats->total_messages ) ? (int) $stats->total_messages : 0;
        $total_sessions = isset( $stats->total_sessions ) ? (int) $stats->total_sessions : 0;
        $total_fallbacks = isset( $stats->total_fallbacks ) ? (int) $stats->total_fallbacks : 0;
        $avg_score = isset( $stats->avg_score ) ? round( (float) $stats->avg_score, 3 ) : 0;
        $fallback_rate = $total_messages > 0 ? round( ( $total_fallbacks / $total_messages ) * 100, 1 ) : 0;
        ?>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
        <div class="wrap ai-woo-sa-admin-wrap">
            <h1>AI Chat Analytics <span style="font-size:14px;color:#888;font-weight:300;">(30 hari terakhir)</span></h1>

            <div style="display:flex;gap:16px;margin:20px 0;flex-wrap:wrap;">
                <?php self::render_stat_card( '💬', 'Total Pesan', $total_messages, '#8C9B81' ); ?>
                <?php self::render_stat_card( '👥', 'Sesi Unik', $total_sessions, '#5A6B4F' ); ?>
                <?php self::render_stat_card( '🔄', 'Fallback Rate', $fallback_rate . '%', $fallback_rate > 30 ? '#c0392b' : '#27ae60' ); ?>
                <?php self::render_stat_card( '🎯', 'Avg Score', $avg_score, '#2c3e50' ); ?>
            </div>

            <h2>Riwayat Percakapan Terbaru</h2>
            <table class="ai-woo-sa-data-grid">
                <thead>
                    <tr>
                        <th style="width:140px;">Waktu</th>
                        <th style="width:110px;">Session</th>
                        <th>Pesan User</th>
                        <th>Respon Bot</th>
                        <th style="width:100px;">Status</th>
                        <th style="width:80px;text-align:center;">Produk</th>
                        <th style="width:80px;text-align:center;">Score</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ( empty( $logs ) ) : ?>
                        <tr><td colspan="7" style="text-align:center;padding:40px;color:#888;">Belum ada data percakapan.</td></tr>
                    <?php else : ?>
                        <?php foreach ( $logs as $log ) : ?>
                        <tr>
                            <td class="ai-woo-sa-subtext"><?php echo esc_html( date('d M H:i', strtotime($log->created_at)) ); ?></td>
                            <td><span class="ai-woo-sa-code"><?php echo esc_html( substr( $log->session_id, 0, 10 ) ); ?>…</span></td>
                            <td><?php echo esc_html( mb_substr( $log->user_message, 0, 80, 'UTF-8' ) ); ?></td>
                            <td style="color:#666;"><?php echo esc_html( mb_substr( $log->bot_response, 0, 100, 'UTF-8' ) ); ?></td>
                            <td>
                                <?php if ( (int) $log->is_fallback ) : ?>
                                    <span class="ai-woo-sa-pill red">Fallback</span>
                                <?php else : ?>
                                    <span class="ai-woo-sa-pill green">Success</span>
                                <?php endif; ?>
                            </td>
                            <td style="text-align:center;"><?php echo (int) $log->matched_product_count; ?></td>
                            <td style="text-align:center;"><?php echo round( (float) $log->highest_similarity_score, 2 ); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <p class="description" style="margin-top:12px;">Data lebih dari <?php echo AI_Woo_SA_Chat_Logger::RETENTION_DAYS; ?> hari akan dihapus otomatis.</p>
        </div>
        <?php
    }

    /**
     * Render a single stat card for the analytics dashboard.
     */
    private static function render_stat_card( $icon, $label, $value, $color ) {
        ?>
        <div class="ai-woo-sa-stat-card">
            <div style="font-size:24px;margin-bottom:8px;opacity:0.8;"><?php echo esc_html( $icon ); ?></div>
            <div class="ai-woo-sa-stat-label"><?php echo esc_html( $label ); ?></div>
            <div class="ai-woo-sa-stat-val" style="color:<?php echo esc_attr( $color ); ?>;"><?php echo esc_html( $value ); ?></div>
        </div>
        <?php
    }
}
