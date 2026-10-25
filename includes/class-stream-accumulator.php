<?php
/**
 * Stream Accumulator
 *
 * Collects assistant text from OpenAI-compatible SSE chunks. cURL may split
 * a "data: {...}" line across callbacks, so a line buffer is kept.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Stream_Accumulator {

    private $line_buffer = '';
    private $text        = '';
    private $has_failed  = false;

    public function feed( string $chunk ): void {
        $this->line_buffer .= $chunk;

        $lines             = explode( "\n", $this->line_buffer );
        $this->line_buffer = (string) array_pop( $lines );

        foreach ( $lines as $line ) {
            $this->consume_line( $line );
        }
    }

    public function mark_failed(): void {
        $this->has_failed = true;
    }

    public function has_failed(): bool {
        return $this->has_failed;
    }

    /**
     * Flushes any trailing unterminated line and returns the full text.
     */
    public function get_text(): string {
        if ( trim( $this->line_buffer ) !== '' ) {
            $this->consume_line( $this->line_buffer );
            $this->line_buffer = '';
        }

        return $this->has_failed ? '' : trim( $this->text );
    }

    private function consume_line( string $line ): void {
        $trimmed = trim( $line );
        if ( strpos( $trimmed, 'data:' ) !== 0 ) {
            return;
        }

        $payload = trim( substr( $trimmed, 5 ) );
        if ( $payload === '' || $payload === '[DONE]' ) {
            return;
        }

        $decoded = json_decode( $payload, true );
        if ( ! is_array( $decoded ) || ! isset( $decoded['choices'][0]['delta']['content'] ) ) {
            return;
        }

        $delta = $decoded['choices'][0]['delta']['content'];
        if ( is_string( $delta ) ) {
            $this->text .= $delta;
        }
    }
}
