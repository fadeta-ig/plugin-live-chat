import assert from 'node:assert/strict';
import { it } from 'node:test';
import { bootWidget } from './helpers/widget-harness.mjs';
import { jsonResponse } from './helpers/mock-responses.mjs';

it('keeps the confirmation contained, traps focus and cancels with Escape', async () => {
    const widget = await bootWidget({ fetchHandler: () => jsonResponse({}) });
    widget.$('#ai-woo-sa-fab').click();
    const chat = widget.$('#ai-woo-sa-window');
    const reset = widget.$('#ai-woo-sa-reset-btn');
    const overlay = widget.$('#ai-woo-sa-confirm-overlay');
    const cancel = widget.$('#ai-woo-sa-confirm-cancel');
    const confirm = widget.$('#ai-woo-sa-confirm-ok');
    reset.focus();
    reset.click();
    assert.equal(overlay.parentElement, chat);
    assert.equal(widget.window.document.activeElement, cancel);
    assert.equal(widget.$('.ai-woo-sa-header').hasAttribute('inert'), true);
    cancel.dispatchEvent(new widget.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    assert.equal(widget.window.document.activeElement, confirm);
    confirm.dispatchEvent(new widget.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(overlay.classList.contains('show'), false);
    assert.equal(chat.classList.contains('open'), true);
    assert.equal(widget.window.document.activeElement, reset);
    assert.equal(widget.$('.ai-woo-sa-header').hasAttribute('inert'), false);
    assert.equal(overlay.hasAttribute('inert'), true);
    assert.equal(widget.$$('.ai-woo-sa-starter-row').length, 4);
    widget.close();
});

it('uses the same mobile breakpoint for viewport height and restores page scroll', async () => {
    const widget = await bootWidget({ fetchHandler: () => jsonResponse({}) });
    Object.defineProperty(widget.window, 'innerWidth', { value: 600, configurable: true });
    widget.window.document.body.style.overflow = 'auto';
    widget.$('#ai-woo-sa-body').scrollTop = 120;
    widget.$('#ai-woo-sa-fab').click();
    const chat = widget.$('#ai-woo-sa-window');
    assert.equal(chat.getAttribute('aria-modal'), 'true');
    assert.equal(widget.window.document.body.style.overflow, 'hidden');
    assert.equal(widget.$('#ai-woo-sa-body').scrollTop, 0);
    assert.notEqual(widget.window.document.activeElement, widget.$('#ai-woo-sa-input'));
    widget.$('#ai-woo-sa-close-btn').click();
    assert.equal(widget.window.document.body.style.overflow, 'auto');
    assert.equal(chat.hasAttribute('inert'), true);
    assert.equal(widget.$('#ai-woo-sa-fab').getAttribute('aria-expanded'), 'false');
    widget.close();
});
