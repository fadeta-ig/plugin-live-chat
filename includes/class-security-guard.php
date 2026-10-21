<?php
/**
 * Security Guard Class
 *
 * Implements a multi-layered defensive barrier for the AI Live Chat:
 * 1. Request Payload Schema & Parameter Validation
 * 2. IP Validation (Cloudflare & Proxy aware)
 * 3. Deep Threat Inspection (Script/XSS, Code Injection, JSON Injection, SQLi, LFI, SSTI, Jailbreaks)
 * 4. Automatic IP Blocking & Strike Management
 * 5. Outgoing Response Sanitization (Secret redaction)
 *
 * @package AI_Woo_Sales_Assistant
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Security_Guard {

    const OPTION_BLOCKED_IPS       = 'ai_woo_sa_blocked_ips';
    const TRANSIENT_STRIKE_PREFIX  = 'ai_woo_sa_strike_';
    const MAX_STRIKES              = 2;
    const DEFAULT_BAN_HOURS        = 24;
    const MAX_MESSAGE_LENGTH       = 1000;

    /**
     * Retrieve the real client IP address safely, supporting Cloudflare and reverse proxies.
     *
     * @return string Sanitized and validated IP address.
     */
    public static function get_client_ip() {
        $ip = '';

        if ( ! empty( $_SERVER['HTTP_CF_CONNECTING_IP'] ) ) {
            $ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_CF_CONNECTING_IP'] ) );
        } elseif ( ! empty( $_SERVER['HTTP_X_REAL_IP'] ) ) {
            $ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_REAL_IP'] ) );
        } elseif ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
            $raw_ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
            $ip = trim( $raw_ips[0] );
        } elseif ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) ) {
            $ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_CLIENT_IP'] ) );
        } elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
            $ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
        }

        // Strip port number if IPv4:PORT format
        if ( preg_match( '/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/', $ip, $matches ) ) {
            $ip = $matches[1];
        }

        if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
            return '127.0.0.1';
        }

        return $ip;
    }

    /**
     * Strictly validate and sanitize incoming REST API chat request parameters.
     * Prevents buffer overflows, format string exploits, session tampering, and malicious payloads.
     *
     * @param array $params Raw request parameters.
     * @return array|WP_Error Validated parameters or WP_Error on failure.
     */
    public static function validate_request_payload( $params ) {
        if ( ! is_array( $params ) ) {
            return new WP_Error( 'invalid_format', 'Payload JSON harus berupa objek yang valid.', array( 'status' => 400 ) );
        }

        $raw_message    = isset( $params['message'] ) ? (string) $params['message'] : '';
        $raw_session_id = isset( $params['session_id'] ) ? (string) $params['session_id'] : '';

        // 1. Session ID validation: Alphanumeric, underscores, hyphens, length 8-64
        if ( empty( $raw_session_id ) || ! preg_match( '/^[a-zA-Z0-9_-]{8,64}$/', $raw_session_id ) ) {
            return new WP_Error( 'invalid_session', 'Format Session ID tidak valid.', array( 'status' => 400 ) );
        }

        // 2. Message presence check
        $trimmed_message = trim( $raw_message );
        if ( '' === $trimmed_message ) {
            return new WP_Error( 'empty_message', 'Pesan tidak boleh kosong.', array( 'status' => 400 ) );
        }

        // 3. Message length check (DoS & token flood protection)
        if ( mb_strlen( $trimmed_message, 'UTF-8' ) > self::MAX_MESSAGE_LENGTH ) {
            return new WP_Error( 'message_too_long', 'Pesan melebihi batas maksimum ' . self::MAX_MESSAGE_LENGTH . ' karakter.', array( 'status' => 413 ) );
        }

        // 4. Null-byte poisoning check
        if ( strpos( $raw_message, "\0" ) !== false || strpos( $raw_message, "%00" ) !== false ) {
            return new WP_Error( 'illegal_payload', 'Terdeteksi karakter terlarang dalam pesan.', array( 'status' => 400 ) );
        }

        // 5. Sanitize message
        $message = sanitize_text_field( $trimmed_message );

        // 6. Current product validation
        $current_product = null;
        if ( isset( $params['current_product'] ) && is_array( $params['current_product'] ) ) {
            $current_product = array(
                'id'   => isset( $params['current_product']['id'] ) ? absint( $params['current_product']['id'] ) : 0,
                'name' => isset( $params['current_product']['name'] ) ? sanitize_text_field( mb_substr( (string) $params['current_product']['name'], 0, 120 ) ) : '',
                'desc' => isset( $params['current_product']['desc'] ) ? sanitize_text_field( mb_substr( (string) $params['current_product']['desc'], 0, 200 ) ) : '',
            );
        }

        // 7. Cart items validation (max 20 items to prevent context poisoning)
        $cart_items = array();
        if ( isset( $params['cart_items'] ) && is_array( $params['cart_items'] ) ) {
            $slice = array_slice( $params['cart_items'], 0, 20 );
            foreach ( $slice as $item ) {
                if ( is_array( $item ) && isset( $item['id'] ) ) {
                    $cart_items[] = array(
                        'id'   => absint( $item['id'] ),
                        'name' => isset( $item['name'] ) ? sanitize_text_field( mb_substr( (string) $item['name'], 0, 100 ) ) : '',
                        'qty'  => isset( $item['qty'] ) ? absint( $item['qty'] ) : 1,
                    );
                }
            }
        }

        return array(
            'message'         => $message,
            'session_id'      => $raw_session_id,
            'current_product' => $current_product,
            'cart_items'      => $cart_items,
        );
    }

    /**
     * Check if a specific IP address is currently blocked.
     * Automatically cleans up expired bans.
     *
     * @param string|null $ip Optional IP to check, defaults to current client IP.
     * @return bool True if IP is blocked, false otherwise.
     */
    public static function is_ip_blocked( $ip = null ) {
        $target_ip = $ip ? $ip : self::get_client_ip();
        $blocked   = get_option( self::OPTION_BLOCKED_IPS, array() );

        if ( ! is_array( $blocked ) || empty( $blocked ) ) {
            return false;
        }

        $now          = time();
        $needs_update = false;

        foreach ( $blocked as $stored_ip => $data ) {
            if ( isset( $data['expires_at'] ) && $data['expires_at'] > 0 && $data['expires_at'] <= $now ) {
                unset( $blocked[ $stored_ip ] );
                $needs_update = true;
            }
        }

        if ( $needs_update ) {
            update_option( self::OPTION_BLOCKED_IPS, $blocked );
        }

        return isset( $blocked[ $target_ip ] );
    }

    /**
     * Block an IP address with a given reason and duration.
     *
     * @param string $ip             Target IP address.
     * @param string $reason         Human-readable reason for blocking.
     * @param int    $duration_hours Ban duration in hours (0 for permanent).
     * @return bool Success status.
     */
    public static function block_ip( $ip, $reason = '', $duration_hours = self::DEFAULT_BAN_HOURS ) {
        if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
            return false;
        }

        // Whitelist localhost/loopback from accidental permanent bans
        if ( in_array( $ip, array( '127.0.0.1', '::1' ), true ) ) {
            return false;
        }

        // Prevent admin from accidentally blocking their own IP address (Self-Lockout Protection)
        if ( is_user_logged_in() && current_user_can( 'manage_options' ) && $ip === self::get_client_ip() ) {
            return false;
        }

        $blocked = get_option( self::OPTION_BLOCKED_IPS, array() );
        if ( ! is_array( $blocked ) ) {
            $blocked = array();
        }

        $now        = time();
        $expires_at = ( $duration_hours > 0 ) ? ( $now + ( $duration_hours * HOUR_IN_SECONDS ) ) : 0;

        $blocked[ $ip ] = array(
            'ip'         => $ip,
            'reason'     => ! empty( $reason ) ? sanitize_text_field( $reason ) : 'Pelanggaran keamanan terdeteksi',
            'blocked_at' => $now,
            'expires_at' => $expires_at,
        );

        return update_option( self::OPTION_BLOCKED_IPS, $blocked );
    }

    /**
     * Unblock an IP address manually.
     *
     * @param string $ip Target IP address.
     * @return bool Success status.
     */
    public static function unblock_ip( $ip ) {
        $blocked = get_option( self::OPTION_BLOCKED_IPS, array() );
        if ( ! is_array( $blocked ) || ! isset( $blocked[ $ip ] ) ) {
            return false;
        }

        unset( $blocked[ $ip ] );
        delete_transient( self::TRANSIENT_STRIKE_PREFIX . md5( $ip ) );

        return update_option( self::OPTION_BLOCKED_IPS, $blocked );
    }

    /**
     * Get all currently blocked IP records.
     *
     * @return array List of blocked IP entries.
     */
    public static function get_blocked_ips() {
        self::is_ip_blocked(); // Triggers auto-prune of expired blocks
        $blocked = get_option( self::OPTION_BLOCKED_IPS, array() );
        return is_array( $blocked ) ? $blocked : array();
    }

    /**
     * Deep inspection of user message for all known cyber attack vectors:
     * - Script / XSS / Code Execution / Shell Injection
     * - Structured JSON Injection / Role Spoofing
     * - SQL Injection (SQLi)
     * - Path Traversal / LFI
     * - SSTI & Expression Injection
     * - Credential & Secret Harvesting
     * - Social Engineering & Jailbreak Prompts
     *
     * @param string $message Raw user message.
     * @return array Threat evaluation result.
     */
    public static function inspect_threat( $message ) {
        $clean   = mb_strtolower( trim( $message ), 'UTF-8' );
        $trimmed = trim( $message );

        // 1. Binary / Non-printable Control Characters Injection
        if ( preg_match( '/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $message ) ) {
            return array(
                'is_threat' => true,
                'severity'  => 'CRITICAL',
                'category'  => 'BINARY_INJECTION',
                'reason'    => 'Karakter kontrol biner / null byte tidak sah terdeteksi',
            );
        }

        // 2. Script & HTML / XSS Injection
        $script_patterns = array(
            '/<(script|iframe|object|embed|svg|applet|meta|link|style|base|form|input|button|details)\b/iu',
            '/\b(onload|onerror|onclick|onmouseover|onfocus|onblur|onchange|onsubmit|onreset|onselect|onkeydown|onkeypress|onkeyup|autofocus)\s*=/iu',
            '/\b(javascript|vbscript|data):/iu',
            '/(<\?php|<\?=|<\%|\b(eval|assert|passthru|shell_exec|system|exec|proc_open|popen|file_get_contents|file_put_contents)\s*\()/iu',
            '/([;&|`]\s*(rm|cat|ls|whoami|id|wget|curl|chmod|bash|sh|nc)\b|\$\([a-zA-Z0-9_\s]+\))/iu',
        );
        foreach ( $script_patterns as $sp ) {
            if ( preg_match( $sp, $message ) ) {
                return array(
                    'is_threat' => true,
                    'severity'  => 'CRITICAL',
                    'category'  => 'CODE_OR_SCRIPT_INJECTION',
                    'reason'    => 'Injeksi script (XSS/PHP/Shell) terdeteksi',
                );
            }
        }

        // 3. JSON Structured Injection / Schema Spoofing
        if ( ( str_starts_with( $trimmed, '{' ) && str_ends_with( $trimmed, '}' ) ) || ( str_starts_with( $trimmed, '[' ) && str_ends_with( $trimmed, ']' ) ) ) {
            $decoded = json_decode( $trimmed, true );
            if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
                $danger_keys = array(
                    'role', 'content', 'system', 'prompt', 'instruction', 'function',
                    'tool_call', 'jsonrpc', 'method', '__proto__', 'constructor',
                    'prototype', 'query', 'sql', 'command', 'exec', 'database', 'apikey', 'key', 'admin', 'intent',
                );
                $flat_keys = self::get_array_keys_recursive( $decoded );
                foreach ( $danger_keys as $dk ) {
                    if ( in_array( $dk, $flat_keys, true ) ) {
                        return array(
                            'is_threat' => true,
                            'severity'  => 'CRITICAL',
                            'category'  => 'JSON_STRUCTURED_INJECTION',
                            'reason'    => "Injeksi payload JSON terlarang: key '{$dk}'",
                        );
                    }
                }
            }
        }

        // Embedded JSON role spoofing inside natural text
        $embedded_json_patterns = array(
            '/"(role|content|system|instruction|system_prompt)"\s*:\s*"(system|assistant|admin|override|developer|root)"/iu',
            '/"(__proto__|constructor|prototype)"\s*:/iu',
            '/"jsonrpc"\s*:\s*"2\.0"/iu',
        );
        foreach ( $embedded_json_patterns as $ejp ) {
            if ( preg_match( $ejp, $message ) ) {
                return array(
                    'is_threat' => true,
                    'severity'  => 'CRITICAL',
                    'category'  => 'JSON_STRUCTURED_INJECTION',
                    'reason'    => 'Upaya manipulasi struktur internal JSON',
                );
            }
        }

        // 4. SQL Injection (SQLi)
        $sqli_patterns = array(
            '/\b(union(\s+all)?\s+select|select\s+.*?\s+from|insert\s+into|delete\s+from|drop\s+(table|database)|truncate\s+table|alter\s+table)\b/iu',
            '/\b(information_schema|sys\.tables|sys\.columns|pg_catalog|into\s+(out|dump)file)\b/iu',
            '/(\'|\")\s*(or|and)\s*(\'|\")?\d+(\'|\")?\s*=\s*(\'|\")?\d+/iu',
            '/\b(sleep\s*\(\s*\d+\s*\)|benchmark\s*\(\s*\d+|waitfor\s+delay)\b/iu',
        );
        foreach ( $sqli_patterns as $sqli ) {
            if ( preg_match( $sqli, $clean ) ) {
                return array(
                    'is_threat' => true,
                    'severity'  => 'CRITICAL',
                    'category'  => 'SQL_INJECTION',
                    'reason'    => 'Pola serangan SQL Injection terdeteksi',
                );
            }
        }

        // 5. Path Traversal & LFI
        $traversal_patterns = array(
            '/(\.\.\/|\.\.\\|\/etc\/passwd|\/etc\/shadow|c:\\windows|wp-config\.php|\.env\b)/iu',
        );
        foreach ( $traversal_patterns as $tp ) {
            if ( preg_match( $tp, $clean ) ) {
                return array(
                    'is_threat' => true,
                    'severity'  => 'CRITICAL',
                    'category'  => 'PATH_TRAVERSAL',
                    'reason'    => 'Upaya penelusuran berkas direktori (LFI/Path Traversal)',
                );
            }
        }

        // 6. Server-Side Template Injection (SSTI) & Expression Languages
        if ( preg_match( '/(\{\{.*?\}\}|\$\{.*?\}|<\%=.*?\%>|\#\{.*?\}|\*\{.*?\})/iu', $message ) ) {
            return array(
                'is_threat' => true,
                'severity'  => 'HIGH',
                'category'  => 'TEMPLATE_INJECTION',
                'reason'    => 'Upaya injeksi sintaks template (SSTI)',
            );
        }

        // 7. Credential & Key Harvesting
        $credential_patterns = array(
            '/\b(api[_\s-]?key|kunci[_\s-]?api|secret[_\s-]?key|private[_\s-]?key|access[_\s-]?token)\b/iu',
            '/\b(groq[_\s-]?key|gemini[_\s-]?key|pinecone[_\s-]?key|openai[_\s-]?key)\b/iu',
            '/\b(database[_\s-]?password|password[_\s-]?database|db[_\s-]?pass|db[_\s-]?user|db[_\s-]?name)\b/iu',
            '/\b(wp-config(\.php)?|\.env\b|process\.env|db_password|db_host)\b/iu',
            '/\b(wp_users|wp_usermeta|information_schema)\b/iu',
            '/(minta|berikan|kasih|bocorkan|show|give|reveal|dump|print)\s+.*?(key|kunci|kredensial|credential|password|token|database)/iu',
        );
        foreach ( $credential_patterns as $cp ) {
            if ( preg_match( $cp, $clean ) ) {
                return array(
                    'is_threat' => true,
                    'severity'  => 'CRITICAL',
                    'category'  => 'CREDENTIAL_HARVESTING',
                    'reason'    => 'Upaya ekstraksi kunci API / kredensial database',
                );
            }
        }

        // 8. Social Engineering, Impersonation & Jailbreak Prompts
        $jailbreak_patterns = array(
            '/(saya|aku)\s+(adalah|ini)?\s*(admin|developer|programmer|pemilik|owner|bos|teknisi|founder|it\s+support)/iu',
            '/(urgent|darurat|maintenance|perbaikan|audit)\s+.*?(akses|key|password|kredensial|database)/iu',
            '/(ignore|abaikan|lupakan)\s+(all|previous|semua)?\s*(instructions|instruksi|perintah|aturan)/iu',
            '/(mode\s+developer|developer\s+mode|dan\s+mode|jailbreak|unrestricted|tanpa\s+batasan)/iu',
            '/(system\s+prompt|instruksi\s+sistem|prompt\s+awal|cetak\s+prompt|print\s+prompt|show\s+prompt)/iu',
            '/(act\s+as|berpura-pura|jadilah)\s+(unfiltered|tanpa\s+sensor|hacker|root|terminal)/iu',
            '/(terjemahkan|eja|encode)\s+.*?(api[_\s-]?key|kunci\s+rahasia|password)/iu',
        );
        foreach ( $jailbreak_patterns as $jp ) {
            if ( preg_match( $jp, $clean ) ) {
                return array(
                    'is_threat' => true,
                    'severity'  => 'HIGH',
                    'category'  => 'PROMPT_INJECTION_OR_IMPERSONATION',
                    'reason'    => 'Upaya rekayasa sosial / manipulasi prompt instruksi',
                );
            }
        }

        return array(
            'is_threat' => false,
            'severity'  => 'NONE',
            'category'  => 'NONE',
            'reason'    => '',
        );
    }

    /**
     * Recursively extract all keys from an array or nested object.
     *
     * @param array $array Input array.
     * @return array List of string keys.
     */
    private static function get_array_keys_recursive( array $array ) {
        $keys = array();
        foreach ( $array as $key => $value ) {
            $keys[] = (string) $key;
            if ( is_array( $value ) ) {
                $keys = array_merge( $keys, self::get_array_keys_recursive( $value ) );
            }
        }
        return array_unique( $keys );
    }

    /**
     * Record a security violation for an IP and trigger automatic ban if threshold met.
     *
     * @param string $ip     Client IP address.
     * @param array  $threat Threat evaluation result from inspect_threat().
     * @return bool True if IP was blocked as a result, false otherwise.
     */
    public static function record_violation( $ip, $threat ) {
        if ( empty( $ip ) || empty( $threat['is_threat'] ) ) {
            return false;
        }

        // Immediate ban for critical severity attacks (scripts, json injection, SQLi, LFI, credential theft)
        if ( isset( $threat['severity'] ) && $threat['severity'] === 'CRITICAL' ) {
            self::block_ip( $ip, $threat['reason'] . ' (Ancaman Kritis)', self::DEFAULT_BAN_HOURS );
            return true;
        }

        // Strike accumulation for high-severity threats (jailbreak, SSTI)
        $strike_key = self::TRANSIENT_STRIKE_PREFIX . md5( $ip );
        $strikes    = (int) get_transient( $strike_key );
        $strikes++;

        if ( $strikes >= self::MAX_STRIKES ) {
            self::block_ip( $ip, $threat['reason'] . ' (Akumulasi Pelanggaran)', self::DEFAULT_BAN_HOURS );
            delete_transient( $strike_key );
            return true;
        }

        // Expire strikes after 1 hour window
        set_transient( $strike_key, $strikes, HOUR_IN_SECONDS );
        return false;
    }

    /**
     * Generate an appropriate defensive refusal message.
     *
     * @param bool $is_blocked Whether the IP was just blocked.
     * @return string Human-friendly defensive refusal.
     */
    public static function get_security_refusal_message( $is_blocked = false ) {
        if ( $is_blocked ) {
            return 'Peringatan Keamanan: Terdeteksi aktivitas atau injeksi kode/script yang melanggar kebijakan integritas sistem kami. Alamat IP Anda telah ditangguhkan secara otomatis demi perlindungan data.';
        }

        return 'Maaf, sebagai asisten penjualan resmi, saya tidak dapat memproses perintah sistem, script, struktur kode, maupun kredensial internal. Ada produk kecantikan yang dapat saya bantu carikan?';
    }

    /**
     * Scrub sensitive keys, tokens, or credential signatures from outgoing text.
     *
     * @param string $text Outgoing response text.
     * @return string Scrubbed safe text.
     */
    public static function sanitize_outgoing_response( $text ) {
        if ( empty( $text ) ) {
            return $text;
        }

        // Gemini API Key pattern
        $text = preg_replace( '/AIzaSy[A-Za-z0-9_-]{28,36}/', '[PROTECTED_API_KEY]', $text );
        // Groq API Key pattern
        $text = preg_replace( '/gsk_[A-Za-z0-9]{35,}/', '[PROTECTED_API_KEY]', $text );
        // Pinecone API Key pattern
        $text = preg_replace( '/pcsk_[A-Za-z0-9_-]{35,}/', '[PROTECTED_API_KEY]', $text );

        return $text;
    }

    /**
     * Validate an external URL against Server-Side Request Forgery (SSRF).
     * Enforces HTTPS protocol, checks for allowed domains, and rejects private/loopback/cloud metadata IP addresses.
     *
     * @param string   $url             Target URL to validate.
     * @param string[] $allowed_domains Whitelisted domain suffixes (e.g. ['pinecone.io']).
     * @return true|WP_Error True if safe, WP_Error if SSRF detected.
     */
    public static function validate_ssrf_url( $url, $allowed_domains = array( 'pinecone.io' ) ) {
        if ( empty( $url ) ) {
            return new WP_Error( 'ssrf_empty_url', 'URL tidak boleh kosong.' );
        }

        $parsed = function_exists( 'wp_parse_url' ) ? wp_parse_url( $url ) : parse_url( $url );
        if ( ! is_array( $parsed ) || empty( $parsed['scheme'] ) || empty( $parsed['host'] ) ) {
            return new WP_Error( 'ssrf_invalid_url', 'Format URL tidak valid.' );
        }

        // 1. Strict HTTPS only
        if ( strtolower( $parsed['scheme'] ) !== 'https' ) {
            return new WP_Error( 'ssrf_insecure_scheme', 'Hanya protokol HTTPS aman yang diizinkan.' );
        }

        $host = strtolower( $parsed['host'] );

        // 2. Reject raw IP addresses in hostname
        if ( filter_var( $host, FILTER_VALIDATE_IP ) ) {
            return new WP_Error( 'ssrf_ip_forbidden', 'Penggunaan alamat IP mentah tidak diizinkan.' );
        }

        // 3. Domain suffix whitelist validation
        $domain_matched = false;
        foreach ( $allowed_domains as $allowed ) {
            if ( $host === $allowed || str_ends_with( $host, '.' . $allowed ) ) {
                $domain_matched = true;
                break;
            }
        }

        if ( ! $domain_matched ) {
            return new WP_Error( 'ssrf_unauthorized_domain', "Domain '{$host}' tidak termasuk dalam daftar domain tepercaya yang diizinkan." );
        }

        return true;
    }

    /**
     * Verify that incoming chat REST API requests originate from the legitimate site origin (Anti-CORS / Anti-DoW).
     *
     * @param WP_REST_Request $request REST request object.
     * @return bool True if allowed, false if foreign origin blocked.
     */
    public static function is_request_origin_allowed( $request ) {
        $origin  = $request->get_header( 'origin' );
        $referer = $request->get_header( 'referer' );

        $site_host = function_exists( 'wp_parse_url' ) ? wp_parse_url( home_url(), PHP_URL_HOST ) : parse_url( home_url(), PHP_URL_HOST );
        if ( empty( $site_host ) ) {
            return true;
        }

        // Check Origin header if present
        if ( ! empty( $origin ) ) {
            $origin_host = function_exists( 'wp_parse_url' ) ? wp_parse_url( $origin, PHP_URL_HOST ) : parse_url( $origin, PHP_URL_HOST );
            if ( ! empty( $origin_host ) && strtolower( $origin_host ) !== strtolower( $site_host ) && ! in_array( $origin_host, array( 'localhost', '127.0.0.1' ), true ) ) {
                return false;
            }
        }

        // Check Referer header if present
        if ( ! empty( $referer ) ) {
            $referer_host = function_exists( 'wp_parse_url' ) ? wp_parse_url( $referer, PHP_URL_HOST ) : parse_url( $referer, PHP_URL_HOST );
            if ( ! empty( $referer_host ) && strtolower( $referer_host ) !== strtolower( $site_host ) && ! in_array( $referer_host, array( 'localhost', '127.0.0.1' ), true ) ) {
                return false;
            }
        }

        return true;
    }
}
