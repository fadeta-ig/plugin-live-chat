import { requestChat } from '../../api/chat.client';
import { getIsWaiting, setIsWaiting } from '../../core/chat-state';
import { SEND_COOLDOWN_MS } from '../../core/constants';
import {
    EVENT_REMOVE_QUICK_REPLIES,
    EVENT_SHOW_INITIAL_QUICK_REPLIES,
    emitSignal,
} from '../../core/event-bus';
import { getElements } from '../../ui/elements';
import { CONNECTION_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from '../../ui/labels';
import { appendMessage } from '../../ui/messages/append-message';
import { removeTyping, showTyping, showTypingDelayed } from '../../ui/typing-indicator';
import { appendErrorCard } from '../../ui/cards/error-card';
import { handleJsonReply } from './handle-json-reply';
import { handleStreamReply } from './handle-stream-reply';

const deliverReply = async (response: Response, retryQuery?: string): Promise<void> => {
    if (!response.ok) {
        console.error('AI Chat Error:', response.status, response.statusText);
        appendErrorCard(SERVER_ERROR_MESSAGE, retryQuery ? () => void sendMessage(retryQuery) : undefined);
        emitSignal(EVENT_SHOW_INITIAL_QUICK_REPLIES);
        return;
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/event-stream')) {
        await handleStreamReply(response);
        emitSignal(EVENT_SHOW_INITIAL_QUICK_REPLIES);
        return;
    }
    await handleJsonReply(response);
};

const releaseAfterCooldown = (): void => {
    window.setTimeout(() => {
        const { sendBtn, inputField } = getElements();
        setIsWaiting(false);
        sendBtn.disabled = false;
        inputField.focus();
    }, SEND_COOLDOWN_MS);
};

/**
 * Sends a message to the assistant.
 * @param directQuery text to send instead of the input value (quick replies, hidden prompts)
 * @param isHiddenPrompt when true the typing indicator is delayed and no user bubble is shown
 */
export const sendMessage = async (
    directQuery: string | null = null,
    isHiddenPrompt = false,
): Promise<void> => {
    const { inputField, sendBtn } = getElements();
    const text = directQuery || inputField.value.trim();
    if (!text || getIsWaiting()) return;

    emitSignal(EVENT_REMOVE_QUICK_REPLIES);
    if (!directQuery && !isHiddenPrompt) appendMessage(text, 'user');

    inputField.value = '';
    setIsWaiting(true);
    sendBtn.disabled = true;
    if (isHiddenPrompt) showTypingDelayed();
    else showTyping();

    try {
        const response = await requestChat(text);
        removeTyping();
        await deliverReply(response, text);
    } catch (error) {
        removeTyping();
        appendErrorCard(CONNECTION_ERROR_MESSAGE, () => void sendMessage(text, isHiddenPrompt));
        console.error('AI Sales Assistant Error:', error);
        emitSignal(EVENT_SHOW_INITIAL_QUICK_REPLIES);
    } finally {
        releaseAfterCooldown();
    }
};
