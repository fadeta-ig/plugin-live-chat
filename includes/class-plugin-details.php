<?php
/**
 * Plugin Details Class
 *
 * Hooks into WordPress internals to display a custom "View details" modal
 * for this private plugin in the wp-admin/plugins.php page.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Plugin_Details {

    /**
     * Plugin slug identifier used by WordPress.
     */
    const SLUG = 'ai-woo-sales-assistant';

    /**
     * Hook into WordPress to inject custom details.
     */
    public function __construct() {
        // Intercept the API request that builds the "View details" modal
        add_filter( 'plugins_api', array( $this, 'inject_plugin_info' ), 20, 3 );
        
        // Ensure the "View details" link appears in the plugin row
        add_filter( 'plugin_row_meta', array( $this, 'add_view_details_link' ), 10, 2 );
    }

    /**
     * Ensures a "View details" link is present in the plugins list.
     * 
     * @param array  $plugin_meta An array of the plugin's metadata.
     * @param string $plugin_file Path to the plugin file, relative to the plugins directory.
     * @return array
     */
    public function add_view_details_link( $plugin_meta, $plugin_file ) {
        // Check if this is our plugin
        if ( strpos( $plugin_file, self::SLUG . '.php' ) !== false ) {
            $details_url = self_admin_url( 'plugin-install.php?tab=plugin-information&plugin=' . self::SLUG . '&TB_iframe=true&width=600&height=550' );
            $view_details_link = sprintf( '<a href="%s" class="thickbox open-plugin-details-modal" aria-label="%s" data-title="%s">%s</a>',
                esc_url( $details_url ),
                esc_attr( sprintf( __( 'More information about %s' ), 'AI WooCommerce Sales Assistant' ) ),
                esc_attr( 'AI WooCommerce Sales Assistant' ),
                __( 'View details' )
            );

            // Add the link if it's not already there
            $found = false;
            foreach ( $plugin_meta as $meta_item ) {
                if ( strpos( $meta_item, 'plugin-install.php?tab=plugin-information' ) !== false ) {
                    $found = true;
                    break;
                }
            }

            if ( ! $found ) {
                $plugin_meta[] = $view_details_link;
            }
        }

        return $plugin_meta;
    }

    /**
     * Intercepts the WordPress API request and returns our custom specs.
     * 
     * @param false|object|array $res    The result object or array. Default false.
     * @param string             $action The type of information being requested from the Plugin Installation API.
     * @param object             $args   Plugin API arguments.
     * @return object
     */
    public function inject_plugin_info( $res, $action, $args ) {
        // We only care about plugin information requests
        if ( 'plugin_information' !== $action ) {
            return $res;
        }

        // We only care about our specific plugin
        if ( empty( $args->slug ) || $args->slug !== self::SLUG ) {
            return $res;
        }

        $res = new stdClass();
        
        // Basic Info
        $res->name          = 'AI WooCommerce Sales Assistant';
        $res->slug          = self::SLUG;
        $res->version       = AI_WOO_SA_VERSION;
        $res->author        = '<a href="#">Fadeta Ilhan</a>';
        $res->author_profile= '';
        $res->requires      = '5.8';
        $res->tested        = '6.5';
        $res->requires_php  = '7.4';
        $res->last_updated  = gmdate( 'Y-m-d H:i:s' );
        $res->homepage      = '';
        
        // Build the HTML for the Description tab
        $description_html = '
        <p><strong>AI WooCommerce Sales Assistant</strong> mengubah toko online standar Anda menjadi pengalaman berbelanja <em>high-end</em> dengan asisten virtual cerdas yang siaga 24/7. Berperan layaknya <strong>Premium Beauty Advisor</strong> di toko fisik mewah.</p>
        
        <h3>🌟 Nilai Jual Utama (Value Proposition)</h3>
        <p>Sistem ini tidak hanya menjawab pertanyaan dasar, melainkan mampu memahami konteks keluhan pelanggan, memberikan rekomendasi produk yang sangat akurat, melacak pesanan secara otomatis, dan berkomunikasi dengan nada yang elegan, ramah, serta profesional dalam bahasa apa pun.</p>
        
        <h3>💎 Fitur Unggulan Sistem</h3>
        <ul>
            <li><strong>🧠 Smart Contextual Recommendations (RAG):</strong> Memahami keluhan (misal: "rambut lepek"). Sistem mencari secara matematis menggunakan <em>Vector Search</em> (Pinecone) untuk mencocokkan keluhan dengan produk.</li>
            <li><strong>🛒 Cart Awareness:</strong> Sistem sadar akan isi keranjang belanja pelanggan dan secara cerdas menghindari rekomendasi produk yang sudah ada di keranjang, berfokus pada <em>cross-selling</em> produk pelengkap.</li>
            <li><strong>📦 Full-Service Order Management:</strong> Pelanggan dapat melacak status pengiriman dan mengecek detail pesanan langsung di dalam jendela chat secara <em>real-time</em>. Terintegrasi mulus dengan plugin <em>woo-mengantar</em> dan status WooCommerce.</li>
            <li><strong>🌍 Seamless Multilingual Support:</strong> Secara otomatis menyesuaikan bahasa balasan dengan bahasa pelanggan (Inggris, Mandarin, dll). Didukung algoritma <em>Translation-in-Transit</em> yang menerjemahkan kueri ke bahasa Indonesia di belakang layar agar pencarian database tetap 100% akurat.</li>
            <li><strong>⚡ Interaksi Instan ala ChatGPT:</strong> Teknologi <em>Server-Sent Events (SSE) Streaming</em> menghasilkan balasan kata demi kata secara instan tanpa jeda <em>loading</em> yang panjang.</li>
            <li><strong>🎨 Antarmuka (UI) Premium & Elegan:</strong> Desain <em>glassmorphism</em> yang mewah, dilengkapi dengan <em>Status Badges</em> berwarna untuk pelacakan pesanan (misal: Hijau untuk Selesai, Biru untuk Diproses).</li>
            <li><strong>🛡️ Human Fallback:</strong> Sistem memiliki sensor keluhan/frustrasi otomatis. Jika pengguna marah atau menanyakan hal di luar konteks toko, AI langsung mengarahkan percakapan ke Customer Service manusia.</li>
            <li><strong>🔒 Enterprise-Grade Cyber Defense & Autonomous IP Firewall (Baru di v2.7.1):</strong> Sistem pertahanan siber multi-lapis untuk memproteksi toko, API, dan server dari serangan siber:
                <ul>
                    <li><em>Pre-flight Threat Inspection:</em> Pemindaian heuristik mendalam terhadap XSS, script injection (JS, PHP, Shell), manipulasi skema JSON / role spoofing, SQL Injection, Local File Inclusion (LFI), dan Server-Side Template Injection (SSTI) sebelum pesan diproses LLM.</li>
                    <li><em>Anti-Social Engineering & Covenant Shield:</em> Menolak secara absolut segala upaya manipulasi, bujuk rayu, intimidasi, atau tipuan prompt injection yang berupaya mengekstrak API Key, kredensial database, atau rahasia server.</li>
                    <li><em>Autonomous Strike-based IP Blacklisting:</em> Mesin akumulasi pelanggaran (strikes) yang otomatis memblokir alamat IP penyerang sementara maupun permanen secara seketika.</li>
                    <li><em>Admin Security Firewall Hub:</em> Panel kontrol visual di WordPress Admin lengkap dengan metrik serangan real-time, data grid pemblokiran IP, pencarian, fitur unblock instan, dan proteksi admin self-lockout.</li>
                    <li><em>Network & Protocol Hardening:</em> Proteksi Anti-CORS pada REST API, validasi SSRF pada koneksi Pinecone host, enkripsi sesi CSPRNG (<code>crypto.getRandomValues</code>), serta pembersihan data rahasia (secret scrubbing) otomatis pada stream SSE secara langsung.</li>
                </ul>
            </li>
        </ul>

        <h3>🔄 Bagaimana Sistem Ini Bekerja?</h3>
        <p>Di balik kecerdasannya, AI bekerja menggunakan sistem <strong>"Penyeleksi Niat" (Intent Router 7-Arah)</strong> layaknya resepsionis cerdas:</p>
        <ol>
            <li><strong>Mendeteksi Niat:</strong> AI (Groq 8B) menganalisis pesan dan mengklasifikasikannya ke 7 kategori (Sapaan, Cari Produk, Lacak Pesanan, Detail Pesanan, Info Toko, dll).</li>
            <li><strong>Retrieval (RAG):</strong> Mengambil data dari Vector Database atau Order Database sesuai niat pengguna.</li>
            <li><strong>Generasi Teks:</strong> Model Groq Llama-3 70B meracik informasi tersebut menjadi balasan yang natural, elegan, dan ringkas.</li>
        </ol>
        ';

        // Build the HTML for the Installation tab
        $installation_html = '
        <h3>Persyaratan Sistem</h3>
        <ul>
            <li>PHP 7.4 atau lebih tinggi</li>
            <li>WordPress 5.8+ & WooCommerce Aktif</li>
            <li>API Key dari <strong>Groq</strong> (untuk Inference LLM)</li>
            <li>API Key dari <strong>Google Gemini</strong> (untuk Embeddings)</li>
            <li>API Key & Index Host dari <strong>Pinecone</strong> (Vector Database)</li>
        </ul>

        <h3>Langkah Instalasi</h3>
        <ol>
            <li>Aktifkan plugin dari halaman Plugins WordPress.</li>
            <li>Buka menu <strong>AI Sales Assistant</strong> di sidebar admin.</li>
            <li>Masukkan semua API Key yang dibutuhkan di tab <em>Settings</em>.</li>
            <li>Isi <strong>Store SOP & Knowledge Base</strong> untuk memberikan konteks khusus pada AI.</li>
            <li>Buka tab <em>Data Sync</em> dan klik <strong>Sync All Products to Pinecone</strong> agar AI mengenali katalog produk Anda.</li>
            <li>Plugin siap digunakan! Widget chat akan muncul di pojok kanan bawah halaman website Anda.</li>
        </ol>
        ';

        // Build the HTML for the FAQ tab
        $faq_html = '
        <h3>Apakah AI merespons dengan cepat?</h3>
        <p><strong>Ya.</strong> Kami menggunakan <em>Groq Llama-3</em> (salah satu model tercepat di dunia) dikombinasikan dengan teknik <em>SSE Streaming</em>. Jawaban akan muncul mengetik kata demi kata secara instan. Selain itu, fitur <em>Semantic Caching</em> membuat pertanyaan berulang dijawab seketika dari <em>cache</em> memori.</p>

        <h3>Apakah bisa berbahasa Inggris atau bahasa asing lainnya?</h3>
        <p><strong>Sangat bisa.</strong> Fitur <em>Language Mirroring</em> kami memaksa AI untuk mengikuti bahasa pengguna. Jika turis bertanya dalam bahasa Inggris, AI membalas dalam bahasa Inggris sambil menerjemahkan deskripsi produk katalog (yang berbahasa Indonesia) secara otomatis.</p>

        <h3>Bagaimana privasi data pesanan pelanggan dijaga?</h3>
        <p>Modul pesanan memiliki verifikasi keamanan ketat. Data pesanan hanya akan diekstrak jika ID Pesanan cocok dengan ID Pengguna yang sedang <em>login</em>. Pengguna tamu (<em>guest</em>) akan diarahkan ke URL halaman pelacakan pesanan publik untuk keamanan.</p>

        <h3>Bagaimana keamanan sistem terhadap manipulasi prompt dan serangan cyber?</h3>
        <p><strong>Sangat aman dan terlindungi penuh.</strong> Sistem dilengkapi modul pertahanan <code>AI_Woo_SA_Security_Guard</code> yang aktif pada layer terluar sebelum input menyentuh model AI. Input divalidasi dari script injection, JSON role spoofing, SQLi, hingga LFI. Jika penyerang mencoba merayu atau memaksa AI membocorkan API Key atau database credentials, sistem langsung menolak dan otomatis memblokir IP penyerang tanpa menguras kuota token (Zero Token Waste).</p>
        ';

        // Build the HTML for the Changelog tab
        $changelog_html = '
        <h3>Changelog</h3>
        <h4>v2.7.1 - Multi-Layer Cybersecurity & Autonomous IP Firewall</h4>
        <ul>
            <li><strong>Automated IP Firewall & Strike Engine:</strong> Pemblokiran IP otomatis berbasis akumulasi pelanggaran (strikes) dengan durasi blokir sementara maupun permanen untuk penyerang cyber.</li>
            <li><strong>Deep Pre-flight Threat Inspection:</strong> Pemindaian real-time terhadap injeksi skrip (XSS, PHP, Bash), manipulasi payload JSON / role spoofing, SQL Injection, Path Traversal / LFI, dan Template Injection (SSTI).</li>
            <li><strong>Social Engineering & Prompt Injection Covenant:</strong> Hardening prompt sistem untuk menolak secara absolut pembocoran API Key, kredensial database, atau rahasia server terhadap segala bentuk bujuk rayu, manipulasi, dan social engineering.</li>
            <li><strong>Admin Security & Firewall Management:</strong> Tab baru "Security & IP Firewall" di dashboard admin dengan statistik ancaman live, tabel IP terblokir, pencarian IP, tools unblock/block manual, dan proteksi admin self-lockout.</li>
            <li><strong>Network & Protocol Hardening:</strong> Validasi Anti-CORS pada REST API endpoint, proteksi SSRF pada koneksi Pinecone host, real-time secret redactor pada streaming SSE chunks, dan CSPRNG untuk ID sesi client.</li>
        </ul>
        <h4>v2.7.0 - Security Hardening & Zero-Token Dropper</h4>
        <ul>
            <li>Implementasi modul sentral <code>AI_Woo_SA_Security_Guard</code> di seluruh layer endpoint REST API dan admin.</li>
            <li>Pencegahan pemborosan token (Zero Token Waste) dengan langsung memutus koneksi permintaan berbahaya di Layer 0.</li>
            <li>Penambahan masking kata sandi dan sensor input API Key pada panel pengaturan WordPress Admin.</li>
        </ul>
        <h4>v2.6.8 - Core Stability & Connection Optimization</h4>
        <ul>
            <li>Optimasi cURL TCP Keep-Alive dan pemaksaan resolusi IPv4 untuk mencegah DNS timeout pada API Groq, Gemini, dan Pinecone.</li>
            <li>Peningkatan efisiensi pembersihan berkala log percakapan via WordPress Cron.</li>
        </ul>
        <h4>v2.5.2 - UI & Presentation Update</h4>
        <ul>
            <li>Added Native WordPress "View details" Modal for System Specifications.</li>
            <li>Enhanced Markdown and HTML layouts for admin presentation.</li>
        </ul>
        <h4>v2.5.1 - Multilingual Engine</h4>
        <ul>
            <li>Implemented <em>Language Mirroring</em> (forces LLM to reply in user\'s language).</li>
            <li>Implemented <em>Translation-in-Transit</em> RAG optimization for foreign language searches.</li>
        </ul>
        <h4>v2.5.0 - Full-Service Assistant</h4>
        <ul>
            <li>Introduced 7-intent AI Router (Order Tracking, Order Details, Store Info).</li>
            <li>Integrated <em>woo-mengantar</em> automated shipping status extraction.</li>
            <li>Added dynamic color-coded Order Cards UI in frontend widget.</li>
        </ul>
        ';

        // Assign the sections to the response object
        $res->sections = array(
            'description'  => $description_html,
            'installation' => $installation_html,
            'faq'          => $faq_html,
            'changelog'    => $changelog_html,
        );

        return $res;
    }
}
