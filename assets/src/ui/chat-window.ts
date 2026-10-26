import { getElements } from './elements';
import { resetUnread } from './unread';

const MOBILE_BREAKPOINT_PX = 480;

const isMobileView = (): boolean => window.innerWidth <= MOBILE_BREAKPOINT_PX;

const handleViewportResize = (): void => {
    if (!window.visualViewport || !isMobileView()) return;
    const { chatWindow } = getElements();
    if (chatWindow.classList.contains('open')) {
        chatWindow.style.height = `${window.visualViewport.height}px`;
    }
};

export const initViewportTracking = (): void => {
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
    }
};

export const closeChat = (): void => {
    const { chatWindow, fabBtn } = getElements();
    if (!chatWindow.classList.contains('open')) return;
    chatWindow.classList.remove('open');
    fabBtn.classList.remove('open');
    document.body.style.overflow = '';
    chatWindow.removeAttribute('aria-modal');
    if (isMobileView()) chatWindow.style.height = '';
    fabBtn.focus();
};

export const openChat = (): void => {
    const { chatWindow, fabBtn, inputField } = getElements();
    chatWindow.classList.add('open');
    fabBtn.classList.add('open');
    if (isMobileView()) {
        document.body.style.overflow = 'hidden';
        chatWindow.setAttribute('aria-modal', 'true');
        if (window.visualViewport) {
            chatWindow.style.height = `${window.visualViewport.height}px`;
        }
    }
    inputField.focus();
    resetUnread();
};

export const toggleChat = (): void => {
    const { chatWindow } = getElements();
    if (chatWindow.classList.contains('open')) {
        closeChat();
    } else {
        openChat();
    }
};
