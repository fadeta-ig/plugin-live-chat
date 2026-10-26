import { getConfig } from '../../core/config.store';
import { LAST_SEEN_PRODUCT_KEY } from '../../core/constants';
import { escapeHtml } from '../../utils/escape-html';
import { writeStorage } from '../../utils/safe-storage';
import { appendMessage } from './append-message';
import { appendWelcomeScreen } from '../welcome/welcome-screen';

const buildProductGreeting = (name: string, description: string): string => {
    let html = `<p>Halo Kak! Sedang melihat <strong>${escapeHtml(name)}</strong> ya?</p>`;
    if (description) {
        html += `<p style="font-size: 13px; color: var(--text-light); margin-top: 4px;"><em>${escapeHtml(description)}</em></p>`;
    }
    return `${html}<p style="margin-top: 4px;">Ada yang ingin ditanyakan tentang produk ini?</p>`;
};

export const initGreeting = (save = true): void => {
    const { currentProduct } = getConfig();
    if (currentProduct) {
        appendMessage(buildProductGreeting(currentProduct.name, currentProduct.desc), 'bot', save, true);
        writeStorage(LAST_SEEN_PRODUCT_KEY, String(currentProduct.id));
        return;
    }
    appendWelcomeScreen(save);
};
