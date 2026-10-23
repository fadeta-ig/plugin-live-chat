<?php
/**
 * Admin Settings Class
 *
 * Provides the WP Admin settings page with API key management
 * and real-time "Test Connection" validation for Gemini & Pinecone.
 */

if (!defined('ABSPATH')) {
    exit;
}

class AI_Woo_SA_Admin_Settings
{

    private $options;

    public function __construct()
    {
        add_action('admin_menu', array($this, 'add_plugin_page'));
        add_action('admin_init', array($this, 'page_init'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }

    public function enqueue_admin_scripts($hook)
    {
        // Only load on our plugin pages
        if (strpos($hook, 'ai-woo-sa-') === false) {
            return;
        }

        $version = time();
        wp_enqueue_style('ai-woo-sa-admin-css', AI_WOO_SA_PLUGIN_URL . 'assets/css/admin.css', array(), $version);
        wp_enqueue_script('ai-woo-sa-admin-js', AI_WOO_SA_PLUGIN_URL . 'assets/js/admin.js', array(), $version, true);
        wp_localize_script('ai-woo-sa-admin-js', 'aiWooSaAdminParams', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('ai_woo_sa_test_api')
        ));
    }

    public function add_plugin_page()
    {
        add_options_page(
            'AI Assistant Settings',
            'AI Assistant',
            'manage_options',
            'ai-woo-sa-settings',
            array($this, 'create_admin_page')
        );
        add_options_page(
            'AI Assistant Analytics',
            'AI Analytics',
            'manage_options',
            'ai-woo-sa-analytics',
            array('AI_Woo_SA_Admin_Analytics', 'create_analytics_page')
        );
    }

    public function create_admin_page()
    {
        $this->options = get_option('ai_woo_sa_settings');
        ?>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
        <div class="wrap ai-woo-sa-admin-wrap">
            <h1>AI WooCommerce Sales Assistant</h1>

            <h2 class="nav-tab-wrapper">
                <a href="#tab-settings" class="nav-tab nav-tab-active" id="nav-tab-settings">Settings</a>
                <a href="#tab-sync" class="nav-tab" id="nav-tab-sync">Data Sync</a>
                <a href="#tab-security" class="nav-tab" id="nav-tab-security">🛡️ Security & IP Firewall</a>
            </h2>

            <div id="tab-settings" class="ai-woo-sa-tab-content active">
                <form method="post" action="options.php">
                    <?php
                    settings_fields('ai_woo_sa_option_group');
                    do_settings_sections('ai-woo-sa-settings');
                    submit_button();
                    ?>
                </form>
            </div>

            <div id="tab-sync" class="ai-woo-sa-tab-content" style="display:none;">
                <div class="ai-woo-sa-card">
                    <h2>Pinecone Data Sync</h2>
                    <p>Sinkronisasi massal akan mengirimkan semua data produk Anda yang berstatus <em>Publish</em> ke Pinecone
                        Vector Database agar dikenali oleh AI.</p>
                    <p>Proses ini berjalan di latar belakang (Background Processing) menggunakan Action Scheduler untuk
                        menghindari <em>timeout</em> server.</p>
                    <button id="btn-bulk-sync" class="button button-primary button-hero">
                        <span class="btn-text">Sync All Products to Pinecone</span>
                        <span class="spinner-icon"></span>
                    </button>
                    <span id="bulk-sync-status" class="ai-woo-sa-status-box" style="display:none;"></span>
                </div>
            </div>

            <div id="tab-security" class="ai-woo-sa-tab-content" style="display:none;">
                <?php $blocked_ips = AI_Woo_SA_Security_Guard::get_blocked_ips(); ?>
                <div style="display:flex;gap:16px;margin:20px 0;flex-wrap:wrap;">
                    <div class="ai-woo-sa-stat-card">
                        <div style="font-size:24px;margin-bottom:8px;opacity:0.8;">🛡️</div>
                        <div class="ai-woo-sa-stat-label">Firewall Status</div>
                        <div class="ai-woo-sa-stat-val" style="color:#27ae60;font-size:24px;">AKTIF</div>
                    </div>
                    <div class="ai-woo-sa-stat-card">
                        <div style="font-size:24px;margin-bottom:8px;opacity:0.8;">🚫</div>
                        <div class="ai-woo-sa-stat-label">Total IP Diblokir</div>
                        <div class="ai-woo-sa-stat-val" style="color:#c0392b;" id="blocked-count"><?php echo count($blocked_ips); ?></div>
                    </div>
                    <div class="ai-woo-sa-stat-card">
                        <div style="font-size:24px;margin-bottom:8px;opacity:0.8;">🔒</div>
                        <div class="ai-woo-sa-stat-label">Proteksi Kredensial</div>
                        <div class="ai-woo-sa-stat-val" style="color:#2c3e50;font-size:20px;">Zero-Trust Mode</div>
                    </div>
                </div>

                <div class="ai-woo-sa-card" style="margin-bottom:24px;background:#fff;border:1px solid rgba(0,0,0,0.05);border-radius:12px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,0.02);">
                    <h2>Tambah Pemblokiran IP Manual</h2>
                    <p style="color:#666;font-size:13px;margin-bottom:16px;">Blokir akses live chat dari alamat IP tertentu yang mencurigakan.</p>
                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                        <input type="text" id="manual_block_ip" placeholder="Contoh: 192.168.1.100" style="width:200px;" />
                        <input type="text" id="manual_block_reason" placeholder="Alasan pemblokiran..." style="width:300px;" />
                        <select id="manual_block_hours">
                            <option value="24">24 Jam</option>
                            <option value="72">3 Hari</option>
                            <option value="168">7 Hari</option>
                            <option value="720">30 Hari</option>
                            <option value="0">Permanen</option>
                        </select>
                        <button type="button" id="btn-manual-block-ip" class="button button-secondary" style="border-color:#c0392b;color:#c0392b;">
                            <span>Blokir IP</span>
                        </button>
                        <span id="manual-block-status" class="ai-woo-sa-status-box" style="display:none;"></span>
                    </div>
                </div>

                <h2>Daftar Alamat IP Terblokir</h2>
                <table class="ai-woo-sa-data-grid" id="blocked-ips-table">
                    <thead>
                        <tr>
                            <th style="width:160px;">Alamat IP</th>
                            <th>Alasan Pemblokiran</th>
                            <th style="width:160px;">Waktu Diblokir</th>
                            <th style="width:160px;">Masa Berlaku</th>
                            <th style="width:100px;text-align:center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="blocked-ips-tbody">
                        <?php if ( empty( $blocked_ips ) ) : ?>
                            <tr id="no-blocked-row"><td colspan="5" style="text-align:center;padding:40px;color:#888;">Belum ada IP yang diblokir. Sistem aman dari intrusi.</td></tr>
                        <?php else : ?>
                            <?php foreach ( $blocked_ips as $b_ip => $b_data ) : ?>
                            <tr id="row-ip-<?php echo esc_attr( str_replace( array('.', ':'), '-', $b_ip ) ); ?>">
                                <td><span class="ai-woo-sa-code"><?php echo esc_html( $b_ip ); ?></span></td>
                                <td><?php echo esc_html( isset( $b_data['reason'] ) ? $b_data['reason'] : 'Pelanggaran keamanan' ); ?></td>
                                <td class="ai-woo-sa-subtext"><?php echo esc_html( date('d M Y H:i', $b_data['blocked_at']) ); ?></td>
                                <td>
                                    <?php if ( empty( $b_data['expires_at'] ) ) : ?>
                                        <span class="ai-woo-sa-pill red">Permanen</span>
                                    <?php else : ?>
                                        <span class="ai-woo-sa-subtext"><?php echo esc_html( date('d M Y H:i', $b_data['expires_at']) ); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td style="text-align:center;">
                                    <button type="button" class="button button-small btn-unblock-ip" data-ip="<?php echo esc_attr( $b_ip ); ?>" style="font-size:11px;">
                                        Unblock
                                    </button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php
    }

    public function page_init()
    {
        register_setting(
            'ai_woo_sa_option_group',
            'ai_woo_sa_settings',
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize'),
                'default' => array()
            )
        );

        add_settings_section(
            'setting_section_api',
            'API Integrations',
            array($this, 'print_api_section_info'),
            'ai-woo-sa-settings'
        );

        add_settings_field(
            'llm_provider',
            'LLM Provider (Chat)',
            array($this, 'llm_provider_callback'),
            'ai-woo-sa-settings',
            'setting_section_api'
        );

        add_settings_field(
            'gemini_api_key',
            'Gemini API Key',
            array($this, 'gemini_api_key_callback'),
            'ai-woo-sa-settings',
            'setting_section_api'
        );

        add_settings_field(
            'gemini_model',
            'Gemini Model',
            array($this, 'gemini_model_callback'),
            'ai-woo-sa-settings',
            'setting_section_api'
        );

        add_settings_field(
            'groq_api_key',
            'Groq API Key',
            array($this, 'groq_api_key_callback'),
            'ai-woo-sa-settings',
            'setting_section_api'
        );

        add_settings_field(
            'groq_model',
            'Groq Model',
            array($this, 'groq_model_callback'),
            'ai-woo-sa-settings',
            'setting_section_api'
        );

        add_settings_field(
            'pinecone_api_key',
            'Pinecone API Key',
            array($this, 'pinecone_api_key_callback'),
            'ai-woo-sa-settings',
            'setting_section_api'
        );

        add_settings_field(
            'pinecone_host',
            'Pinecone Host URL',
            array($this, 'pinecone_host_callback'),
            'ai-woo-sa-settings',
            'setting_section_api'
        );

        add_settings_section(
            'setting_section_bot',
            'Bot Configuration',
            array($this, 'print_bot_section_info'),
            'ai-woo-sa-settings'
        );

        add_settings_field(
            'store_sop',
            'Store SOP / Knowledge Base',
            array($this, 'store_sop_callback'),
            'ai-woo-sa-settings',
            'setting_section_bot'
        );

        add_settings_field(
            'bot_name',
            'Bot Name',
            array($this, 'bot_name_callback'),
            'ai-woo-sa-settings',
            'setting_section_bot'
        );

        add_settings_field(
            'whatsapp_number',
            'WhatsApp CS Number',
            array($this, 'whatsapp_number_callback'),
            'ai-woo-sa-settings',
            'setting_section_bot'
        );

        add_settings_field(
            'tracking_meta_key',
            'Custom Tracking Meta Key',
            array($this, 'tracking_meta_key_callback'),
            'ai-woo-sa-settings',
            'setting_section_bot'
        );
    }

