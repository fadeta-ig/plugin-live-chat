const SAFE_LINK_PATTERN = /^(https?:\/\/|\/)/i;
const SAFE_IMAGE_PATTERN = /^https?:\/\//i;
const WHATSAPP_LINK_PATTERN = /^https:\/\/wa\.me\//i;
const FALLBACK_HREF = '#';

export const toSafeLink = (rawUrl: string): string =>
    SAFE_LINK_PATTERN.test(rawUrl) ? rawUrl : FALLBACK_HREF;

export const toSafeImageUrl = (rawUrl: string): string =>
    SAFE_IMAGE_PATTERN.test(rawUrl) ? rawUrl : '';

export const isWhatsAppLink = (rawUrl: string): boolean => WHATSAPP_LINK_PATTERN.test(rawUrl);
