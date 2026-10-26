import { toChatResponse } from '../../guards/chat-response.guard';
import { extractRecommendation } from '../../utils/recommend-tag';
import { appendProductCard } from '../../ui/cards/product-card';
import { appendWhatsAppCard } from '../../ui/cards/link-cards';
import { getElements } from '../../ui/elements';
import { CHAT_BLOCKED_PLACEHOLDER } from '../../ui/labels';
import { appendMessage } from '../../ui/messages/append-message';
import { EVENT_SHOW_INITIAL_QUICK_REPLIES, emitSignal } from '../../core/event-bus';
import { renderOrders, renderRecommendedProducts } from './render-attachments';

const lockChatInput = (): void => {
    const { inputField, sendBtn } = getElements();
    inputField.disabled = true;
    inputField.placeholder = CHAT_BLOCKED_PLACEHOLDER;
    sendBtn.disabled = true;
};

export const handleJsonReply = async (response: Response): Promise<void> => {
    const data = toChatResponse(await response.json());

    if (data.text) {
        const { cleanText, productIds } = extractRecommendation(data.text);
        appendMessage(cleanText, 'bot');
        renderRecommendedProducts(data.products, productIds);
    } else {
        data.products.forEach((product) => appendProductCard(product));
    }

    renderOrders(data.orders);
    if (data.fallback && data.waLink) appendWhatsAppCard(data.waLink);

    if (data.blocked) {
        lockChatInput();
        return;
    }
    emitSignal(EVENT_SHOW_INITIAL_QUICK_REPLIES);
};
