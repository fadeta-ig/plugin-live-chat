import { escapeHtml } from './escape-html';
import { stripEmojis } from './emoji-filter';
import { toSafeLink } from './safe-url';

const BOLD_PATTERN = /\*\*(.*?)\*\*/g;
const ITALIC_PATTERN = /(?<!\*)\*([^*]+)\*(?!\*)/g;
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

const formatInline = (escapedText: string): string => {
    const withLinks = escapedText.replace(LINK_PATTERN, (_match, label, url) => {
        const safeUrl = escapeHtml(toSafeLink(url));
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-text-link">${label}</a>`;
    });

    return withLinks
        .replace(BOLD_PATTERN, '<strong>$1</strong>')
        .replace(ITALIC_PATTERN, '<em>$1</em>');
};

/** Formats escaped text as sibling paragraphs/lists, with no breaks between list items. */
export const applyInlineMarkup = (escapedText: string): string => {
    const lines = escapedText.replace(/\r\n?/g, '\n').split('\n');
    const result: string[] = [];
    let paragraph: string[] = [];
    let list: string[] = [];
    let listType: 'ul' | 'ol' = 'ul';
    let listStart = 1;

    const flushParagraph = (): void => {
        if (paragraph.length) result.push(`<p>${paragraph.join('<br>')}</p>`);
        paragraph = [];
    };
    const flushList = (): void => {
        if (list.length) {
            const start = listType === 'ol' && listStart !== 1 ? ` start="${listStart}"` : '';
            result.push(`<${listType} class="ai-woo-sa-list"${start}>${list.map((item) => `<li>${item}</li>`).join('')}</${listType}>`);
        }
        list = [];
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            flushParagraph();
            continue;
        }
        const bullet = trimmed.match(/^(?:[-*•]|(\d+)[.)])\s+(.+)$/);
        if (bullet) {
            flushParagraph();
            const type = bullet[1] ? 'ol' : 'ul';
            if (list.length && listType !== type) flushList();
            if (!list.length) listStart = bullet[1] ? Number(bullet[1]) : 1;
            listType = type;
            list.push(formatInline(bullet[2] ?? ''));
            continue;
        }
        if (list.length && /^\s+/.test(line)) {
            list[list.length - 1] += ` ${formatInline(trimmed)}`;
            continue;
        }
        flushList();
        paragraph.push(formatInline(trimmed));
    }
    flushParagraph();
    flushList();

    return result.join('');
};

/** Strips emoji and escapes HTML before rendering message blocks. */
export const renderPlainMessage = (text: string): string =>
    applyInlineMarkup(escapeHtml(stripEmojis(text)));
