import type { OrdersPayload, ProductPayload } from '../../types/chat.types';
import { appendProductCard } from '../../ui/cards/product-card';
import { appendProductCarousel } from '../../ui/cards/product-carousel';
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
    const recommended = products.filter((p) => recommendedIds.includes(p.product_id));
    if (recommended.length === 0) return;
    if (recommended.length > 1) {
        appendProductCarousel(recommended);
        return;
    }
    const [first] = recommended;
    if (first) appendProductCard(first);
};
