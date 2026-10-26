import type { StreamEvent } from '../types/chat.types';
import { toStreamEvent } from '../guards/stream-event.guard';

const DATA_PREFIX = 'data: ';
const IGNORED_PAYLOADS: readonly string[] = ['[DONE]', '{}'];

const parseSseLine = (rawLine: string): StreamEvent | null => {
    const line = rawLine.trim();
    if (!line.startsWith(DATA_PREFIX)) return null;

    const payload = line.slice(DATA_PREFIX.length);
    if (IGNORED_PAYLOADS.includes(payload)) return null;
    try {
        return toStreamEvent(JSON.parse(payload));
    } catch {
        return null;
    }
};

/** Incremental SSE decoder: feed raw chunks, receive complete typed events. */
export const createSseDecoder = () => {
    const textDecoder = new TextDecoder('utf-8');
    let buffer = '';

    return {
        push(chunk: Uint8Array): StreamEvent[] {
            buffer += textDecoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            return lines.flatMap((line) => {
                const event = parseSseLine(line);
                return event ? [event] : [];
            });
        },
    };
};
