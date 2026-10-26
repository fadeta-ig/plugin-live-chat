const RECOMMEND_PATTERN = /\[RECOMMEND:\s*([\d,\s]+)\]/;
const PARTIAL_RECOMMEND_PATTERN = /\[RECOMMEND:.*?(\]|$)/g;

export interface Recommendation {
    cleanText: string;
    productIds: number[];
}

export const extractRecommendation = (text: string): Recommendation => {
    const match = text.match(RECOMMEND_PATTERN);
    if (!match) return { cleanText: text, productIds: [] };

    const productIds = (match[1] ?? '')
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !Number.isNaN(id));
    return { cleanText: text.replace(match[0], ''), productIds };
};

/** Hides a (possibly still incomplete) recommend tag while text is streaming. */
export const stripPartialRecommendation = (text: string): string =>
    text.replace(PARTIAL_RECOMMEND_PATTERN, '');
