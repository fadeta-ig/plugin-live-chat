import { getElements } from './elements';
import { resetUnread } from './unread';

export const toggleChat = (): void => {
    const { chatWindow, fabBtn, inputField } = getElements();
    chatWindow.classList.toggle('open');
    fabBtn.classList.toggle('open');

    if (!chatWindow.classList.contains('open')) return;
    inputField.focus();
    resetUnread();
};
