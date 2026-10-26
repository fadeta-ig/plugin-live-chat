import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shampooProduct, shippedOrder, sseResponse, token } from './helpers/mock-responses.mjs';
import { bootWidget, clickQuickReply, sendText, waitFor } from './helpers/widget-harness.mjs';

const creamProduct = {
    product_id: 12,
    title: 'Binahong Cream 15g',
    price: 65000,
    permalink: 'https://example.com/binahong-cream/',
    image_url: 'https://example.com/binahong.jpg',
};

describe('botanical luxury features', () => {
    it('renders horizontal carousel when multiple products are recommended', async () => {
        const widget = await bootWidget({
            fetchHandler: () =>
                sseResponse([
                    { products: [shampooProduct, creamProduct] },
                    token('Ini dua produk terbaik kami. [RECOMMEND: 11] [RECOMMEND: 12]'),
                ]),
        });
        sendText(widget, 'rekomendasi produk');
        await waitFor(() => widget.$('.ai-woo-sa-carousel'));

        const cards = widget.$$('.ai-woo-sa-carousel .ai-woo-sa-product-card');
        assert.equal(cards.length, 2);
        assert.equal(cards[0].querySelector('.ai-woo-sa-product-title').textContent, 'Shampoo "Anti" Ketombe');
        assert.equal(cards[1].querySelector('.ai-woo-sa-product-title').textContent, 'Binahong Cream 15g');
        widget.close();
    });

    it('renders 4-step order timeline and copy button on order cards', async () => {
        const widget = await bootWidget({
            fetchHandler: () =>
                sseResponse([
                    { orders: { orders: [shippedOrder] } },
                    token('Status pesanan Anda saat ini.'),
                ]),
        });
        sendText(widget, 'status pesanan');
        await waitFor(() => widget.$('.ai-woo-sa-timeline'));

        assert.ok(widget.$('.ai-woo-sa-timeline'));
        assert.equal(widget.$$('.ai-woo-sa-timeline-step').length, 4);
        assert.ok(widget.$('.ai-woo-sa-timeline-step.active'));
        assert.ok(widget.$('.ai-woo-sa-btn-copy'));
        assert.match(widget.$('.ai-woo-sa-btn-copy').textContent, /Salin/);
        widget.close();
    });

    it('handles starter action clicks from the welcome screen', async () => {
        const widget = await bootWidget({
            fetchHandler: () => sseResponse([token('Jawaban konsultasi')]),
        });
        const starterBtn = widget.$('button[data-starter="consultation"]');
        assert.ok(starterBtn);
        starterBtn.click();

        await waitFor(() => widget.chatRequests().length === 1);
        const req = JSON.parse(widget.chatRequests()[0].body);
        assert.match(req.message, /konsultasi/i);
        widget.close();
    });

    it('closes the chat widget on Escape key press', async () => {
        const widget = await bootWidget({ fetchHandler: () => sseResponse([]) });
        widget.$('#ai-woo-sa-fab').click();
        assert.ok(widget.$('#ai-woo-sa-window').classList.contains('open'));

        const escEvent = new widget.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        widget.window.dispatchEvent(escEvent);

        assert.ok(!widget.$('#ai-woo-sa-window').classList.contains('open'));
        widget.close();
    });
});
