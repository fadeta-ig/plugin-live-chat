/**
 * Domain types. Server-sourced payloads keep the wire-format (snake_case) keys
 * so persisted history stays compatible with previously stored sessions.
 */

export type Sender = 'bot' | 'user';

export interface CurrentProduct {
    id: number;
    name: string;
    desc: string;
}

export interface CartItem {
    id: number;
    name: string;
    qty: number;
}

export interface WidgetConfig {
    restUrl: string;
    nonce: string;
    botName: string;
    wcAjaxUrl: string;
    waNumber: string;
    currentProduct: CurrentProduct | null;
    cartItems: CartItem[];
}

export interface ProductPayload {
    product_id: number;
    title: string;
    price: number;
    permalink: string;
    image_url: string;
}

export interface OrderItem {
    name: string;
    qty: string;
    total: string;
}

export interface OrderTracking {
    courier: string;
    tracking_number: string;
    status_label: string;
}

export interface OrderPayload {
    order_number: string;
    status: string;
    status_raw: string;
    date: string;
    items: OrderItem[];
    tracking: OrderTracking | null;
    total: string;
}

export interface OrdersPayload {
    guest_redirect: string | null;
    orders: OrderPayload[];
}

export type HistoryItem =
    | { type: 'msg'; text: string; sender: Sender; isRawHtml: boolean }
    | { type: 'product'; data: ProductPayload }
    | { type: 'wa'; link: string }
    | { type: 'order'; data: OrderPayload }
    | { type: 'tracking_redirect'; url: string };

export interface StreamMetaEvent {
    kind: 'meta';
    products: ProductPayload[];
    orders: OrdersPayload | null;
    fallback: boolean;
    waLink: string | null;
}

export interface StreamTokenEvent {
    kind: 'token';
    content: string;
}

export type StreamEvent = StreamMetaEvent | StreamTokenEvent;

export type StreamControl = 'continue' | 'abort';

export interface ChatResponse {
    text: string;
    products: ProductPayload[];
    orders: OrdersPayload | null;
    fallback: boolean;
    waLink: string | null;
    blocked: boolean;
}

export interface AddToCartDetail {
    productId: number;
    button: HTMLButtonElement;
    productTitle: string;
}
