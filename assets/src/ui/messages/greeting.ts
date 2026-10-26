import { getConfig } from '../../core/config.store';
import { LAST_SEEN_PRODUCT_KEY } from '../../core/constants';
import { escapeHtml } from '../../utils/escape-html';
import { writeStorage } from '../../utils/safe-storage';
import { appendMessage } from './append-message';

const buildGenericGreeting = (botName: string): string =>
    `<p>Halo! Saya ${escapeHtml(botName)}. Ada yang bisa saya bantu hari ini?</p>`;

const buildProductGreeting = (name: string, description: string): string => {
    let html = `<p>Halo Kak! Sedang melihat <strong>${escapeHtml(name)}</strong> ya?</p>`;
    if (description) {
        html += `<p style="font-size: 13px; color: var(--text-light); margin-top: 4px;"><em>${escapeHtml(description)}</em></p>`;
    }
    return `${html}<p style="margin-top: 4px;">Ada yang ingin ditanyakan tentang produk ini?</p>`;
};

export const initGreeting = (save = true): void => {
    const { botName, currentProduct } = getConfig();
    const greetingHtml = currentProduct
        ? buildProductGreeting(currentProduct.name, currentProduct.desc)
        : buildGenericGreeting(botName);

    appendMessage(greetingHtml, 'bot', save, true);
    if (currentProduct) writeStorage(LAST_SEEN_PRODUCT_KEY, String(currentProduct.id));
};
