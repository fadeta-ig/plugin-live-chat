import { getConfig } from '../../core/config.store';
import { buildWhatsAppUrl } from '../../utils/phone';
import { CS_PREFILLED_MESSAGE, MISSING_CS_NUMBER_MESSAGE } from '../../ui/labels';
import { appendMessage } from '../../ui/messages/append-message';
import { appendToChat } from '../../ui/message-list';
import { sendMessage } from '../chat/send-message';
import { QUICK_REPLY_MENUS } from './quick-reply.data';
import type { QuickReplyButton, QuickReplyMenuId } from './quick-reply.types';

const CONTAINER_ID = 'ai-woo-sa-qr';

export const removeQuickReplies = (): void => {
    document.getElementById(CONTAINER_ID)?.remove();
};

const openWhatsApp = (): void => {
    const { waNumber } = getConfig();
    if (waNumber) {
        window.open(buildWhatsAppUrl(waNumber, CS_PREFILLED_MESSAGE), '_blank');
        return;
    }
    appendMessage(MISSING_CS_NUMBER_MESSAGE, 'bot');
    renderQuickReplies('initial');
};

const handleQuickReply = (button: QuickReplyButton): void => {
    removeQuickReplies();

    switch (button.type) {
        case 'static':
            appendMessage(button.label, 'user');
            appendMessage(button.response, 'bot');
            renderQuickReplies('initial');
            return;
        case 'query':
            appendMessage(button.label, 'user');
            void sendMessage(button.query);
            return;
        case 'submenu':
            renderQuickReplies(button.target);
            return;
        case 'action':
            openWhatsApp();
            return;
    }
};

export const renderQuickReplies = (menuId: QuickReplyMenuId): void => {
    removeQuickReplies();

    const container = document.createElement('div');
    container.className = 'ai-woo-sa-quick-replies';
    container.id = CONTAINER_ID;

    QUICK_REPLY_MENUS[menuId].forEach((button) => {
        const element = document.createElement('button');
        element.className = 'ai-woo-sa-qr-btn';
        element.textContent = button.label;
        element.addEventListener('click', () => handleQuickReply(button));
        container.appendChild(element);
    });

    appendToChat(container);
};
