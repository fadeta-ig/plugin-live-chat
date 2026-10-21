<?php
/**
 * Chat Utilities Class
 *
 * Contains helper functions for cosine similarity, complaints detection,
 * and triggering human fallback responses.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Chat_Utils {

    /**
     * Calculate cosine similarity between two vectors.
     */
    public static function calculate_cosine_similarity( $vec1, $vec2 ) {
        $dot_product = 0;
        $norm_a = 0;
        $norm_b = 0;
        $count = min( count( $vec1 ), count( $vec2 ) );
        for ( $i = 0; $i < $count; $i++ ) {
            $dot_product += $vec1[$i] * $vec2[$i];
            $norm_a += $vec1[$i] * $vec1[$i];
            $norm_b += $vec2[$i] * $vec2[$i];
        }
        if ( $norm_a == 0 || $norm_b == 0 ) return 0;
        return $dot_product / ( sqrt( $norm_a ) * sqrt( $norm_b ) );
    }

    /**
     * Detect frustration or escalation keywords.
     */
    public static function is_complaint( $message ) {
        $keywords = array(
            'tidak membantu', 'operator', 'komplain', 'manusia',
            'kecewa', 'customer service', 'hubungi cs', 'bicara dengan orang',
        );
        $lower_message = mb_strtolower( $message, 'UTF-8' );
        foreach ( $keywords as $kw ) {
            if ( mb_strpos( $lower_message, $kw, 0, 'UTF-8' ) !== false ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate a human fallback response with WhatsApp link.
     */
    public static function trigger_human_fallback( $whatsapp_number, $session_id = '', $user_message = '' ) {
        $wa_link = '';
        if ( ! empty( $whatsapp_number ) ) {
            $wa_link = 'https://wa.me/' . $whatsapp_number . '?text=' . rawurlencode( 'Halo CS, Saya butuh bantuan.' );
        }

        $response_text = "Maaf, sepertinya saya tidak dapat menemukan informasi yang tepat untuk pertanyaan Anda. Silakan hubungi Customer Service kami untuk bantuan lebih lanjut.";

        if ( ! empty( $session_id ) ) {
            AI_Woo_SA_Chat_Logger::log( $session_id, $user_message, $response_text, true, 0, 0.0, 'COMPLAINT' );
        }

        return rest_ensure_response( array(
            'text'     => $response_text,
            'products' => array(),
            'orders'   => array(),
            'fallback' => true,
            'wa_link'  => $wa_link,
        ) );
    }
}