    public function sanitize($input)
    {
        $sanitized = array();
        if (isset($input['llm_provider'])) {
            $sanitized['llm_provider'] = sanitize_text_field($input['llm_provider']);
        }
        if (isset($input['gemini_api_key'])) {
            $sanitized['gemini_api_key'] = sanitize_text_field($input['gemini_api_key']);
        }
        if (isset($input['gemini_model'])) {
            $sanitized['gemini_model'] = sanitize_text_field($input['gemini_model']);
        }
        if (isset($input['groq_api_key'])) {
            $sanitized['groq_api_key'] = sanitize_text_field($input['groq_api_key']);
        }
        if (isset($input['groq_model'])) {
            $sanitized['groq_model'] = sanitize_text_field($input['groq_model']);
        }
        if (isset($input['pinecone_api_key'])) {
            $sanitized['pinecone_api_key'] = sanitize_text_field($input['pinecone_api_key']);
        }
        if (isset($input['pinecone_host'])) {
            $sanitized['pinecone_host'] = esc_url_raw($input['pinecone_host']);
        }
        if (isset($input['store_sop'])) {
            $sanitized['store_sop'] = sanitize_textarea_field($input['store_sop']);
        }
        if (isset($input['bot_name'])) {
            $sanitized['bot_name'] = sanitize_text_field($input['bot_name']);
        }
        if (isset($input['whatsapp_number'])) {
            $sanitized['whatsapp_number'] = sanitize_text_field($input['whatsapp_number']);
        }
        if (isset($input['tracking_meta_key'])) {
            $sanitized['tracking_meta_key'] = sanitize_text_field($input['tracking_meta_key']);
        }
        return $sanitized;
    }

