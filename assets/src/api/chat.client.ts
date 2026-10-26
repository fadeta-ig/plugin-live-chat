import { getConfig } from '../core/config.store';
import { getSessionId } from '../core/session.service';

const postChat = (message: string, stream: boolean): Promise<Response> => {
    const config = getConfig();
    return fetch(config.restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
        body: JSON.stringify({
            message,
            session_id: getSessionId(),
            current_product: config.currentProduct,
            cart_items: config.cartItems,
            stream,
        }),
    });
};

/** Prefers SSE streaming and transparently retries once without streaming. */
export const requestChat = async (message: string): Promise<Response> => {
    const streamed = await postChat(message, true);
    if (streamed.ok) return streamed;

    console.warn(`AI Chat: SSE stream failed (${streamed.status}), retrying without streaming...`);
    return postChat(message, false);
};
