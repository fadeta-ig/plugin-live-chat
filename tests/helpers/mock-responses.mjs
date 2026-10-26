const encoder = new TextEncoder();
const STREAM_STEP_MS = 15;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Builds an SSE Response from a list of JSON events. */
export const sseResponse = (events) =>
    new Response(
        new ReadableStream({
            async start(controller) {
                for (const event of events) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                    await wait(STREAM_STEP_MS);
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
    );

export const jsonResponse = (payload, status = 200) =>
    new Response(JSON.stringify(payload), {
        status,
        headers: { 'content-type': 'application/json' },
    });

export const token = (content) => ({ choices: [{ delta: { content } }] });

export const shampooProduct = {
    product_id: 11,
    title: 'Shampoo "Anti" Ketombe',
    price: 89000,
    permalink: '/p/11',
    image_url: '',
};

export const shippedOrder = {
    order_number: '10482',
    status: 'Dikirim',
    status_raw: 'shipped',
    date: '2026-10-20',
    items: [{ name: 'Yunso Soap', qty: 2, total: '60.000' }],
    tracking: { courier: 'JNE', tracking_number: '0123456789', status_label: 'On Transit' },
    total: '60.000',
};
