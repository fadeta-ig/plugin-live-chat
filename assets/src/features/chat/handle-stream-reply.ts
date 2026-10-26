import { readEventStream } from '../../api/stream-reader';
import { appendToChat, scrollToBottom } from '../../ui/message-list';
import { incrementUnread } from '../../ui/unread';
import { createStreamSession } from './stream-session';

export const handleStreamReply = async (response: Response): Promise<void> => {
    const bubble = document.createElement('div');
    bubble.className = 'ai-woo-sa-msg bot';
    const paragraph = document.createElement('p');
    bubble.appendChild(paragraph);
    appendToChat(bubble);
    scrollToBottom();
    incrementUnread();

    const session = createStreamSession(paragraph);
    await readEventStream(response, session.handleEvent);
    session.finalize();
};
