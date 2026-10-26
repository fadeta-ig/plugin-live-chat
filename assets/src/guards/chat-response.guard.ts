import type { ChatResponse } from '../types/chat.types';
import { isRecord, toText } from '../utils/type-guards';
import { asOrdersPayload } from './order.guard';
import { asProductList } from './product.guard';

export const toChatResponse = (payload: unknown): ChatResponse => {
    const data = isRecord(payload) ? payload : {};
    return {
        text: toText(data.text),
        products: asProductList(data.products),
        orders: asOrdersPayload(data.orders),
        fallback: Boolean(data.fallback),
        waLink: toText(data.wa_link) || null,
        blocked: Boolean(data.blocked),
    };
};
