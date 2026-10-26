import { getConfig } from '../../core/config.store';
import { LAST_SEEN_PRODUCT_KEY } from '../../core/constants';
import { escapeHtml } from '../../utils/escape-html';
import { readStorage, writeStorage } from '../../utils/safe-storage';
import { appendMessage } from './append-message';

/** Nudges the user once when they navigate to a product page they have not discussed yet. */
export const injectContextNudge = (): void => {
    const { currentProduct } = getConfig();
    if (!currentProduct) return;

    const currentProductId = String(currentProduct.id);
    if (readStorage(LAST_SEEN_PRODUCT_KEY) === currentProductId) return;

    const nudgeHtml = `<p>Btw Kak, saya lihat Kakak sedang melihat <strong>${escapeHtml(currentProduct.name)}</strong> ya? Ada yang bisa saya bantu jelaskan tentang produk ini?</p>`;
    appendMessage(nudgeHtml, 'bot', true, true).classList.add('ai-woo-sa-nudge');
    writeStorage(LAST_SEEN_PRODUCT_KEY, currentProductId);
};
