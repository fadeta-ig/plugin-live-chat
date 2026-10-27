import { getElements } from './elements';

let dismissActiveDialog: (() => void) | null = null;

/** Keeps keyboard focus in the decision and returns it to the triggering control. */
export const showConfirm = (message: string, onConfirm: () => void): void => {
    dismissActiveDialog?.();
    const { confirmOverlay, confirmText, confirmOk, confirmCancel, chatWindow } = getElements();
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const background = [...chatWindow.children].filter((element) => element !== confirmOverlay);
    const wasInert = background.map((element) => element.hasAttribute('inert'));
    background.forEach((element) => element.setAttribute('inert', ''));
    confirmText.textContent = message;
    confirmOverlay.removeAttribute('inert');
    confirmOverlay.setAttribute('aria-hidden', 'false');
    confirmOverlay.classList.add('show');

    const cleanup = (): void => {
        confirmOverlay.classList.remove('show');
        confirmOverlay.setAttribute('inert', '');
        confirmOverlay.setAttribute('aria-hidden', 'true');
        background.forEach((element, index) => element.toggleAttribute('inert', wasInert[index]));
        confirmOk.removeEventListener('click', handleOk);
        confirmCancel.removeEventListener('click', cleanup);
        confirmOverlay.removeEventListener('click', handleBackdrop);
        confirmOverlay.removeEventListener('keydown', handleKey);
        document.removeEventListener('focusin', containFocus);
        dismissActiveDialog = null;
        previousFocus?.focus({ preventScroll: true });
    };
    const handleOk = (): void => {
        cleanup();
        onConfirm();
    };
    const handleBackdrop = (event: MouseEvent): void => {
        if (event.target === confirmOverlay) cleanup();
    };
    const containFocus = (event: FocusEvent): void => {
        if (!confirmOverlay.contains(event.target as Node)) confirmCancel.focus({ preventScroll: true });
    };
    const handleKey = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cleanup();
        } else if (event.key === 'Tab') {
            event.preventDefault();
            (document.activeElement === confirmCancel ? confirmOk : confirmCancel).focus();
        }
    };

    dismissActiveDialog = cleanup;
    confirmOk.addEventListener('click', handleOk);
    confirmCancel.addEventListener('click', cleanup);
    confirmOverlay.addEventListener('click', handleBackdrop);
    confirmOverlay.addEventListener('keydown', handleKey);
    document.addEventListener('focusin', containFocus);
    confirmCancel.focus({ preventScroll: true });
};
