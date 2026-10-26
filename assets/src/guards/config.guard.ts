import type { CartItem, CurrentProduct, WidgetConfig } from '../types/chat.types';
import { isRecord, toText } from '../utils/type-guards';

const DEFAULT_BOT_NAME = 'AI Sales Assistant';

const asCurrentProduct = (value: unknown): CurrentProduct | null => {
    if (!isRecord(value)) return null;
    const id = parseInt(toText(value.id), 10);
    const name = toText(value.name);
    if (Number.isNaN(id) || !name) return null;
    return { id, name, desc: toText(value.desc) };
};

const asCartItems = (value: unknown): CartItem[] => {
    if (!Array.isArray(value)) return [];
    return value.flatMap((entry: unknown) => {
        if (!isRecord(entry)) return [];
        const id = parseInt(toText(entry.id), 10);
        const qty = parseInt(toText(entry.qty), 10);
        return Number.isNaN(id) ? [] : [{ id, name: toText(entry.name), qty: qty || 1 }];
    });
};

/** Validates the wp_localize_script payload; returns null when essentials are missing. */
export const asWidgetConfig = (value: unknown): WidgetConfig | null => {
    if (!isRecord(value)) return null;
    const restUrl = toText(value.restUrl);
    const wcAjaxUrl = toText(value.wcAjaxUrl);
    if (!restUrl || !wcAjaxUrl) return null;

    return {
        restUrl,
        wcAjaxUrl,
        nonce: toText(value.nonce),
        botName: toText(value.botName) || DEFAULT_BOT_NAME,
        waNumber: toText(value.waNumber),
        currentProduct: asCurrentProduct(value.currentProduct),
        cartItems: asCartItems(value.cartItems),
    };
};
