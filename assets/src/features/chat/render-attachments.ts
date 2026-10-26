import type { OrdersPayload, ProductPayload } from '../../types/chat.types';
import { appendProductCard } from '../../ui/cards/product-card';
import { appendOrderCard } from '../../ui/cards/order-card';
import { appendTrackingRedirectCard } from '../../ui/cards/link-cards';

export const renderOrders = (orders: OrdersPayload | null): void => {
    if (!orders) return;
    if (orders.guest_redirect) {
        appendTrackingRedirectCard(orders.guest_redirect);
        return;
    }
    orders.orders.forEach((order) => appendOrderCard(order));
};

export const renderRecommendedProducts = (
    products: ProductPayload[],
    recommendedIds: number[],
): void => {
    products
        .filter((product) => recommendedIds.includes(product.product_id))
        .forEach((product) => appendProductCard(product));
};
