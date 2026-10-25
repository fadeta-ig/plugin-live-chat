<?php
/**
 * Text Normalizer
 *
 * Pure, stateless helpers for matching informal Indonesian chat text
 * ("haloo", "makasiih", "Halo, kak!!") against fixed phrase lexicons.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Text_Normalizer {

    /**
     * Lowercase, strip punctuation/symbols and collapse whitespace.
     */
    public static function to_plain( string $text ): string {
        $lowercased = mb_strtolower( $text, 'UTF-8' );
        $spaced     = preg_replace( '/[^\p{L}\p{N}\s]+/u', ' ', $lowercased );
        $condensed  = preg_replace( '/\s+/u', ' ', (string) $spaced );

        return trim( (string) $condensed );
    }

    /**
     * Collapse any run of the same letter into a single letter ("haloo" => "halo").
     */
    public static function collapse_repeated_letters( string $text ): string {
        return (string) preg_replace( '/(\p{L})\1+/u', '$1', $text );
    }

    /**
     * Plain text with repeated letters collapsed. Apply to BOTH sides when comparing.
     */
    public static function to_collapsed( string $text ): string {
        return self::collapse_repeated_letters( self::to_plain( $text ) );
    }

    /**
     * True when $phrase appears in $plain_text as a whole word/phrase
     * (so "resi" never matches inside "resign").
     */
    public static function contains_phrase( string $plain_text, string $phrase ): bool {
        $plain_phrase = self::to_plain( $phrase );
        if ( $plain_phrase === '' ) {
            return false;
        }

        $pattern = '/(?<![\p{L}\p{N}])' . preg_quote( $plain_phrase, '/' ) . '(?![\p{L}\p{N}])/u';

        return preg_match( $pattern, $plain_text ) === 1;
    }

    /**
     * Build a lookup set (collapsed phrase => true) from a phrase list.
     *
     * @param string[] $phrases
     * @return array<string,bool>
     */
    public static function build_collapsed_set( array $phrases ): array {
        $set = array();
        foreach ( $phrases as $phrase ) {
            $collapsed = self::to_collapsed( (string) $phrase );
            if ( $collapsed !== '' ) {
                $set[ $collapsed ] = true;
            }
        }

        return $set;
    }
}
