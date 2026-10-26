import type { OrderPayload } from '../../types/chat.types';
import { pushHistory, saveHistory } from '../../core/history.service';
import { escapeHtml } from '../../utils/escape-html';
import { ICON_CHECK, ICON_COPY } from '../icons/icons';
import { appendToChat } from '../message-list';
import { buildTimelineHtml } from './order-timeline';

const STATUS_CLASS_BY_RAW: Readonly<Record<string, string>> = {
    completed: 'status-completed',
    processing: 'status-processing',
    'on-hold': 'status-on-hold',
    pending: 'status-pending',
    cancelled: 'status-cancelled',
    refunded: 'status-refunded',
    shipped: 'status-shipped',
};
const DEFAULT_STATUS_CLASS = 'status-default';
const NO_TRACKING_NUMBER = '-';
const COPIED_FEEDBACK_MS = 2000;

const buildItemsHtml = (order: OrderPayload): string =>
    order.items
        .map(
            (item) => `
                <div class="ai-woo-sa-order-item">
                    <span class="ai-woo-sa-item-name">${escapeHtml(item.name)} x${escapeHtml(item.qty)}</span>
                    <span class="ai-woo-sa-item-dots" aria-hidden="true"></span>
                    <span class="ai-woo-sa-order-item-price">Rp ${escapeHtml(item.total)}</span>
                </div>`,
        )
        .join('');

const buildTrackingHtml = (order: OrderPayload): string => {
    const { tracking } = order;
    if (!tracking || !tracking.tracking_number || tracking.tracking_number === NO_TRACKING_NUMBER) {
        return '';
    }
    const safeCourier = escapeHtml(tracking.courier);
    const safeNumber = escapeHtml(tracking.tracking_number);
    return `
        <div class="ai-woo-sa-order-tracking">
            <div class="ai-woo-sa-tracking-info">
                <span class="ai-woo-sa-tracking-label">${safeCourier}</span>
                <span class="ai-woo-sa-tracking-number">${safeNumber}</span>
            </div>
            <button class="ai-woo-sa-btn-copy" data-copy="${safeNumber}" type="button" aria-label="Salin nomor resi">
                ${ICON_COPY}<span>Salin</span>
            </button>
        </div>
        <div class="ai-woo-sa-order-shipping-status">Status Kirim: ${escapeHtml(tracking.status_label)}</div>`;
};

const bindCopyButton = (card: HTMLElement): void => {
    const copyBtn = card.querySelector<HTMLButtonElement>('.ai-woo-sa-btn-copy');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', async () => {
        const textToCopy = copyBtn.getAttribute('data-copy') ?? '';
        try {
            await navigator.clipboard.writeText(textToCopy);
            copyBtn.innerHTML = `${ICON_CHECK}<span>Tersalin</span>`;
            window.setTimeout(() => {
                copyBtn.innerHTML = `${ICON_COPY}<span>Salin</span>`;
            }, COPIED_FEEDBACK_MS);
        } catch {
            // Fallback if clipboard API not available
        }
    });
};

export const appendOrderCard = (order: OrderPayload, save = true): void => {
    const card = document.createElement('div');
    card.className = 'ai-woo-sa-order-card';
    const statusClass = STATUS_CLASS_BY_RAW[order.status_raw] ?? DEFAULT_STATUS_CLASS;

    card.innerHTML = `
        <div class="ai-woo-sa-order-header">
            <span class="ai-woo-sa-order-number">Pesanan #${escapeHtml(order.order_number)}</span>
            <span class="ai-woo-sa-order-status ${statusClass}">${escapeHtml(order.status)}</span>
        </div>
        <div class="ai-woo-sa-order-date">${escapeHtml(order.date)}</div>
        ${buildTimelineHtml(order.status_raw)}
        <div class="ai-woo-sa-order-items">${buildItemsHtml(order)}</div>
        ${buildTrackingHtml(order)}
        <div class="ai-woo-sa-order-total">Total: <strong>Rp ${escapeHtml(order.total)}</strong></div>`;

    bindCopyButton(card);
    appendToChat(card);
    if (!save) return;
    pushHistory({ type: 'order', data: order });
    saveHistory();
};
