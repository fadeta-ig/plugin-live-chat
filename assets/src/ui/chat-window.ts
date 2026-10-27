import { getElements } from './elements';
import { resetUnread } from './unread';

const MOBILE_BREAKPOINT_PX = 640;
const isMobileView = (): boolean => window.innerWidth <= MOBILE_BREAKPOINT_PX;
let previousOverflow: string | null = null;

const syncViewport = (): void => {
    const { chatWindow } = getElements();
    const isMobileOpen = isMobileView() && chatWindow.classList.contains('open');
    if (isMobileOpen) {
        if (previousOverflow === null) previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        chatWindow.setAttribute('aria-modal', 'true');
        if (window.visualViewport) {
            chatWindow.style.setProperty('--ai-woo-sa-viewport-height', window.visualViewport.height + 'px');
        }
    } else {
        if (previousOverflow !== null) document.body.style.overflow = previousOverflow;
        previousOverflow = null;
        chatWindow.removeAttribute('aria-modal');
        chatWindow.style.removeProperty('--ai-woo-sa-viewport-height');
    }
};

export const initViewportTracking = (): void => {
    window.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('resize', syncViewport);
};

export const closeChat = (): void => {
    const { chatWindow, fabBtn } = getElements();
    if (!chatWindow.classList.contains('open')) return;
    chatWindow.classList.remove('open');
    fabBtn.classList.remove('open');
    fabBtn.setAttribute('aria-expanded', 'false');
    fabBtn.focus({ preventScroll: true });
    chatWindow.setAttribute('inert', '');
    chatWindow.setAttribute('aria-hidden', 'true');
    syncViewport();
};

export const openChat = (): void => {
    const { chatWindow, fabBtn } = getElements();
    chatWindow.removeAttribute('inert');
    chatWindow.setAttribute('aria-hidden', 'false');
    chatWindow.classList.add('open');
    fabBtn.classList.add('open');
    fabBtn.setAttribute('aria-expanded', 'true');
    syncViewport();
    // Let visitors see the available help before opening the mobile keyboard.
    chatWindow.focus({ preventScroll: true });
    resetUnread();
};

export const toggleChat = (): void => {
    const { chatWindow } = getElements();
    if (chatWindow.classList.contains('open')) closeChat();
    else openChat();
};
