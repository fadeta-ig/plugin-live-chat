import { pushHistory, saveHistory } from '../../core/history.service';
import { escapeHtml } from '../../utils/escape-html';
import { isWhatsAppLink, toSafeLink } from '../../utils/safe-url';
import { ICON_CHAT, ICON_PACKAGE } from '../icons/icons';
import { appendToChat } from '../message-list';

const buildLinkCard = (linkHtml: string): HTMLDivElement => {
    const card = document.createElement('div');
    card.className = 'ai-woo-sa-product-card';
    card.innerHTML = linkHtml;
    return card;
};

export const appendWhatsAppCard = (waLink: string, save = true): void => {
    if (!waLink || !isWhatsAppLink(waLink)) return;
    appendToChat(
        buildLinkCard(
            `<a href="${escapeHtml(waLink)}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-wa">
                ${ICON_CHAT}<span>Lanjutkan bersama CS di WhatsApp</span>
            </a>`,
        ),
    );
    if (!save) return;
    pushHistory({ type: 'wa', link: waLink });
    saveHistory();
};

export const appendTrackingRedirectCard = (url: string, save = true): void => {
    appendToChat(
        buildLinkCard(
            `<a href="${escapeHtml(toSafeLink(url))}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-tracking">
                ${ICON_PACKAGE}<span>Lacak Pesanan di Website</span>
            </a>`,
        ),
    );
    if (!save) return;
    pushHistory({ type: 'tracking_redirect', url });
    saveHistory();
};
