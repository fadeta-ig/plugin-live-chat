import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shampooProduct, shippedOrder, sseResponse, token } from './helpers/mock-responses.mjs';
import { bootWidget, sendText, wait, waitFor } from './helpers/widget-harness.mjs';

const HISTORY_KEY = 'ai_woo_sa_history';
const SESSION_KEY = 'ai_woo_sa_session_id';

const fullReply = () =>
    sseResponse([
        { products: [shampooProduct], orders: { orders: [shippedOrder] } },
        token('Ini rekomendasi. [RECOMMEND: 11]'),
    ]);

const snapshotStorage = (widget) => ({
    [SESSION_KEY]: widget.window.localStorage.getItem(SESSION_KEY),
    [HISTORY_KEY]: widget.window.localStorage.getItem(HISTORY_KEY),
});

describe('history persistence', () => {
    it('restores messages, product and order cards after a reload', async () => {
        const first = await bootWidget({ fetchHandler: fullReply });
        sendText(first, 'rekomendasi');
        await waitFor(() => first.$('.ai-woo-sa-product-card') && first.$('.ai-woo-sa-order-card'));
        await wait(50);
        const storage = snapshotStorage(first);
        first.close();

        const second = await bootWidget({ fetchHandler: fullReply, storage });
        assert.equal(second.$$('.ai-woo-sa-msg.user').length, 1);
        assert.equal(second.$$('.ai-woo-sa-product-card').length, 1);
        assert.equal(second.$$('.ai-woo-sa-order-card').length, 1);
        assert.match(second.$$('.ai-woo-sa-msg.bot').at(-1).textContent, /Ini rekomendasi\./);
        second.close();
    });

    it('ignores corrupted or foreign stored history', async () => {
        const widget = await bootWidget({
            fetchHandler: fullReply,
            storage: { [HISTORY_KEY]: '{not-json' },
        });
        assert.match(widget.$('.ai-woo-sa-welcome-title').textContent, /Selamat datang/);
        widget.close();
    });

    it('drops malformed history entries without crashing', async () => {
        const first = await bootWidget({ fetchHandler: fullReply });
        const sessionId = first.window.localStorage.getItem(SESSION_KEY);
        first.close();
        const history = JSON.stringify({
            session_id: sessionId,
            timestamp: Date.now(),
            items: [{ type: 'msg', text: 'valid', sender: 'user' }, { type: 'order', data: 7 }, 'x'],
        });
        const widget = await bootWidget({
            fetchHandler: fullReply,
            storage: { [SESSION_KEY]: sessionId, [HISTORY_KEY]: history },
        });
        assert.equal(widget.$$('.ai-woo-sa-msg.user').length, 1);
        assert.equal(widget.$$('.ai-woo-sa-order-card').length, 0);
        widget.close();
    });
});

describe('reset', () => {
    it('clears the conversation, renews the session and shows a fresh greeting', async () => {
        const widget = await bootWidget({ fetchHandler: fullReply });
        const oldSession = widget.window.localStorage.getItem(SESSION_KEY);
        sendText(widget, 'rekomendasi');
        await waitFor(() => widget.$('.ai-woo-sa-product-card'));

        widget.$('#ai-woo-sa-reset-btn').click();
        assert.ok(widget.$('#ai-woo-sa-confirm-overlay').classList.contains('show'));
        widget.$('#ai-woo-sa-confirm-ok').click();

        assert.equal(widget.$$('.ai-woo-sa-msg.user').length, 0);
        assert.equal(widget.$$('.ai-woo-sa-product-card').length, 0);
        assert.notEqual(widget.window.localStorage.getItem(SESSION_KEY), oldSession);
        assert.match(widget.$('.ai-woo-sa-welcome-title').textContent, /Selamat datang/);
        widget.close();
    });
});
