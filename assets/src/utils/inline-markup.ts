import { escapeHtml } from './escape-html';

const BOLD_PATTERN = /\*\*(.*?)\*\*/g;
const ITALIC_PATTERN = /\*(.*?)\*/g;
const NEWLINE_PATTERN = /\n/g;

/** Applies the lightweight inline markup to text that is already HTML-escaped. */
export const applyInlineMarkup = (escapedText: string): string =>
    escapedText
        .replace(BOLD_PATTERN, '<strong>$1</strong>')
        .replace(ITALIC_PATTERN, '<em>$1</em>')
        .replace(NEWLINE_PATTERN, '<br>');

/** Escapes raw text, then applies inline markup. */
export const renderPlainMessage = (text: string): string => applyInlineMarkup(escapeHtml(text));
