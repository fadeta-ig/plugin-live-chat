export interface Elements {
    chatBody: HTMLDivElement;
    inputField: HTMLInputElement;
    sendBtn: HTMLButtonElement;
    fabBtn: HTMLButtonElement;
    badge: HTMLElement;
    closeBtn: HTMLButtonElement;
    resetBtn: HTMLButtonElement;
    chatWindow: HTMLElement;
    confirmOverlay: HTMLElement;
    confirmText: HTMLElement;
    confirmCancel: HTMLButtonElement;
    confirmOk: HTMLButtonElement;
}

let boundElements: Elements | null = null;

const requireElement = <T extends HTMLElement>(id: string, expected: new () => T): T => {
    const element = document.getElementById(id);
    if (!(element instanceof expected)) {
        throw new Error(`AI Sales Assistant: element #${id} is missing or has an unexpected type.`);
    }
    return element;
};

export const bindElements = (): Elements => {
    boundElements = {
        chatBody: requireElement('ai-woo-sa-body', HTMLDivElement),
        inputField: requireElement('ai-woo-sa-input', HTMLInputElement),
        sendBtn: requireElement('ai-woo-sa-send-btn', HTMLButtonElement),
        fabBtn: requireElement('ai-woo-sa-fab', HTMLButtonElement),
        badge: requireElement('ai-woo-sa-badge', HTMLElement),
        closeBtn: requireElement('ai-woo-sa-close-btn', HTMLButtonElement),
        resetBtn: requireElement('ai-woo-sa-reset-btn', HTMLButtonElement),
        chatWindow: requireElement('ai-woo-sa-window', HTMLElement),
        confirmOverlay: requireElement('ai-woo-sa-confirm-overlay', HTMLElement),
        confirmText: requireElement('ai-woo-sa-confirm-text', HTMLElement),
        confirmCancel: requireElement('ai-woo-sa-confirm-cancel', HTMLButtonElement),
        confirmOk: requireElement('ai-woo-sa-confirm-ok', HTMLButtonElement),
    };
    return boundElements;
};

export const getElements = (): Elements => {
    if (!boundElements) throw new Error('AI Sales Assistant: UI accessed before mount.');
    return boundElements;
};
