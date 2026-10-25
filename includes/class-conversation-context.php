<?php
/**
 * Conversation Context
 *
 * Converts stored Gemini-format chat history into a compact plain-text digest.
 * The stateless intent router previously saw only the last message, so every
 * follow-up ("yang itu berapa?", "kalau kulit sensitif?") was ambiguous.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Conversation_Context {

    const MAX_TURNS          = 6;
    const MAX_CHARS_PER_TURN = 280;

    /**
     * @param array $chat_history History entries: ['role' => 'user'|'model', 'parts' => [['text' => ...]]].
     * @return string Digest lines, oldest first. Empty string when there is no history.
     */
    public static function build_digest( array $chat_history ): string {
        $recent_turns = array_slice( $chat_history, -self::MAX_TURNS );
        $lines        = array();

        foreach ( $recent_turns as $turn ) {
            $line = self::format_turn( $turn );
            if ( $line !== '' ) {
                $lines[] = $line;
            }
        }

        return implode( "\n", $lines );
    }

    private static function format_turn( $turn ): string {
        if ( ! is_array( $turn ) || ! isset( $turn['role'], $turn['parts'][0]['text'] ) ) {
            return '';
        }

        $clean_text = self::strip_machine_markers( (string) $turn['parts'][0]['text'] );
        if ( $clean_text === '' ) {
            return '';
        }

        $speaker = $turn['role'] === 'model' ? 'Asisten' : 'Pengguna';

        return $speaker . ': ' . self::truncate( $clean_text );
    }

    private static function strip_machine_markers( string $text ): string {
        $without_tags = preg_replace( '/\[RECOMMEND:[^\]]*\]?/u', '', $text );
        $condensed    = preg_replace( '/\s+/u', ' ', (string) $without_tags );

        return trim( (string) $condensed );
    }

    private static function truncate( string $text ): string {
        if ( mb_strlen( $text, 'UTF-8' ) <= self::MAX_CHARS_PER_TURN ) {
            return $text;
        }

        return mb_substr( $text, 0, self::MAX_CHARS_PER_TURN, 'UTF-8' ) . '…';
    }
}
