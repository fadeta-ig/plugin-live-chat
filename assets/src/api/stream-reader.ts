import type { StreamControl, StreamEvent } from '../types/chat.types';
import { createSseDecoder } from './sse.decoder';

/** Reads an SSE response to completion; stops early when the handler returns 'abort'. */
export const readEventStream = async (
    response: Response,
    onEvent: (event: StreamEvent) => StreamControl,
): Promise<void> => {
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = createSseDecoder();

    for (;;) {
        const { done, value } = await reader.read();
        if (done) return;

        for (const event of decoder.push(value)) {
            if (onEvent(event) === 'abort') {
                await reader.cancel();
                return;
            }
        }
    }
};
