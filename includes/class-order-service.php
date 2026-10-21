<?php
/**
 * Order Service
 *
 * Secure WooCommerce order data fetcher with access control.
 * Supports woo-mengantar tracking integration and Indonesian status labels.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Order_Service {

    /**
     * Indonesian-friendly status labels.
     */
    private static $status_labels = array(
        'pending'    => 'Menunggu Pembayaran',
        'processing' => 'Sedang Diproses',
        'on-hold'    => 'Ditahan',
        'completed'  => 'Selesai',
        'cancelled'  => 'Dibatalkan',
        'refunded'   => 'Dana Dikembalikan',
        'failed'     => 'Gagal',
        'shipped'    => 'Sedang Dikirim',
        'checkout-draft' => 'Draft',
    );

    /**
     * Mengantar shipping status labels.
     */
    private static $shipping_labels = array(
        'PENDING PICKUP' => 'Menunggu Penjemputan',
        'INCOMING'       => 'Sampai di Hub Transit',
        'OUTGOING'       => 'Dalam Perjalanan',
        'ON DELIVERY'    => 'Sedang Diantar ke Penerima',
        'DELIVERED'      => 'Terkirim',
        'RETURNED'       => 'Dikembalikan',
        'ACTIVE'         => 'Aktif / Dalam Pengiriman',
    );

    /**
     * Get recent orders for a logged-in user.
     *
     * @param int $user_id WordPress user ID.
     * @param int $limit   Max orders to return.
     * @return array Array of formatted order data.
     */
    public static function get_recent_orders( $user_id, $limit = 2 ) {
        if ( ! function_exists( 'wc_get_orders' ) ) {
            return array();
        }

        $orders = wc_get_orders( array(
            'customer_id' => $user_id,
            'limit'       => $limit,
            'orderby'     => 'date',
            'order'       => 'DESC',
            'status'      => array( 'wc-pending', 'wc-processing', 'wc-on-hold', 'wc-completed', 'wc-cancelled', 'wc-refunded', 'wc-shipped' ),
        ) );

        $result = array();
        foreach ( $orders as $order ) {
            $result[] = self::format_order( $order );
        }

        return $result;
    }

    /**
     * Get total order count for a user (for "lihat selengkapnya" note).
     *
     * @param int $user_id WordPress user ID.
     * @return int Total order count.
     */
    public static function get_total_order_count( $user_id ) {
        if ( ! function_exists( 'wc_get_orders' ) ) {
            return 0;
        }

        $orders = wc_get_orders( array(
            'customer_id' => $user_id,
            'limit'       => -1,
            'return'      => 'ids',
            'status'      => array( 'wc-pending', 'wc-processing', 'wc-on-hold', 'wc-completed', 'wc-cancelled', 'wc-refunded', 'wc-shipped' ),
        ) );

        return count( $orders );
    }

    /**
     * Find a specific order by order number — ONLY if owned by the given user.
     *
     * @param string $order_number Order number / ID.
     * @param int    $user_id      WordPress user ID.
     * @return array|null Formatted order data or null if not found/unauthorized.
     */
    public static function find_order_for_user( $order_number, $user_id ) {
        if ( ! function_exists( 'wc_get_order' ) ) {
            return null;
        }

        $order = wc_get_order( absint( $order_number ) );
        if ( ! $order ) {
            return null;
        }

        // Security: verify ownership
        if ( (int) $order->get_customer_id() !== (int) $user_id ) {
            return null;
        }

        return self::format_order( $order );
    }

    /**
     * Format a WC_Order into a clean data array for LLM context.
     *
     * @param WC_Order $order WooCommerce order object.
     * @return array Formatted order data.
     */
    private static function format_order( $order ) {
        $order_id = $order->get_id();
        $status_raw = $order->get_status();
        $status_label = isset( self::$status_labels[ $status_raw ] )
            ? self::$status_labels[ $status_raw ]
            : ucfirst( $status_raw );

        // Build items list
        $items = array();
        foreach ( $order->get_items() as $item ) {
            $items[] = array(
                'name'  => $item->get_name(),
                'qty'   => $item->get_quantity(),
                'total' => number_format( (float) $item->get_total(), 0, ',', '.' ),
            );
        }

        // Get tracking info from woo-mengantar
        $tracking = self::get_mengantar_tracking( $order_id );

        // Get payment method
        $payment = $order->get_payment_method_title();

        return array(
            'order_id'       => $order_id,
            'order_number'   => $order->get_order_number(),
            'date'           => $order->get_date_created()
                ? $order->get_date_created()->date_i18n( 'j M Y' )
                : '-',
            'status'         => $status_label,
            'status_raw'     => $status_raw,
            'items'          => $items,
            'total'          => number_format( (float) $order->get_total(), 0, ',', '.' ),
            'payment_method' => $payment ? $payment : '-',
            'tracking'       => $tracking,
        );
    }

    /**
     * Extract tracking data from woo-mengantar plugin.
     * Auto-detects meta keys with wm/mengantar prefix.
     *
     * @param int $order_id WooCommerce order ID.
     * @return array|null Tracking data or null if not available.
     */
    private static function get_mengantar_tracking( $order_id ) {
        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return null;
        }

        // Strategy 1: Try woo-mengantar serialized data (most common)
        $meta_keys_to_try = array(
            '_wm_shipments',
            '_wm_shipment_data',
            '_woo_mengantar_shipments',
            '_mengantar_shipments',
            '_wm_tracking_data',
        );

        foreach ( $meta_keys_to_try as $key ) {
            $data = $order->get_meta( $key, true );
            if ( ! empty( $data ) ) {
                return self::parse_mengantar_shipment( $data );
            }
        }

        // Strategy 2: Scan all meta for wm/mengantar patterns
        $all_meta = $order->get_meta_data();
        foreach ( $all_meta as $meta ) {
            $meta_key = $meta->key;
            $meta_value = $meta->value;

            // Look for any key containing 'wm' or 'mengantar' with tracking-like data
            if ( preg_match( '/(?:_wm_|mengantar|shipment)/i', $meta_key ) && ! empty( $meta_value ) ) {
                $parsed = self::parse_mengantar_shipment( $meta_value );
                if ( $parsed ) {
                    return $parsed;
                }
            }
        }

        // Strategy 3: Fallback to official WooCommerce Shipment Tracking
        $wc_tracking = $order->get_meta( '_wc_shipment_tracking_items', true );
        if ( ! empty( $wc_tracking ) && is_array( $wc_tracking ) ) {
            $first = $wc_tracking[0];
            return array(
                'courier'         => isset( $first['tracking_provider'] ) ? $first['tracking_provider'] : '-',
                'tracking_number' => isset( $first['tracking_number'] ) ? $first['tracking_number'] : '-',
                'status'          => '-',
                'status_label'    => '-',
                'last_update'     => isset( $first['date_shipped'] ) ? $first['date_shipped'] : '-',
            );
        }

        // Strategy 4: Admin-configured custom meta key
        $options = get_option( 'ai_woo_sa_settings' );
        $custom_key = isset( $options['tracking_meta_key'] ) ? $options['tracking_meta_key'] : '';
        if ( ! empty( $custom_key ) ) {
            $custom_value = $order->get_meta( $custom_key, true );
            if ( ! empty( $custom_value ) ) {
                // Assume it's just a tracking number string
                return array(
                    'courier'         => '-',
                    'tracking_number' => is_string( $custom_value ) ? $custom_value : '-',
                    'status'          => '-',
                    'status_label'    => '-',
                    'last_update'     => '-',
                );
            }
        }

        return null;
    }

    /**
     * Parse woo-mengantar shipment data structure.
     *
     * @param mixed $data Serialized/array shipment data from meta.
     * @return array|null Parsed tracking info or null.
     */
    private static function parse_mengantar_shipment( $data ) {
        if ( is_string( $data ) ) {
            $data = maybe_unserialize( $data );
            if ( is_string( $data ) ) {
                $data = json_decode( $data, true );
            }
        }

        if ( ! is_array( $data ) ) {
            return null;
        }

        // If it's an array of shipments, take the first one
        if ( isset( $data[0] ) && is_array( $data[0] ) ) {
            $data = $data[0];
        }

        // Extract fields using known woo-mengantar field names
        $tracking_number = '';
        $courier = '';
        $status = '';
        $last_update = '';

        // Try various field name patterns
        $tracking_fields = array( 'tracking', 'tracking_number', 'awb', 'resi' );
        foreach ( $tracking_fields as $f ) {
            if ( ! empty( $data[ $f ] ) ) {
                $tracking_number = $data[ $f ];
                break;
            }
        }

        $courier_fields = array( 'courier', 'service', 'carrier', 'provider' );
        foreach ( $courier_fields as $f ) {
            if ( ! empty( $data[ $f ] ) ) {
                $courier = $data[ $f ];
                break;
            }
        }

        $status_fields = array( 'status', 'shipment_status', 'delivery_status' );
        foreach ( $status_fields as $f ) {
            if ( ! empty( $data[ $f ] ) ) {
                $status = strtoupper( $data[ $f ] );
                break;
            }
        }

        // Try to get last history entry
        $history_fields = array( 'history', 'tracking_history', 'histories' );
        foreach ( $history_fields as $f ) {
            if ( ! empty( $data[ $f ] ) && is_array( $data[ $f ] ) ) {
                $latest = $data[ $f ][0];
                if ( isset( $latest['description'] ) ) {
                    $last_update = $latest['description'];
                } elseif ( isset( $latest['desc'] ) ) {
                    $last_update = $latest['desc'];
                }
                break;
            }
        }

        if ( empty( $tracking_number ) && empty( $courier ) ) {
            return null;
        }

        $status_label = isset( self::$shipping_labels[ $status ] )
            ? self::$shipping_labels[ $status ]
            : ( $status ? $status : '-' );

        return array(
            'courier'         => $courier ? strtoupper( $courier ) : '-',
            'tracking_number' => $tracking_number ? $tracking_number : '-',
            'status'          => $status ? $status : '-',
            'status_label'    => $status_label,
            'last_update'     => $last_update ? $last_update : '-',
        );
    }

    /**
     * Build LLM-friendly text context from order data.
     *
     * @param array $order_data Formatted order from format_order().
     * @return string Human-readable order summary for LLM injection.
     */
    public static function build_order_context( $order_data ) {
        $lines = array();
        $lines[] = "Pesanan #{$order_data['order_number']} ({$order_data['date']})";
        $lines[] = "Status: {$order_data['status']}";
        $lines[] = "Total: Rp {$order_data['total']}";
        $lines[] = "Pembayaran: {$order_data['payment_method']}";

        // Items
        $item_parts = array();
        foreach ( $order_data['items'] as $item ) {
            $item_parts[] = "  • {$item['name']} x{$item['qty']} (Rp {$item['total']})";
        }
        if ( ! empty( $item_parts ) ) {
            $lines[] = "Produk:\n" . implode( "\n", $item_parts );
        }

        // Tracking
        if ( ! empty( $order_data['tracking'] ) ) {
            $t = $order_data['tracking'];
            $lines[] = "Kurir: {$t['courier']}";
            $lines[] = "No Resi: {$t['tracking_number']}";
            $lines[] = "Status Pengiriman: {$t['status_label']}";
            if ( $t['last_update'] !== '-' ) {
                $lines[] = "Update Terakhir: {$t['last_update']}";
            }
        }

        return implode( "\n", $lines );
    }

    /**
     * Build context for multiple orders (order list).
     *
     * @param array $orders     Array of formatted order data.
     * @param int   $total_count Total orders this user has.
     * @return string LLM-friendly multi-order context.
     */
    public static function build_order_list_context( $orders, $total_count = 0 ) {
        if ( empty( $orders ) ) {
            return "Pelanggan belum memiliki pesanan.";
        }

        $parts = array();
        foreach ( $orders as $i => $order ) {
            $num = $i + 1;
            $parts[] = "[Pesanan {$num}]\n" . self::build_order_context( $order );
        }

        $text = implode( "\n\n", $parts );

        if ( $total_count > count( $orders ) ) {
            $remaining = $total_count - count( $orders );
            $text .= "\n\n[INFO: Pelanggan memiliki {$remaining} pesanan lainnya. Arahkan ke halaman Akun Saya untuk melihat selengkapnya.]";
        }

        return $text;
    }
}
