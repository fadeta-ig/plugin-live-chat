import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { jsonResponse, shampooProduct, sseResponse, token } from './helpers/mock-responses.mjs';
import { bootWidget, clickQuickReply, sendText, wait, waitFor } from './helpers/widget-harness.mjs';

const recommendationStream = () =>
    sseResponse([
        { products: [shampooProduct] },
        token('Halo! Saya rekomendasikan *Shampoo* ini.\n'),
        token('Cocok untuk ketombe. [RECOM'),
        token('MEND: 11]'),
    ]);

describe('boot and navigation', () => {
    it('mounts header, greeting and six quick replies', async () => {
        const widget = await bootWidget({ fetchHandler: () => jsonResponse({}) });
        assert.equal(widget.$('.ai-woo-sa-header h3').textContent, 'Shinyoung Assistant');
        assert.match(widget.$('.ai-woo-sa-welcome-title').textContent, /Selamat datang/);
        assert.equal(widget.$$('.ai-woo-sa-starter-row').length, 4);
        assert.equal(widget.$$('.ai-woo-sa-qr-btn').length, 6);
        widget.close();
    });

    it('navigates submenus and static replies', async () => {
        const widget = await bootWidget({ fetchHandler: () => jsonResponse({}) });
        clickQuickReply(widget, 'Produk Kami');
        assert.equal(widget.$$('.ai-woo-sa-qr-btn').length, 4);
        clickQuickReply(widget, 'Kembali');
        assert.equal(widget.$$('.ai-woo-sa-qr-btn').length, 6);

        clickQuickReply(widget, 'Info Toko');
        assert.match(widget.$$('.ai-woo-sa-msg.bot').at(-1).textContent, /Sleman, Yogyakarta/);
        assert.equal(widget.$$('.ai-woo-sa-qr-btn').length, 6);
        widget.close();
    });

    it('does not send an empty or whitespace message', async () => {
        const widget = await bootWidget({ fetchHandler: () => jsonResponse({}) });
        sendText(widget, '   ');
        await wait(50);
        assert.equal(widget.chatRequests().length, 0);
        widget.close();
    });
});

describe('streaming reply', () => {
    it('streams text, hides the recommend tag and renders the product card', async () => {
        const widget = await bootWidget({ fetchHandler: recommendationStream });
        sendText(widget, 'rekomendasi shampoo');
        await waitFor(() => widget.$('.ai-woo-sa-product-card'));

        const request = JSON.parse(widget.chatRequests()[0].body);
        assert.equal(request.message, 'rekomendasi shampoo');
        assert.equal(request.stream, true);
        assert.match(request.session_id, /^sess_[a-f0-9]{32}$/);

        const reply = widget.$$('.ai-woo-sa-msg.bot').at(-1).textContent;
        assert.match(reply, /Halo! Saya rekomendasikan Shampoo ini\./);
        assert.doesNotMatch(reply, /RECOMMEND/);
        assert.equal(
            widget.$('.ai-woo-sa-product-title').textContent,
            'Shampoo "Anti" Ketombe',
        );
        assert.equal(widget.$('.ai-woo-sa-product-price').textContent, 'Rp 89.000');
        widget.close();
    });

    it('escapes HTML in bot text', async () => {
        const widget = await bootWidget({
            fetchHandler: () => sseResponse([token('<img src=x onerror=alert(1)> aman')]),
        });
        sendText(widget, 'tes');
        await waitFor(() => widget.$$('.ai-woo-sa-msg.bot').length >= 2);
        await wait(100);
        assert.equal(widget.$('.ai-woo-sa-body img'), null);
        widget.close();
    });

    it('falls back to a non-streaming request when SSE fails', async () => {
        const widget = await bootWidget({
            fetchHandler: (_url, init) =>
                JSON.parse(init.body).stream
                    ? jsonResponse({}, 500)
                    : jsonResponse({ text: 'Jawaban biasa' }),
        });
        sendText(widget, 'halo');
        await waitFor(() => widget.$$('.ai-woo-sa-msg.bot').some((el) => /Jawaban biasa/.test(el.textContent)));
        assert.equal(widget.chatRequests().length, 2);
        widget.close();
    });

    it('locks the input when the server blocks the session', async () => {
        const widget = await bootWidget({ fetchHandler: () => jsonResponse({ text: 'Diblokir', blocked: true }) });
        sendText(widget, 'halo');
        await waitFor(() => widget.$('#ai-woo-sa-input').disabled);
        assert.equal(widget.$('#ai-woo-sa-input').placeholder, 'Akses obrolan dinonaktifkan.');
        widget.close();
    });
});
