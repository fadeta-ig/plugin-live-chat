import type { HistoryItem } from '../../types/chat.types';
import { CONTEXT_NUDGE_DELAY_MS } from '../../core/constants';
import { loadHistory } from '../../core/history.service';
import { appendTrackingRedirectCard, appendWhatsAppCard } from '../../ui/cards/link-cards';
import { appendOrderCard } from '../../ui/cards/order-card';
import { appendProductCard } from '../../ui/cards/product-card';
import { appendMessage } from '../../ui/messages/append-message';
import { injectContextNudge } from '../../ui/messages/context-nudge';
import { initGreeting } from '../../ui/messages/greeting';

const replayItem = (item: HistoryItem): void => {
    switch (item.type) {
        case 'msg':
            appendMessage(item.text, item.sender, false, item.isRawHtml);
            return;
        case 'product':
            appendProductCard(item.data, false);
            return;
        case 'wa':
            appendWhatsAppCard(item.link, false);
            return;
        case 'order':
            appendOrderCard(item.data, false);
            return;
        case 'tracking_redirect':
            appendTrackingRedirectCard(item.url, false);
            return;
    }
};

/** Replays the stored conversation, or shows the greeting for a fresh session. */
export const restoreConversation = (): void => {
    const stored = loadHistory();
    if (!stored || stored.length === 0) {
        initGreeting(true);
        return;
    }
    stored.forEach(replayItem);
    window.setTimeout(injectContextNudge, CONTEXT_NUDGE_DELAY_MS);
};
