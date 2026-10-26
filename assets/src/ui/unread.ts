import { getElements } from './elements';
import { playNotificationSound } from './notification-sound';

let unreadCount = 0;

export const incrementUnread = (): void => {
    const { chatWindow, badge } = getElements();
    if (chatWindow.classList.contains('open')) return;

    unreadCount += 1;
    badge.textContent = String(unreadCount);
    badge.style.display = 'flex';
    playNotificationSound();
};

export const resetUnread = (): void => {
    const { badge } = getElements();
    unreadCount = 0;
    badge.style.display = 'none';
    badge.textContent = '0';
};
