import type { Sender } from '../../types/chat.types';
import { pushHistory, saveHistory } from '../../core/history.service';
import { formatClock } from '../../utils/format';
import { renderPlainMessage } from '../../utils/inline-markup';
import { appendToChat } from '../message-list';
import { incrementUnread } from '../unread';

export const appendMessage = (
    text: string,
    sender: Sender,
    save = true,
    isRawHtml = false,
): HTMLDivElement => {
    const isWelcome = text.includes('ai-woo-sa-welcome');
    const message = document.createElement('div');
    message.className = `ai-woo-sa-msg ${sender}${isWelcome ? ' ai-woo-sa-msg-welcome' : ''}`;

    const bodyHtml = isRawHtml ? text : `<div class="ai-woo-sa-message-content">${renderPlainMessage(text)}</div>`;
    const timeHtml = isWelcome ? '' : `<span class="ai-woo-sa-time">${formatClock(new Date())}</span>`;
    message.innerHTML = `${bodyHtml}${timeHtml}`;
    appendToChat(message);

    if (sender === 'bot' && !isWelcome) incrementUnread();
    if (save) {
        pushHistory({ type: 'msg', text, sender, isRawHtml });
        saveHistory();
    }
    return message;
};
