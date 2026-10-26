import { postAddToCart } from '../../api/cart.client';
import { getConfig } from '../../core/config.store';
import {
    CART_BUTTON_ADDED,
    CART_BUTTON_ERROR,
    CART_BUTTON_LABEL,
    CART_BUTTON_PENDING,
    CART_ERROR_RESET_MS,
} from '../../ui/labels';
import { sendMessage } from '../chat/send-message';

const buildCrossSellPrompt = (productTitle: string): string =>
    `[CROSS-SELL] "${productTitle}" ditambahkan ke keranjang. Ucapkan terima kasih 1 kalimat, lalu rekomendasikan 1 produk pelengkap.`;

const showCartError = (button: HTMLButtonElement): void => {
    button.textContent = CART_BUTTON_ERROR;
    button.disabled = false;
    window.setTimeout(() => {
        button.textContent = CART_BUTTON_LABEL;
    }, CART_ERROR_RESET_MS);
};

const refreshWooCommerceFragments = (
    button: HTMLButtonElement,
    fragments: unknown,
    cartHash: unknown,
): void => {
    const { jQuery } = window;
    if (!jQuery) return;
    jQuery(document.body).trigger('added_to_cart', [fragments, cartHash, jQuery(button)]);
    jQuery(document.body).trigger('wc_fragment_refresh');
};

export const addToCart = async (
    productId: number,
    button: HTMLButtonElement,
    productTitle: string,
): Promise<void> => {
    button.disabled = true;
    button.innerHTML = `<span class="ai-woo-sa-btn-spinner"></span> ${CART_BUTTON_PENDING}`;

    try {
        const result = await postAddToCart(productId);
        if (!result.ok) {
            showCartError(button);
            return;
        }

        button.textContent = CART_BUTTON_ADDED;
        button.classList.add('added');
        getConfig().cartItems.push({ id: productId, name: productTitle, qty: 1 });
        refreshWooCommerceFragments(button, result.fragments, result.cartHash);
        void sendMessage(buildCrossSellPrompt(productTitle), true);
    } catch (error) {
        showCartError(button);
        console.error('AI Woo SA Add-to-Cart Error:', error);
    }
};
