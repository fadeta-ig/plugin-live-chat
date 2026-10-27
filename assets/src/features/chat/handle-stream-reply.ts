import { readEventStream } from '../../api/stream-reader';
import { appendToChat, scrollToBottom } from '../../ui/message-list';
import { incrementUnread } from '../../ui/unread';
import { createStreamSession } from './stream-session';
import { formatClock } from '../../utils/format';

export const handleStreamReply = async (response: Response): Promise<void> => {
    const bubble = document.createElement('div');
    bubble.className = 'ai-woo-sa-msg bot';
    const content = document.createElement('div');
    content.className = 'ai-woo-sa-message-content';
    bubble.appendChild(content);
    appendToChat(bubble);
    scrollToBottom();
    incrementUnread();

    const session = createStreamSession(content);
    await readEventStream(response, session.handleEvent);
    session.finalize();
    const time = document.createElement('span');
    time.className = 'ai-woo-sa-time';
    time.textContent = formatClock(new Date());
    bubble.appendChild(time);
    scrollToBottom();
};
