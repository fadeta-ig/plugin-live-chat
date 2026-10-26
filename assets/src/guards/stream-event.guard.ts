import type { StreamEvent } from '../types/chat.types';
import { isRecord, toText } from '../utils/type-guards';
import { asOrdersPayload } from './order.guard';
import { asProductList } from './product.guard';

const readDeltaContent = (payload: Record<string, unknown>): string => {
    const choices = payload.choices;
    if (!Array.isArray(choices)) return '';
    const firstChoice: unknown = choices[0];
    if (!isRecord(firstChoice) || !isRecord(firstChoice.delta)) return '';
    const content = firstChoice.delta.content;
    return typeof content === 'string' ? content : '';
};

export const toStreamEvent = (payload: unknown): StreamEvent | null => {
    if (!isRecord(payload)) return null;

    if (payload.products || payload.orders) {
        return {
            kind: 'meta',
            products: asProductList(payload.products),
            orders: asOrdersPayload(payload.orders),
            fallback: Boolean(payload.fallback),
            waLink: toText(payload.wa_link) || null,
        };
    }

    const content = readDeltaContent(payload);
    return content ? { kind: 'token', content } : null;
};
