const HTML_ESCAPE_MAP: Readonly<Record<string, string>> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

/** Escapes text for safe use in HTML content and quoted attributes. */
export const escapeHtml = (value: string): string =>
    value.replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character] ?? character);
