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
    const message = document.createElement('div');
    message.className = `ai-woo-sa-msg ${sender}`;

    const bodyHtml = isRawHtml ? text : `<p>${renderPlainMessage(text)}</p>`;
    message.innerHTML = `${bodyHtml}<span class="ai-woo-sa-time">${formatClock(new Date())}</span>`;
    appendToChat(message);

    if (sender === 'bot') incrementUnread();
    if (save) {
        pushHistory({ type: 'msg', text, sender, isRawHtml });
        saveHistory();
    }
    return message;
};
