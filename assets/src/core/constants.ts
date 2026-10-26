export const SESSION_STORAGE_KEY = 'ai_woo_sa_session_id';
export const HISTORY_STORAGE_KEY = 'ai_woo_sa_history';
export const LAST_SEEN_PRODUCT_KEY = 'ai_woo_sa_last_seen_product_id';

export const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;
export const SEND_COOLDOWN_MS = 1500;
export const DELAYED_TYPING_MS = 300;
export const CONTEXT_NUDGE_DELAY_MS = 500;

export const WIDGET_ROOT_ID = 'ai-woo-sa-widget-root';

export const HUMAN_FALLBACK_TOKENS: readonly string[] = ['TRIGGER_HUMAN_FALLBACK', 'TRIGGER_HUMAN'];
export const HUMAN_FALLBACK_MESSAGE =
    'Mohon tunggu, saya sedang menyambungkan Anda dengan Customer Service kami...';
