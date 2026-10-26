import type { HistoryItem } from '../types/chat.types';
import { isRecord } from '../utils/type-guards';
import { asOrder } from './order.guard';
import { asProduct } from './product.guard';

const asMessageItem = (value: Record<string, unknown>): HistoryItem | null => {
    const { text, sender, isRawHtml } = value;
    if (typeof text !== 'string') return null;
    if (sender !== 'bot' && sender !== 'user') return null;
    return { type: 'msg', text, sender, isRawHtml: Boolean(isRawHtml) };
};

export const asHistoryItem = (value: unknown): HistoryItem | null => {
    if (!isRecord(value)) return null;

    switch (value.type) {
        case 'msg':
            return asMessageItem(value);
        case 'product': {
            const data = asProduct(value.data);
            return data ? { type: 'product', data } : null;
        }
        case 'order': {
            const data = asOrder(value.data);
            return data ? { type: 'order', data } : null;
        }
        case 'wa':
            return typeof value.link === 'string' ? { type: 'wa', link: value.link } : null;
        case 'tracking_redirect':
            return typeof value.url === 'string'
                ? { type: 'tracking_redirect', url: value.url }
                : null;
        default:
            return null;
    }
};
