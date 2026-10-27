import { appendMessage } from '../messages/append-message';
import { renderQuickReplies } from '../../features/quick-replies/quick-reply.controller';
import { sendMessage } from '../../features/chat/send-message';
import { getConfig } from '../../core/config.store';
import { buildWhatsAppUrl } from '../../utils/phone';
import { CS_PREFILLED_MESSAGE, MISSING_CS_NUMBER_MESSAGE } from '../labels';
import { buildWelcomeHtml } from './welcome-screen.template';
import { getElements } from '../elements';

const handleStarterAction = (action: string): void => {
    switch (action) {
        case 'products':
            appendMessage('Temukan produk', 'user');
            appendMessage('Perawatan apa yang Anda cari? Pilih kategori di bawah, atau tulis kebutuhan Anda.', 'bot');
            renderQuickReplies('categories');
            return;
        case 'consultation':
            appendMessage('Konsultasi kulit dan rambut', 'user');
            void sendMessage('Saya ingin konsultasi tentang kondisi kulit saya, bisa bantu rekomendasikan produk Shinyoung yang cocok?');
            return;
        case 'track':
            appendMessage('Lacak pesanan', 'user');
            void sendMessage('Saya ingin cek status pesanan saya');
            return;
        case 'cs': {
            const { waNumber } = getConfig();
            if (waNumber) {
                window.open(buildWhatsAppUrl(waNumber, CS_PREFILLED_MESSAGE), '_blank', 'noopener,noreferrer');
            } else {
                appendMessage(MISSING_CS_NUMBER_MESSAGE, 'bot');
            }
            return;
        }
    }
};

export const bindWelcomeEvents = (container: HTMLElement): void => {
    container.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-starter]');
        if (!button) return;
        const action = button.getAttribute('data-starter');
        if (action) handleStarterAction(action);
    });
};

export const appendWelcomeScreen = (save = true): void => {
    const html = `<div class="ai-woo-sa-welcome" id="ai-woo-sa-welcome">${buildWelcomeHtml()}</div>`;
    appendMessage(html, 'bot', save, true);
    getElements().chatBody.scrollTop = 0;
};
