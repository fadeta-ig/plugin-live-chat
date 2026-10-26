import { DELAYED_TYPING_MS } from '../core/constants';
import { appendToChat, scrollToBottom } from './message-list';

const PHASE_ONE_AT_S = 3;
const PHASE_TWO_AT_S = 6;
const TICK_MS = 1000;

const buildTypingHtml = (label: string): string => `
    <div class="ai-woo-sa-typing-text" style="font-size: 12px; margin-bottom: 4px; color: var(--text-light);">${label}</div>
    <div class="ai-woo-sa-typing">
        <div class="ai-woo-sa-dot"></div>
        <div class="ai-woo-sa-dot"></div>
        <div class="ai-woo-sa-dot"></div>
    </div>`;

let typingElement: HTMLDivElement | null = null;
let tickTimer: number | null = null;
let delayTimer: number | null = null;

const labelForElapsed = (elapsedSeconds: number): string | null => {
    if (elapsedSeconds === PHASE_ONE_AT_S) return '🔍 Mencari produk terkait...';
    if (elapsedSeconds === PHASE_TWO_AT_S) return '💬 Merangkai jawaban...';
    return null;
};

export const showTyping = (): void => {
    if (typingElement) return;
    const element = document.createElement('div');
    element.className = 'ai-woo-sa-msg bot ai-woo-sa-typing-container';
    element.id = 'ai-woo-sa-typing';
    element.innerHTML = buildTypingHtml('Sedang mengetik...');
    typingElement = element;
    appendToChat(element);

    let elapsedSeconds = 0;
    tickTimer = window.setInterval(() => {
        elapsedSeconds += 1;
        const label = labelForElapsed(elapsedSeconds);
        if (label && typingElement) typingElement.innerHTML = buildTypingHtml(label);
        scrollToBottom();
    }, TICK_MS);
};

export const showTypingDelayed = (): void => {
    delayTimer = window.setTimeout(showTyping, DELAYED_TYPING_MS);
};

export const removeTyping = (): void => {
    if (delayTimer !== null) window.clearTimeout(delayTimer);
    if (tickTimer !== null) window.clearInterval(tickTimer);
    delayTimer = null;
    tickTimer = null;
    typingElement?.remove();
    typingElement = null;
};
