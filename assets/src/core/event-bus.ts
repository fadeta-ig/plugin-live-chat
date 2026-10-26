import type { AddToCartDetail } from '../types/chat.types';

export const EVENT_REMOVE_QUICK_REPLIES = 'aiWooSaRemoveQuickReplies';
export const EVENT_SHOW_INITIAL_QUICK_REPLIES = 'aiWooSaShowInitialQuickReplies';
const EVENT_ADD_TO_CART = 'aiWooSaAddToCart';

export const emitSignal = (eventName: string): void => {
    document.dispatchEvent(new Event(eventName));
};

export const onSignal = (eventName: string, handler: () => void): void => {
    document.addEventListener(eventName, handler);
};

export const emitAddToCart = (detail: AddToCartDetail): void => {
    document.dispatchEvent(new CustomEvent<AddToCartDetail>(EVENT_ADD_TO_CART, { detail }));
};

export const onAddToCart = (handler: (detail: AddToCartDetail) => void): void => {
    document.addEventListener(EVENT_ADD_TO_CART, (event) => {
        if (event instanceof CustomEvent) handler(event.detail as AddToCartDetail);
    });
};
