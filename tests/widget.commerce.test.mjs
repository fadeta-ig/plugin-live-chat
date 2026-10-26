import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    jsonResponse,
    shampooProduct,
    shippedOrder,
    sseResponse,
    token,
} from './helpers/mock-responses.mjs';
import { bootWidget, sendText, wait, waitFor } from './helpers/widget-harness.mjs';

const COOLDOWN_WAIT_MS = 1700;

const routeByMessage = (_url, init) => {
    const { message } = JSON.parse(init.body);
    if (message.includes('CS')) return sseResponse([token('TRIGGER_HUMAN_FALLBACK')]);
    if (message.includes('pesanan')) {
        return sseResponse([{ orders: { orders: [shippedOrder] } }, token('Berikut pesanan Anda.')]);
    }
    return sseResponse([
        { products: [shampooProduct] },
        token('Ini rekomendasi. [RECOMMEND: 11]'),
    ]);
};

const cartAwareHandler = (url, init) =>
    url.includes('add_to_cart')
        ? jsonResponse({ fragments: {}, cart_hash: 'abc' })
        : routeByMessage(url, init);

describe('commerce flows', () => {
    it('adds to cart and fires the hidden cross-sell prompt with the raw title', async () => {
        const widget = await bootWidget({ fetchHandler: cartAwareHandler });
        sendText(widget, 'rekomendasi');
        await waitFor(() => widget.$('.ai-woo-sa-btn-cart'));
        await wait(COOLDOWN_WAIT_MS);

        widget.$('.ai-woo-sa-btn-cart').click();
        await waitFor(() => widget.chatRequests().length === 2);

        assert.match(widget.$('.ai-woo-sa-btn-cart').textContent, /Ditambahkan/);
        const crossSell = JSON.parse(widget.chatRequests()[1].body);
        assert.match(crossSell.message, /^\[CROSS-SELL\] "Shampoo "Anti" Ketombe"/);
        assert.deepEqual(crossSell.cart_items, [{ id: 11, name: 'Shampoo "Anti" Ketombe', qty: 1 }]);
        widget.close();
    });

    it('renders an order card with tracking', async () => {
        const widget = await bootWidget({ fetchHandler: routeByMessage });
        sendText(widget, 'cek pesanan saya');
        await waitFor(() => widget.$('.ai-woo-sa-order-card'));

        const card = widget.$('.ai-woo-sa-order-card').textContent;
        assert.match(card, /Pesanan #10482/);
        assert.match(card, /Yunso Soap x2/);
        assert.match(card, /JNE/);
        assert.match(card, /0123456789/);
        assert.ok(widget.$('.ai-woo-sa-order-status').classList.contains('status-shipped'));
        widget.close();
    });

    it('hands over to CS through a normalized WhatsApp link', async () => {
        const widget = await bootWidget({ fetchHandler: routeByMessage });
        sendText(widget, 'hubungi CS');
        await waitFor(() => widget.$('.ai-woo-sa-btn-wa'));

        assert.equal(widget.$('.ai-woo-sa-btn-wa').href, 'https://wa.me/6281234567890');
        assert.match(
            widget.$$('.ai-woo-sa-msg.bot').at(-1).textContent,
            /menyambungkan Anda dengan Customer Service/,
        );
        widget.close();
    });
});
