/** localStorage wrapper that never throws (private mode, quota, disabled storage). */
export const readStorage = (key: string): string | null => {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

export const writeStorage = (key: string, value: string): void => {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        /* storage unavailable: the widget keeps working in-memory */
    }
};

export const removeStorage = (key: string): void => {
    try {
        window.localStorage.removeItem(key);
    } catch {
        /* storage unavailable: nothing to remove */
    }
};
