import assert from 'node:assert/strict';
import { it } from 'node:test';
import { bootWidget, sendText, waitFor } from './helpers/widget-harness.mjs';
import { jsonResponse, sseResponse, token } from './helpers/mock-responses.mjs';

const reply = 'Perawatan **rambut**.\r\n\r\n- Triple Ferment menutrisi akar.\r\n\r\n* Pro-Vitamin B5 menjaga kelembapan.\r\n  Termasuk helai yang kering.\r\n\r\n• Panthenol pada serum.\r\n\r\nLangkah pemakaian:\r\n1. Gunakan shampoo.\r\n2. Lanjutkan serum.\r\n\r\nBaca [produk](https://example.com/produk) atau tanyakan kembali. <img src=x onerror=alert(1)>';

const checkBlocks = (widget) => {
    const content = widget.$('.ai-woo-sa-msg.bot .ai-woo-sa-message-content');
    assert.deepEqual([...content.children].map((el) => el.tagName), ['P', 'UL', 'P', 'OL', 'P']);
    const list = content.querySelector('ul');
    assert.equal(list.children.length, 3);
    assert.ok([...list.children].every((el) => el.tagName === 'LI'));
    assert.equal(list.querySelector('br'), null);
    assert.match(list.children[1].textContent, /kelembapan\. Termasuk helai/);
    assert.equal(content.querySelectorAll('ol > li').length, 2);
    assert.equal(content.querySelector('p ul, p ol, img'), null);
    assert.equal(content.querySelector('strong').textContent, 'rambut');
    assert.equal(content.querySelector('a').getAttribute('rel'), 'noopener noreferrer');
    assert.match(content.textContent, /<img src=x onerror=alert\(1\)>/);
};

it('renders spaced bullets, ordered steps and paragraphs consistently for JSON and reload', async () => {
    const widget = await bootWidget({ fetchHandler: () => jsonResponse({ text: reply }) });
    sendText(widget, 'perawatan rambut');
    await waitFor(() => widget.$('.ai-woo-sa-message-content ul'));
    checkBlocks(widget);
    const storage = Object.fromEntries(['ai_woo_sa_session_id', 'ai_woo_sa_history'].map((key) => [key, widget.window.localStorage.getItem(key)]));
    widget.close();
    const restored = await bootWidget({ fetchHandler: () => jsonResponse({}), storage });
    checkBlocks(restored);
    restored.close();
});

it('uses the same valid blocks and timestamp for a reply split across streaming tokens', async () => {
    const widget = await bootWidget({ fetchHandler: () => sseResponse([
        token(reply.slice(0, 36)), token(reply.slice(36, 110)), token(reply.slice(110)),
    ]) });
    sendText(widget, 'perawatan rambut');
    await waitFor(() => widget.$('.ai-woo-sa-msg.bot .ai-woo-sa-time'));
    checkBlocks(widget);
    widget.close();
});
