import { getElements } from './elements';

/** Shows the confirm overlay; `onConfirm` runs only when the user accepts. */
export const showConfirm = (message: string, onConfirm: () => void): void => {
    const { confirmOverlay, confirmText, confirmOk, confirmCancel } = getElements();
    confirmText.textContent = message;
    confirmOverlay.classList.add('show');

    const cleanup = (): void => {
        confirmOverlay.classList.remove('show');
        confirmOk.removeEventListener('click', handleOk);
        confirmCancel.removeEventListener('click', cleanup);
    };
    const handleOk = (): void => {
        cleanup();
        onConfirm();
    };

    confirmOk.addEventListener('click', handleOk);
    confirmCancel.addEventListener('click', cleanup);
};