    public function print_api_section_info()
    {
        echo '<p>Configure your API integrations below. Note: Gemini API is always required for product Embeddings (Search).</p>';
    }

    public function print_bot_section_info()
    {
        print 'Configure your AI Assistant behavior and fallback:';
    }

    public function llm_provider_callback()
    {
        $val = isset($this->options['llm_provider']) ? $this->options['llm_provider'] : 'gemini';
        $providers = array(
            'gemini' => 'Gemini (Default)',
            'groq' => 'Groq (Sangat Cepat - GPT-OSS / Llama 4)'
        );
        echo '<select id="llm_provider" name="ai_woo_sa_settings[llm_provider]" style="font-weight:bold; color:#2c3e50;">';
        foreach ($providers as $key => $label) {
            printf('<option value="%s" %s>%s</option>', esc_attr($key), selected($val, $key, false), esc_html($label));
        }
        echo '</select>';
        echo '<p class="description">Pilih penyedia LLM utama untuk merangkai percakapan (Chat Generation).</p>';
    }

    public function gemini_api_key_callback()
    {
        $val = isset($this->options['gemini_api_key']) ? $this->options['gemini_api_key'] : '';
        printf(
            '<div class="ai-woo-sa-api-row">
                <input type="password" id="gemini_api_key" name="ai_woo_sa_settings[gemini_api_key]" value="%s" style="width: 300px;" autocomplete="new-password" />
                <button type="button" class="button button-secondary" onclick="var el=document.getElementById(\'gemini_api_key\'); el.type=(el.type===\'password\'?\'text\':\'password\');">👁️</button>
                <button type="button" class="button button-secondary" id="ai-woo-sa-test-gemini">Test Connection</button>
                <span id="ai-woo-sa-gemini-status" class="ai-woo-sa-status-box" style="display:none;"></span>
            </div>',
            esc_attr($val)
        );
        echo '<p class="description">Get your key from <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>.</p>';
    }

