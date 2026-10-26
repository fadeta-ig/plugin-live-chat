export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** Coerces strings and numbers to text; anything else yields the fallback. */
export const toText = (value: unknown, fallback = ''): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return fallback;
};

export const toAmount = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return parseFloat(toText(value)) || 0;
};
