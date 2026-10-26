import type { ProductPayload } from '../../types/chat.types';
import { pushHistory, saveHistory } from '../../core/history.service';
import { appendToChat } from '../message-list';
import { buildProductCardElement } from './product-card';

export const appendProductCarousel = (products: ProductPayload[], save = true): void => {
    if (products.length === 0) return;

    const carousel = document.createElement('div');
    carousel.className = 'ai-woo-sa-carousel';
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-label', 'Rekomendasi Produk');

    products.forEach((product) => {
        carousel.appendChild(buildProductCardElement(product));
        if (save) pushHistory({ type: 'product', data: product });
    });

    appendToChat(carousel);
    if (save) saveHistory();
};
