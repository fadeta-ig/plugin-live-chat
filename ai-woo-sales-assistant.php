<?php
/**
 * Plugin Name: AI WooCommerce Sales Assistant
 * Description: AI-powered sales assistant using Gemini, Groq, and Pinecone with RAG architecture.
 * Version: 2.7.8
 * Author: Fadeta Ilhan
 * Text Domain: ai-woo-sales-assistant
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

define('AI_WOO_SA_VERSION', '2.7.8');
define('AI_WOO_SA_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('AI_WOO_SA_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main AI WooCommerce Sales Assistant Class
 */
final class AI_Woo_Sales_Assistant
{

    /**
     * Instance of this class.
     */
    private static $instance = null;

    /**
     * Get the single instance.
     */
    public static function get_instance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor.
     */
    private function __construct()
    {
        $this->load_dependencies();
        $this->init_hooks();
    }

    /**
     * Load required dependencies.
     */
    private function load_dependencies()
    {
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-admin-settings.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-gemini-client.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-groq-client.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-pinecone-client.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-security-guard.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-sync-manager.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-chat-utils.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-text-normalizer.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-intent-lexicon.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-intent-prompt.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-conversation-context.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-stream-accumulator.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-prompt-builder.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-sse-handler.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-chat-handler.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-keyword-search.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-chat-logger.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-intent-classifier.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-order-service.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-plugin-details.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-admin-ajax.php';
        require_once AI_WOO_SA_PLUGIN_DIR . 'includes/class-admin-analytics.php';
    }

    /**
     * Initialize WordPress hooks.
     */
    private function init_hooks()
    {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_filter('wp_resource_hints', array($this, 'add_font_resource_hints'), 10, 2);
        add_action('wp_footer', array($this, 'render_widget_html'));

        // Initialize Admin
        if (is_admin()) {
            new AI_Woo_SA_Admin_Settings();
            new AI_Woo_SA_Plugin_Details();
        }

        // Initialize Admin AJAX handlers (needs to be outside is_admin() for frontend ajax requests)
        AI_Woo_SA_Admin_Ajax::init();

        // Initialize API and Sync Managers
        add_action('rest_api_init', array('AI_Woo_SA_Chat_Handler', 'register_routes'));

        // Setup Sync Manager
        new AI_Woo_SA_Sync_Manager();

        // Schedule daily log cleanup cron
        add_action(AI_Woo_SA_Chat_Logger::CRON_HOOK, array('AI_Woo_SA_Chat_Logger', 'cleanup_old_logs'));
        AI_Woo_SA_Chat_Logger::schedule_cleanup();

        // Optimize HTTP API cURL for external connections
        add_action('http_api_curl', array($this, 'optimize_curl_connection'), 10, 3);
    }

