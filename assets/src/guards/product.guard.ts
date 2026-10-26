import type { ProductPayload } from '../types/chat.types';
import { isRecord, toAmount, toText } from '../utils/type-guards';

const DEFAULT_PRODUCT_TITLE = 'Produk';
const DEFAULT_PERMALINK = '#';

export const asProduct = (value: unknown): ProductPayload | null => {
    if (!isRecord(value)) return null;
    const productId = parseInt(toText(value.product_id), 10);
    if (Number.isNaN(productId)) return null;

    return {
        product_id: productId,
        title: toText(value.title) || DEFAULT_PRODUCT_TITLE,
        price: toAmount(value.price),
        permalink: toText(value.permalink) || DEFAULT_PERMALINK,
        image_url: toText(value.image_url),
    };
};

export const asProductList = (value: unknown): ProductPayload[] => {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item: unknown) => {
        const product = asProduct(item);
        return product ? [product] : [];
    });
};
