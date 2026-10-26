import { SESSION_STORAGE_KEY } from './constants';
import { readStorage, removeStorage, writeStorage } from '../utils/safe-storage';

const SESSION_ID_PATTERN = /^sess_[a-zA-Z0-9_-]{16,64}$/;
const SESSION_RANDOM_BYTES = 16;

const generateSessionId = (): string => {
    if (window.crypto && window.crypto.getRandomValues) {
        const bytes = new Uint8Array(SESSION_RANDOM_BYTES);
        window.crypto.getRandomValues(bytes);
        return 'sess_' + Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    const randomPart = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    return 'sess_' + randomPart.padEnd(SESSION_RANDOM_BYTES, '0').slice(0, 32);
};

const loadOrCreateSessionId = (): string => {
    const stored = readStorage(SESSION_STORAGE_KEY);
    if (stored && SESSION_ID_PATTERN.test(stored)) return stored;

    const created = generateSessionId();
    writeStorage(SESSION_STORAGE_KEY, created);
    return created;
};

let sessionId = loadOrCreateSessionId();

export const getSessionId = (): string => sessionId;

export const renewSessionId = (): void => {
    removeStorage(SESSION_STORAGE_KEY);
    sessionId = loadOrCreateSessionId();
};
