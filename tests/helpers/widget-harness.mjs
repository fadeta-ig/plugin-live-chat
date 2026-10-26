import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const bundlePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../assets/dist/widget.js',
);
const bundleSource = readFileSync(bundlePath, 'utf8');

const DEFAULT_CONFIG = {
    restUrl: 'https://shop.test/wp-json/ai-assistant/v1/chat',
    nonce: 'test-nonce',
    botName: 'Shinyoung Assistant',
    wcAjaxUrl: 'https://shop.test/?wc-ajax=add_to_cart',
    waNumber: '0812-3456-7890',
    currentProduct: null,
    cartItems: [],
};

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitFor = async (predicate, timeoutMs = 3000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        if (predicate()) return;
        await wait(20);
    }
    throw new Error('waitFor: condition not met in time');
};

/**
 * Boots the built widget bundle inside jsdom.
 * `fetchHandler(url, init)` receives every network call and must return a Response.
 */
export const bootWidget = async ({ fetchHandler, config = {}, storage = {} }) => {
    const dom = new JSDOM('<!DOCTYPE html><body><div id="ai-woo-sa-widget-root"></div></body>', {
        url: 'https://shop.test/',
        runScripts: 'outside-only',
        pretendToBeVisual: true,
    });
    const { window } = dom;
    const requests = [];

    Object.entries(storage).forEach(([key, value]) => window.localStorage.setItem(key, value));
    window.aiWooSaConfig = { ...DEFAULT_CONFIG, ...config };
    window.TextDecoder = TextDecoder;
    window.fetch = async (url, init) => {
        requests.push({ url: String(url), body: init?.body });
        return fetchHandler(String(url), init);
    };
    window.eval(bundleSource);
    await waitFor(() => window.document.getElementById('ai-woo-sa-body'));

    const $ = (selector) => window.document.querySelector(selector);
    const $$ = (selector) => [...window.document.querySelectorAll(selector)];
    const chatRequests = () => requests.filter((r) => r.url.includes('/chat'));

    const settleThenClose = async () => {
        await waitFor(() => !window.document.getElementById('ai-woo-sa-send-btn')?.disabled, 5000).catch(
            () => undefined,
        );
        await wait(50);
        window.close();
    };

    return { window, $, $$, requests, chatRequests, close: () => void settleThenClose() };
};

export const sendText = (widget, text) => {
    const input = widget.$('#ai-woo-sa-input');
    input.value = text;
    input.dispatchEvent(
        new widget.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
};

export const clickQuickReply = (widget, label) => {
    const button = widget.$$('.ai-woo-sa-qr-btn').find((el) => el.textContent.includes(label));
    if (!button) throw new Error(`Quick reply not found: ${label}`);
    button.click();
};
