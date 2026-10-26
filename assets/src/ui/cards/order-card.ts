import type { OrderPayload } from '../../types/chat.types';
import { pushHistory, saveHistory } from '../../core/history.service';
import { escapeHtml } from '../../utils/escape-html';
import { appendToChat } from '../message-list';

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

const buildItemsHtml = (order: OrderPayload): string =>
    order.items
        .map(
            (item) =>
                `<div class="ai-woo-sa-order-item">• ${escapeHtml(item.name)} x${escapeHtml(item.qty)} <span class="ai-woo-sa-order-item-price">Rp ${escapeHtml(item.total)}</span></div>`,
        )
        .join('');

const buildTrackingHtml = (order: OrderPayload): string => {
    const { tracking } = order;
    if (!tracking || !tracking.tracking_number || tracking.tracking_number === NO_TRACKING_NUMBER) {
        return '';
    }
    return `
        <div class="ai-woo-sa-order-tracking">
            <span class="ai-woo-sa-tracking-label">📦 ${escapeHtml(tracking.courier)}</span>
            <span class="ai-woo-sa-tracking-number">${escapeHtml(tracking.tracking_number)}</span>
        </div>
        <div class="ai-woo-sa-order-shipping-status">Status Kirim: ${escapeHtml(tracking.status_label)}</div>`;
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
        <div class="ai-woo-sa-order-items">${buildItemsHtml(order)}</div>
        ${buildTrackingHtml(order)}
        <div class="ai-woo-sa-order-total">Total: <strong>Rp ${escapeHtml(order.total)}</strong></div>`;

    appendToChat(card);
    if (!save) return;
    pushHistory({ type: 'order', data: order });
    saveHistory();
};
