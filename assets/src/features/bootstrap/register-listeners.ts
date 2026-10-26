import {
    EVENT_REMOVE_QUICK_REPLIES,
    EVENT_SHOW_INITIAL_QUICK_REPLIES,
    onAddToCart,
    onSignal,
} from '../../core/event-bus';
import { resetConversation } from '../../core/conversation.service';
import { closeChat, initViewportTracking, toggleChat } from '../../ui/chat-window';
import { showConfirm } from '../../ui/confirm-dialog';
import { getElements } from '../../ui/elements';
import { clearChat, initScrollTracking } from '../../ui/message-list';
import { initGreeting } from '../../ui/messages/greeting';
import { bindWelcomeEvents } from '../../ui/welcome/welcome-screen';
import { addToCart } from '../cart/add-to-cart';
import { sendMessage } from '../chat/send-message';
import { removeQuickReplies, renderQuickReplies } from '../quick-replies/quick-reply.controller';

const RESET_CONFIRM_MESSAGE = 'Mulai obrolan baru dan hapus riwayat?';

const startNewConversation = (): void => {
    resetConversation();
    clearChat();
    initGreeting(true);
    renderQuickReplies('initial');
};

const isPlainEnter = (event: KeyboardEvent): boolean =>
    event.key === 'Enter' && !event.shiftKey && !event.isComposing;

export const registerEventListeners = (): void => {
    const { fabBtn, closeBtn, resetBtn, sendBtn, inputField, chatBody } = getElements();

    fabBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', closeChat);
    resetBtn.addEventListener('click', () => showConfirm(RESET_CONFIRM_MESSAGE, startNewConversation));
    sendBtn.addEventListener('click', () => void sendMessage());
    inputField.addEventListener('keydown', (event) => {
        if (!isPlainEnter(event)) return;
        event.preventDefault();
        void sendMessage();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeChat();
    });

    bindWelcomeEvents(chatBody);
    initScrollTracking();
    initViewportTracking();

    onSignal(EVENT_REMOVE_QUICK_REPLIES, removeQuickReplies);
    onSignal(EVENT_SHOW_INITIAL_QUICK_REPLIES, () => renderQuickReplies('initial'));
    onAddToCart(({ productId, button, productTitle }) => {
        void addToCart(productId, button, productTitle);
    });
};
