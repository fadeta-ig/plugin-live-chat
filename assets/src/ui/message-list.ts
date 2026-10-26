import { getElements } from './elements';

export const appendToChat = (node: HTMLElement): void => {
    getElements().chatBody.appendChild(node);
    scrollToBottom();
};

export const scrollToBottom = (): void => {
    const { chatBody } = getElements();
    chatBody.scrollTop = chatBody.scrollHeight;
};

export const clearChat = (): void => {
    getElements().chatBody.innerHTML = '';
};
