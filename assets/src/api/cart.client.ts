import { getConfig } from '../core/config.store';
import { isRecord } from '../utils/type-guards';

export interface AddToCartResult {
    ok: boolean;
    fragments: unknown;
    cartHash: unknown;
}

/** Calls the WooCommerce add_to_cart AJAX endpoint (quantity 1). */
export const postAddToCart = async (productId: number): Promise<AddToCartResult> => {
    const formData = new FormData();
    formData.append('product_id', String(productId));
    formData.append('quantity', '1');

    const response = await fetch(getConfig().wcAjaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
    });
    const data: unknown = await response.json();

    if (!isRecord(data) || data.error) return { ok: false, fragments: null, cartHash: null };
    return { ok: true, fragments: data.fragments, cartHash: data.cart_hash };
};
