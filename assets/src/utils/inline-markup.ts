import { escapeHtml } from './escape-html';
import { stripEmojis } from './emoji-filter';
import { toSafeLink } from './safe-url';

const BOLD_PATTERN = /\*\*(.*?)\*\*/g;
const ITALIC_PATTERN = /(?<!\*)\*([^*]+)\*(?!\*)/g;
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

/** Formats already-escaped markdown text into HTML (bold, italic, list, link, br). */
export const applyInlineMarkup = (escapedText: string): string => {
    const withLinks = escapedText.replace(LINK_PATTERN, (_match, label, url) => {
        const safeUrl = escapeHtml(toSafeLink(url));
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-text-link">${label}</a>`;
    });

    const withStyles = withLinks
        .replace(BOLD_PATTERN, '<strong>$1</strong>')
        .replace(ITALIC_PATTERN, '<em>$1</em>');

    const lines = withStyles.split('\n');
    const result: string[] = [];
    let inList = false;

    for (const line of lines) {
        const trimmed = line.trim();
        const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
        if (bulletMatch && bulletMatch[1]) {
            if (!inList) {
                result.push('<ul class="ai-woo-sa-list">');
                inList = true;
            }
            result.push(`<li>${bulletMatch[1]}</li>`);
        } else {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            if (trimmed) result.push(trimmed);
        }
    }
    if (inList) result.push('</ul>');

    return result.join('<br>');
};

/** Strips emoji, escapes HTML, then applies luxury markdown formatting. */
export const renderPlainMessage = (text: string): string =>
    applyInlineMarkup(escapeHtml(stripEmojis(text)));
