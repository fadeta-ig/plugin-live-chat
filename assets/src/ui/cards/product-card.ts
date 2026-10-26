import type { ProductPayload } from '../../types/chat.types';
import { emitAddToCart } from '../../core/event-bus';
import { pushHistory, saveHistory } from '../../core/history.service';
import { escapeHtml } from '../../utils/escape-html';
import { formatRupiah } from '../../utils/format';
import { toSafeImageUrl, toSafeLink } from '../../utils/safe-url';
import { CART_BUTTON_LABEL } from '../labels';
import { appendToChat } from '../message-list';

const buildImageHtml = (product: ProductPayload, safeTitle: string): string => {
    const imageUrl = toSafeImageUrl(product.image_url);
    if (!imageUrl) return '';
    return `<img src="${escapeHtml(imageUrl)}" alt="${safeTitle}" class="ai-woo-sa-product-image" loading="lazy" />`;
};

export const buildProductCardElement = (product: ProductPayload): HTMLElement => {
    const card = document.createElement('div');
    card.className = 'ai-woo-sa-product-card';
    const safeTitle = escapeHtml(product.title);
    const permalink = escapeHtml(toSafeLink(product.permalink));

    card.innerHTML = `
        ${buildImageHtml(product, safeTitle)}
        <div class="ai-woo-sa-product-title">${safeTitle}</div>
        <div class="ai-woo-sa-product-price">Rp ${formatRupiah(product.price)}</div>
        <div class="ai-woo-sa-product-actions">
            <div class="ai-woo-sa-product-buttons">
                <button class="ai-woo-sa-btn-cart" data-product-id="${product.product_id}">${CART_BUTTON_LABEL}</button>
                <a href="${permalink}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-link">Lihat</a>
            </div>
            <div class="ai-woo-sa-post-cart" style="display:none;"></div>
        </div>`;

    const cartButton = card.querySelector<HTMLButtonElement>('.ai-woo-sa-btn-cart');
    if (cartButton) {
        cartButton.addEventListener('click', () =>
            emitAddToCart({
                productId: product.product_id,
                button: cartButton,
                productTitle: product.title,
            }),
        );
    }
    return card;
};

export const appendProductCard = (product: ProductPayload, save = true): void => {
    const card = buildProductCardElement(product);
    appendToChat(card);
    if (!save) return;
    pushHistory({ type: 'product', data: product });
    saveHistory();
};