    /**
     * Optimize cURL requests to external APIs to prevent IPv6 DNS lag.
     *
     * @param resource $handle cURL handle
     * @param array    $parsed_args The HTTP request arguments
     * @param string   $url The request URL
     */
    public function optimize_curl_connection($handle, $parsed_args, $url)
    {
        if (
            strpos($url, 'api.groq.com') !== false ||
            strpos($url, 'googleapis.com') !== false ||
            strpos($url, 'pinecone.io') !== false
        ) {

            // Force IPv4 resolution to prevent DNS timeouts
            curl_setopt($handle, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
            // Enable TCP Keep-Alive
            curl_setopt($handle, CURLOPT_TCP_KEEPALIVE, 1);
        }
    }

    /**
     * Cache-busting version based on file modification time.
     *
     * @param string $relative_path Path relative to the plugin directory.
     * @return string
     */
    private function get_asset_version($relative_path)
    {
        $file_path = AI_WOO_SA_PLUGIN_DIR . $relative_path;
        $modified_time = file_exists($file_path) ? filemtime($file_path) : false;
        return $modified_time ? (string) $modified_time : AI_WOO_SA_VERSION;
    }

    /**
     * Add preconnect for Google Fonts to improve load speed.
     *
     * @param array  $urls          URLs to print for resource hints.
     * @param string $relation_type The relation type the URLs are printed for.
     * @return array
     */
    public function add_font_resource_hints($urls, $relation_type)
    {
        if ('preconnect' === $relation_type) {
            $urls[] = array(
                'href' => 'https://fonts.googleapis.com',
            );
            $urls[] = array(
                'href' => 'https://fonts.gstatic.com',
                'crossorigin' => 'anonymous',
            );
        }
        return $urls;
    }

    public function enqueue_scripts()
    {
        // Enqueue luxury typography (Cormorant Garamond + Manrope)
        wp_enqueue_style(
            'ai-woo-sa-google-fonts',
            'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600&display=swap',
            array(),
            null
        );

        $css_rel = file_exists(AI_WOO_SA_PLUGIN_DIR . 'assets/dist/widget.css') ? 'assets/dist/widget.css' : 'assets/css/widget.css';
        $css_version = $this->get_asset_version($css_rel);
        $js_version = $this->get_asset_version('assets/dist/widget.js');

        wp_enqueue_style('ai-woo-sa-widget-css', AI_WOO_SA_PLUGIN_URL . $css_rel, array('ai-woo-sa-google-fonts'), $css_version);
        wp_enqueue_script('ai-woo-sa-widget-js', AI_WOO_SA_PLUGIN_URL . 'assets/dist/widget.js', array(), $js_version, array('in_footer' => true, 'strategy' => 'defer'));

        $options = get_option('ai_woo_sa_settings');
        $bot_name = !empty($options['bot_name']) ? $options['bot_name'] : 'AI Sales Assistant';
        $wa_number = !empty($options['whatsapp_number']) ? $options['whatsapp_number'] : '';

        $current_product = null;
        if (function_exists('is_product') && is_product() && function_exists('wc_get_product')) {
            $product = wc_get_product(get_the_ID());
            if ($product && is_a($product, 'WC_Product')) {
                $current_product = array(
                    'id' => $product->get_id(),
                    'name' => $product->get_name(),
                    'desc' => wp_trim_words(wp_strip_all_tags($product->get_short_description()), 20, '...')
                );
            }
        }

        $cart_items = array();
        if (function_exists('WC') && isset(WC()->cart) && !WC()->cart->is_empty()) {
            foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
                if (isset($cart_item['data']) && is_a($cart_item['data'], 'WC_Product')) {
                    $cart_items[] = array(
                        'id' => $cart_item['data']->get_id(),
                        'name' => $cart_item['data']->get_name(),
                        'qty' => $cart_item['quantity']
                    );
                }
            }
        }

        // Pass AJAX URL, Nonce, and Checkout URL to JS
        wp_localize_script('ai-woo-sa-widget-js', 'aiWooSaConfig', array(
            'restUrl' => esc_url_raw(rest_url('ai-assistant/v1/chat')),
            'nonce' => wp_create_nonce('wp_rest'),
            'checkoutUrl' => function_exists('wc_get_checkout_url') ? esc_url_raw(wc_get_checkout_url()) : home_url('/checkout/'),
            'botName' => sanitize_text_field($bot_name),
            'wcAjaxUrl' => class_exists('WC_AJAX') ? WC_AJAX::get_endpoint('add_to_cart') : esc_url_raw(home_url('/?wc-ajax=add_to_cart')),
            'waNumber' => sanitize_text_field($wa_number),
            'currentProduct' => $current_product,
            'cartItems' => $cart_items,
            'isLoggedIn' => is_user_logged_in(),
            'orderTrackingUrl' => esc_url_raw(!empty($options['order_tracking_url']) ? $options['order_tracking_url'] : 'https://shinyoungbeauty.com/lacak-pesanan/'),
            'myAccountUrl' => function_exists('wc_get_account_endpoint_url') ? esc_url_raw(wc_get_account_endpoint_url('orders')) : home_url('/my-account/orders/'),
        ));
    }

    /**
     * Render the basic HTML structure for the widget in the footer.
     */
    public function render_widget_html()
    {
        ?>
        <div id="ai-woo-sa-widget-root"></div>
        <?php
    }
}

/**
 * Initialize the plugin.
 */
function run_ai_woo_sales_assistant()
{
    AI_Woo_Sales_Assistant::get_instance();
}
add_action('plugins_loaded', 'run_ai_woo_sales_assistant');

/**
 * Create chat logs table on plugin activation.
 */
function ai_woo_sa_activate()
{
    require_once plugin_dir_path(__FILE__) . 'includes/class-chat-logger.php';
    AI_Woo_SA_Chat_Logger::create_table();
}
register_activation_hook(__FILE__, 'ai_woo_sa_activate');

/**
 * Clear scheduled cron on plugin deactivation.
 */
function ai_woo_sa_deactivate()
{
    AI_Woo_SA_Chat_Logger::unschedule_cleanup();
}
register_deactivation_hook(__FILE__, 'ai_woo_sa_deactivate');
