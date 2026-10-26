import type { OrderItem, OrderPayload, OrdersPayload, OrderTracking } from '../types/chat.types';
import { isRecord, toText } from '../utils/type-guards';

const asOrderItem = (value: unknown): OrderItem[] => {
    if (!isRecord(value)) return [];
    return [{ name: toText(value.name), qty: toText(value.qty, '1'), total: toText(value.total) }];
};

const asTracking = (value: unknown): OrderTracking | null => {
    if (!isRecord(value)) return null;
    return {
        courier: toText(value.courier),
        tracking_number: toText(value.tracking_number),
        status_label: toText(value.status_label),
    };
};

export const asOrder = (value: unknown): OrderPayload | null => {
    if (!isRecord(value)) return null;
    const items = Array.isArray(value.items) ? value.items.flatMap(asOrderItem) : [];

    return {
        order_number: toText(value.order_number) || toText(value.order_id),
        status: toText(value.status),
        status_raw: toText(value.status_raw),
        date: toText(value.date, '-'),
        items,
        tracking: asTracking(value.tracking),
        total: toText(value.total),
    };
};

export const asOrdersPayload = (value: unknown): OrdersPayload | null => {
    if (!isRecord(value)) return null;
    const orders = Array.isArray(value.orders)
        ? value.orders.flatMap((entry: unknown) => {
              const order = asOrder(entry);
              return order ? [order] : [];
          })
        : [];

    return { guest_redirect: toText(value.guest_redirect) || null, orders };
};
