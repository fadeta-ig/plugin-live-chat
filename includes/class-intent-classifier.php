<?php
/**
 * Intent Classifier
 *
 * Two-stage router:
 *  1. Deterministic, whole-message local pre-filters (zero API cost).
 *  2. History-aware LLM classification for everything that is not unambiguous.
 *
 * Returns: ['intent' => string, 'search_query' => string, 'order_number' => string]
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Intent_Classifier {

    const INTENT_GREETING       = 'GREETING';
    const INTENT_PRODUCT_QUERY  = 'PRODUCT_QUERY';
    const INTENT_ORDER_TRACKING = 'ORDER_TRACKING';
    const INTENT_ORDER_DETAIL   = 'ORDER_DETAIL';
    const INTENT_ORDER_LIST     = 'ORDER_LIST';
    const INTENT_STORE_INFO     = 'STORE_INFO';
    const INTENT_GENERAL_CHAT   = 'GENERAL_CHAT';
    const INTENT_OUT_OF_SCOPE   = 'OUT_OF_SCOPE';

    const MAX_LOCAL_GREETING_WORDS = 8;

    /**
     * @param string $message             Raw user message.
     * @param string $conversation_digest Recent turns, used to resolve follow-ups.
     */
    public static function classify( string $message, string $conversation_digest = '' ): array {
        $local_intent = self::classify_locally( $message );
        if ( $local_intent !== '' ) {
            return self::build_result( $local_intent );
        }

        $plain_message = AI_Woo_SA_Text_Normalizer::to_plain( $message );
        $order_number  = self::extract_order_number( $message );

        $order_intent = self::detect_order_intent( $plain_message );
        if ( $order_intent !== '' ) {
            return self::build_result( $order_intent, '', $order_number );
        }

        $groq       = new AI_Woo_SA_Groq_Client();
        $llm_result = $groq->classify_intent( $message, $conversation_digest );

        return self::finalize_llm_result( $llm_result, $message, $order_number );
    }

    /**
     * Whole-message matching only. "halo mau tanya serum retinol" must NOT be a
     * greeting, because the real question would then get no product context.
     *
     * @return string Intent constant, or '' when the message needs deeper analysis.
     */
    private static function classify_locally( string $message ): string {
        $core_phrase = self::extract_core_phrase( $message );
        if ( $core_phrase === false ) {
            return '';
        }

        if ( $core_phrase === '' ) {
            return self::INTENT_GREETING;
        }

        if ( isset( self::conversational_phrase_set()[ $core_phrase ] ) ) {
            return self::INTENT_GREETING;
        }

        if ( isset( self::gratitude_phrase_set()[ $core_phrase ] ) ) {
            return self::INTENT_GENERAL_CHAT;
        }

        return '';
    }

    /**
     * Strips leading/trailing greeting tokens and returns what is left.
     *
     * @return string|false '' when the message is only greetings; false when too long to judge locally.
     */
    private static function extract_core_phrase( string $message ) {
        $collapsed = AI_Woo_SA_Text_Normalizer::to_collapsed( $message );
        if ( $collapsed === '' ) {
            return '';
        }

        $tokens = explode( ' ', $collapsed );
        if ( count( $tokens ) > self::MAX_LOCAL_GREETING_WORDS ) {
            return false;
        }

        $greeting_tokens = self::greeting_token_set();
        $start           = 0;
        $end             = count( $tokens );

        while ( $start < $end && isset( $greeting_tokens[ $tokens[ $start ] ] ) ) {
            $start++;
        }
        while ( $end > $start && isset( $greeting_tokens[ $tokens[ $end - 1 ] ] ) ) {
            $end--;
        }

        return implode( ' ', array_slice( $tokens, $start, $end - $start ) );
    }

    /**
     * Precise whole-phrase order detection. Bare words such as "kirim" or
     * "pengiriman" are intentionally absent: "ongkir kirim ke Bali?" is store policy.
     */
    private static function detect_order_intent( string $plain_message ): string {
        $phrase_groups = array(
            self::INTENT_ORDER_TRACKING => AI_Woo_SA_Intent_Lexicon::TRACKING_PHRASES,
            self::INTENT_ORDER_DETAIL   => AI_Woo_SA_Intent_Lexicon::DETAIL_PHRASES,
            self::INTENT_ORDER_LIST     => AI_Woo_SA_Intent_Lexicon::LIST_PHRASES,
        );

        foreach ( $phrase_groups as $intent => $phrases ) {
            foreach ( $phrases as $phrase ) {
                if ( AI_Woo_SA_Text_Normalizer::contains_phrase( $plain_message, $phrase ) ) {
                    return $intent;
                }
            }
        }

        return '';
    }

    /**
     * Matches "#12345" or "pesanan/order/no/nomor 12345" as whole words.
     */
    private static function extract_order_number( string $message ): string {
        if ( preg_match( '/#(\d{3,})/', $message, $matches ) ) {
            return $matches[1];
        }
        if ( preg_match( '/(?<![\p{L}\p{N}])(?:pesanan|order|no|nomor)(?![\p{L}\p{N}])\s*[:.]?\s*(\d{3,})/iu', $message, $matches ) ) {
            return $matches[1];
        }

        return '';
    }

    private static function finalize_llm_result( array $llm_result, string $message, string $regex_order_number ): array {
        $valid_intents = array(
            self::INTENT_GREETING,
            self::INTENT_PRODUCT_QUERY,
            self::INTENT_ORDER_TRACKING,
            self::INTENT_ORDER_DETAIL,
            self::INTENT_ORDER_LIST,
            self::INTENT_STORE_INFO,
            self::INTENT_GENERAL_CHAT,
            self::INTENT_OUT_OF_SCOPE,
        );

        $intent = isset( $llm_result['intent'] ) ? (string) $llm_result['intent'] : '';
        if ( ! in_array( $intent, $valid_intents, true ) ) {
            $intent = self::INTENT_PRODUCT_QUERY;
        }

        $search_query = isset( $llm_result['search_query'] ) ? trim( (string) $llm_result['search_query'] ) : '';
        if ( $intent === self::INTENT_PRODUCT_QUERY && $search_query === '' ) {
            $search_query = $message;
        }
        if ( $intent !== self::INTENT_PRODUCT_QUERY ) {
            $search_query = '';
        }

        $order_number = isset( $llm_result['order_number'] ) ? trim( (string) $llm_result['order_number'] ) : '';
        if ( $order_number === '' ) {
            $order_number = $regex_order_number;
        }

        return self::build_result( $intent, $search_query, $order_number );
    }

    private static function build_result( string $intent, string $search_query = '', string $order_number = '' ): array {
        return array(
            'intent'       => $intent,
            'search_query' => $search_query,
            'order_number' => $order_number,
        );
    }

    private static function greeting_token_set(): array {
        static $set = null;
        if ( $set === null ) {
            $set = AI_Woo_SA_Text_Normalizer::build_collapsed_set( AI_Woo_SA_Intent_Lexicon::GREETING_TOKENS );
        }

        return $set;
    }

    private static function conversational_phrase_set(): array {
        static $set = null;
        if ( $set === null ) {
            $set = AI_Woo_SA_Text_Normalizer::build_collapsed_set(
                array_merge( AI_Woo_SA_Intent_Lexicon::IDENTITY_PHRASES, AI_Woo_SA_Intent_Lexicon::OPENER_PHRASES )
            );
        }

        return $set;
    }

    private static function gratitude_phrase_set(): array {
        static $set = null;
        if ( $set === null ) {
            $set = AI_Woo_SA_Text_Normalizer::build_collapsed_set( AI_Woo_SA_Intent_Lexicon::GRATITUDE_PHRASES );
        }

        return $set;
    }
}
