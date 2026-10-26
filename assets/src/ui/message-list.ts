import { getElements } from './elements';

const SCROLL_THRESHOLD_PX = 80;

export const isScrolledUp = (): boolean => {
    const { chatBody } = getElements();
    return chatBody.scrollHeight - chatBody.scrollTop - chatBody.clientHeight > SCROLL_THRESHOLD_PX;
};

export const updateJumpButton = (): void => {
    const { jumpBtn } = getElements();
    jumpBtn.style.display = isScrolledUp() ? 'inline-flex' : 'none';
};

export const scrollToBottom = (force = true): void => {
    const { chatBody } = getElements();
    if (force || !isScrolledUp()) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    updateJumpButton();
};

export const appendToChat = (node: HTMLElement, forceScroll = true): void => {
    const { chatBody } = getElements();
    const wasNearBottom = !isScrolledUp();
    chatBody.appendChild(node);
    if (forceScroll || wasNearBottom) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    updateJumpButton();
};

export const clearChat = (): void => {
    const { chatBody, jumpBtn } = getElements();
    chatBody.innerHTML = '';
    jumpBtn.style.display = 'none';
};

export const initScrollTracking = (): void => {
    const { chatBody, jumpBtn } = getElements();
    chatBody.addEventListener('scroll', updateJumpButton);
    jumpBtn.addEventListener('click', () => {
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
        jumpBtn.style.display = 'none';
    });
};
