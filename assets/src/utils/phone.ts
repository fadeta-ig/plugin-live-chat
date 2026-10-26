const WHATSAPP_BASE_URL = 'https://wa.me/';
const INDONESIA_COUNTRY_CODE = '62';

export const normalizeIndonesianNumber = (rawNumber: string): string => {
    const digits = rawNumber.replace(/\D/g, '');
    return digits.startsWith('0') ? INDONESIA_COUNTRY_CODE + digits.slice(1) : digits;
};

export const buildWhatsAppUrl = (rawNumber: string, prefilledText?: string): string => {
    const baseUrl = WHATSAPP_BASE_URL + normalizeIndonesianNumber(rawNumber);
    return prefilledText ? `${baseUrl}?text=${encodeURIComponent(prefilledText)}` : baseUrl;
};
