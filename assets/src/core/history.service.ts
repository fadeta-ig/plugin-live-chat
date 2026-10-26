import type { HistoryItem } from '../types/chat.types';
import { asHistoryItem } from '../guards/history.guard';
import { isRecord } from '../utils/type-guards';
import { readStorage, removeStorage, writeStorage } from '../utils/safe-storage';
import { HISTORY_STORAGE_KEY, HISTORY_TTL_MS } from './constants';
import { getSessionId } from './session.service';

let chatHistory: HistoryItem[] = [];

export const pushHistory = (item: HistoryItem): void => {
    chatHistory.push(item);
};

export const saveHistory = (): void => {
    writeStorage(
        HISTORY_STORAGE_KEY,
        JSON.stringify({ session_id: getSessionId(), items: chatHistory, timestamp: Date.now() }),
    );
};

export const clearHistory = (): void => {
    chatHistory = [];
    removeStorage(HISTORY_STORAGE_KEY);
};

const parseStoredHistory = (raw: string): HistoryItem[] | null => {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.session_id !== getSessionId()) return null;
    if (typeof parsed.timestamp !== 'number') return null;
    if (Date.now() - parsed.timestamp >= HISTORY_TTL_MS) return null;
    if (!Array.isArray(parsed.items)) return [];

    return parsed.items.flatMap((entry: unknown) => {
        const item = asHistoryItem(entry);
        return item ? [item] : [];
    });
};

/** Restores the stored conversation into memory and returns it, or null if unusable. */
export const loadHistory = (): HistoryItem[] | null => {
    const raw = readStorage(HISTORY_STORAGE_KEY);
    if (!raw) return null;
    try {
        const items = parseStoredHistory(raw);
        if (items) chatHistory = items;
        return items;
    } catch {
        return null;
    }
};