    public function gemini_model_callback()
    {
        $val = isset($this->options['gemini_model']) ? $this->options['gemini_model'] : 'gemini-2.5-flash';
        $models = array(
            'gemini-2.5-flash' => 'Gemini 2.5 Flash (Tercepat, limit RPD lebih rendah)',
            'gemini-2.0-flash' => 'Gemini 2.0 Flash (Stabil)',
            'gemini-1.5-flash' => 'Gemini 1.5 Flash (Standar)',
            'gemini-1.5-pro' => 'Gemini 1.5 Pro (Lebih cerdas, limit lebih ketat)',
            'gemini-2.5-pro' => 'Gemini 2.5 Pro (Tercanggih, limit sangat ketat)'
        );

        echo '<select id="gemini_model" name="ai_woo_sa_settings[gemini_model]">';
        foreach ($models as $key => $label) {
            printf('<option value="%s" %s>%s</option>', esc_attr($key), selected($val, $key, false), esc_html($label));
        }
        echo '</select>';
        echo '<p class="description">Pilih model yang akan digunakan jika Provider di atas adalah Gemini.</p>';
    }

    public function groq_api_key_callback()
    {
        $val = isset($this->options['groq_api_key']) ? $this->options['groq_api_key'] : '';
        printf(
            '<div class="ai-woo-sa-api-row">
                <input type="password" id="groq_api_key" name="ai_woo_sa_settings[groq_api_key]" value="%s" style="width: 300px;" autocomplete="new-password" />
                <button type="button" class="button button-secondary" onclick="var el=document.getElementById(\'groq_api_key\'); el.type=(el.type===\'password\'?\'text\':\'password\');">👁️</button>
                <button type="button" class="button button-secondary" id="ai-woo-sa-test-groq">Test Connection</button>
                <span id="ai-woo-sa-groq-status" class="ai-woo-sa-status-box" style="display:none;"></span>
            </div>',
            esc_attr($val)
        );
        echo '<p class="description">Get your API key from <a href="https://console.groq.com/keys" target="_blank">Groq Console</a>.</p>';
    }

