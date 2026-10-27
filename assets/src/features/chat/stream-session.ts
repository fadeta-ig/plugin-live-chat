import type { ProductPayload, StreamControl, StreamEvent } from '../../types/chat.types';
import { getConfig } from '../../core/config.store';
import { HUMAN_FALLBACK_MESSAGE, HUMAN_FALLBACK_TOKENS } from '../../core/constants';
import { pushHistory, saveHistory } from '../../core/history.service';
import { applyInlineMarkup, renderPlainMessage } from '../../utils/inline-markup';
import { escapeHtml } from '../../utils/escape-html';
import { buildWhatsAppUrl } from '../../utils/phone';
import {
    extractRecommendation,
    stripPartialRecommendation,
} from '../../utils/recommend-tag';
import { appendWhatsAppCard } from '../../ui/cards/link-cards';
import { scrollToBottom } from '../../ui/message-list';
import { renderOrders, renderRecommendedProducts } from './render-attachments';

const needsHumanFallback = (text: string): boolean =>
    HUMAN_FALLBACK_TOKENS.some((token) => text.includes(token));

/** Uses the same block container and renderer for streaming and restored replies. */
export const createStreamSession = (content: HTMLDivElement) => {
    let accumulatedText = '';
    let contextProducts: ProductPayload[] = [];

    const handleMeta = (event: Extract<StreamEvent, { kind: 'meta' }>): void => {
        if (event.products.length > 0) contextProducts = event.products;
        renderOrders(event.orders);
        if (event.fallback && event.waLink) appendWhatsAppCard(event.waLink);
    };

    const handleToken = (token: string): StreamControl => {
        accumulatedText += token;

        if (needsHumanFallback(accumulatedText)) {
            accumulatedText = HUMAN_FALLBACK_MESSAGE;
            content.textContent = accumulatedText;
            scrollToBottom();
            appendWhatsAppCard(buildWhatsAppUrl(getConfig().waNumber), true);
            return 'abort';
        }

        content.innerHTML = applyInlineMarkup(
            stripPartialRecommendation(escapeHtml(accumulatedText)),
        );
        scrollToBottom();
        return 'continue';
    };

    const finalize = (): void => {
        if (!accumulatedText) return;
        const { cleanText, productIds } = extractRecommendation(accumulatedText);
        content.innerHTML = renderPlainMessage(cleanText);

        pushHistory({ type: 'msg', text: cleanText, sender: 'bot', isRawHtml: false });
        saveHistory();
        renderRecommendedProducts(contextProducts, productIds);
    };

    return {
        handleEvent: (event: StreamEvent): StreamControl => {
            if (event.kind === 'meta') {
                handleMeta(event);
                return 'continue';
            }
            return handleToken(event.content);
        },
        finalize,
    };
};
