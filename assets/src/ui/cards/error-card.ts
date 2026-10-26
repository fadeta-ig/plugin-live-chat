import { escapeHtml } from '../../utils/escape-html';
import { ICON_REFRESH } from '../icons/icons';
import { appendToChat } from '../message-list';

export const appendErrorCard = (
    message: string,
    onRetry?: () => void,
): HTMLElement => {
    const banner = document.createElement('div');
    banner.className = 'ai-woo-sa-error-banner';
    banner.setAttribute('role', 'alert');

    const retryHtml = onRetry
        ? `<button class="ai-woo-sa-btn-retry" type="button">${ICON_REFRESH}<span>Coba lagi</span></button>`
        : '';

    banner.innerHTML = `
        <div class="ai-woo-sa-error-text">${escapeHtml(message)}</div>
        ${retryHtml}`;

    if (onRetry) {
        banner.querySelector('.ai-woo-sa-btn-retry')?.addEventListener('click', () => {
            banner.remove();
            onRetry();
        });
    }

    appendToChat(banner);
    return banner;
};