    public function groq_model_callback()
    {
        $val = isset($this->options['groq_model']) ? $this->options['groq_model'] : 'openai/gpt-oss-120b';
        $models = array(
            'openai/gpt-oss-120b' => 'GPT-OSS 120B (Flagship — Penalaran Cerdas & Rekomendasi Akurat)',
            'openai/gpt-oss-20b' => 'GPT-OSS 20B (Ultra Cepat ~1000 tok/s — Ringan & Responsif)',
            'meta-llama/llama-4-scout-17b-16e-instruct' => 'Llama 4 Scout 17B (Multimodal MoE)',
            'qwen/qwen3.8-27b' => 'Qwen 3.8 27B (Penalaran Multilingual & Komprehensif)',
        );

        echo '<select id="groq_model" name="ai_woo_sa_settings[groq_model]">';
        foreach ($models as $key => $label) {
            printf('<option value="%s" %s>%s</option>', esc_attr($key), selected($val, $key, false), esc_html($label));
        }
        echo '</select>';
        echo '<p class="description">Pilih model Groq untuk AI Chat Assistant. Rekomendasi: <strong>GPT-OSS 120B</strong> untuk penalaran konsultasi terbaik dan paling cerdas.</p>';
    }

    public function pinecone_api_key_callback()
    {
        $val = isset($this->options['pinecone_api_key']) ? esc_attr($this->options['pinecone_api_key']) : '';
        printf(
            '<div class="ai-woo-sa-api-row">
                <input type="password" id="pinecone_api_key" name="ai_woo_sa_settings[pinecone_api_key]" value="%s" style="width: 300px;" autocomplete="new-password" />
                <button type="button" class="button button-secondary" onclick="var el=document.getElementById(\'pinecone_api_key\'); el.type=(el.type===\'password\'?\'text\':\'password\');">👁️</button>
            </div>',
            $val
        );
    }

    public function pinecone_host_callback()
    {
        $val = isset($this->options['pinecone_host']) ? esc_attr($this->options['pinecone_host']) : '';
        echo '<div class="ai-woo-sa-api-row">';
        printf('<input type="text" id="pinecone_host" name="ai_woo_sa_settings[pinecone_host]" value="%s" class="regular-text" placeholder="https://index-name-xxxx.svc.pinecone.io" />', $val);
        echo '<button type="button" id="ai-woo-sa-test-pinecone" class="ai-woo-sa-test-btn">';
        echo '<span class="spinner-icon"></span><span class="btn-text">Test Connection</span></button>';
        echo '<span id="ai-woo-sa-pinecone-status" class="ai-woo-sa-status-box" style="display:none;"></span>';
        echo '</div>';
        echo '<p class="description">Full host URL from Pinecone dashboard. Index must be <strong>768 dimensions</strong> with <strong>cosine</strong> metric.</p>';
    }

    public function store_sop_callback()
    {
        $val = isset($this->options['store_sop']) ? esc_textarea($this->options['store_sop']) : '';
        printf('<textarea id="store_sop" name="ai_woo_sa_settings[store_sop]" rows="8" cols="50" class="large-text">%s</textarea>', $val);
        echo '<p class="description">Define rules, return policies, or specific store info for the AI.</p>';
    }

    public function whatsapp_number_callback()
    {
        $val = isset($this->options['whatsapp_number']) ? esc_attr($this->options['whatsapp_number']) : '';
        printf('<input type="text" id="whatsapp_number" name="ai_woo_sa_settings[whatsapp_number]" value="%s" class="regular-text" placeholder="6281234567890" />', $val);
        echo '<p class="description">Include country code without + or leading zeros.</p>';
    }

    public function tracking_meta_key_callback()
    {
        $val = isset($this->options['tracking_meta_key']) ? esc_attr($this->options['tracking_meta_key']) : '';
        printf('<input type="text" id="tracking_meta_key" name="ai_woo_sa_settings[tracking_meta_key]" value="%s" class="regular-text" placeholder="_my_custom_tracking_key" />', $val);
        echo '<p class="description">Opsional: Jika menggunakan plugin kurir selain woo-mengantar, masukkan meta key database resi.</p>';
    }

    public function bot_name_callback()
    {
        $val = isset($this->options['bot_name']) ? esc_attr($this->options['bot_name']) : 'AI Sales Assistant';
        printf('<input type="text" id="bot_name" name="ai_woo_sa_settings[bot_name]" value="%s" class="regular-text" placeholder="e.g. Shinyoung Assistant" />', $val);
        echo '<p class="description">Nama yang akan ditampilkan di header widget chat.</p>';
    }

}

