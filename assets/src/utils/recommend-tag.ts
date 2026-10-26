const ALL_RECOMMEND_PATTERN = /\[RECOMMEND:\s*([\d,\s]+)\]/g;
const PARTIAL_RECOMMEND_PATTERN = /\[RECOMMEND:.*?(\]|$)/g;

export interface Recommendation {
    cleanText: string;
    productIds: number[];
}

export const extractRecommendation = (text: string): Recommendation => {
    const productIds: number[] = [];
    const matches = text.matchAll(ALL_RECOMMEND_PATTERN);
    for (const match of matches) {
        const ids = (match[1] ?? '')
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !Number.isNaN(id));
        productIds.push(...ids);
    }
    const cleanText = text.replace(ALL_RECOMMEND_PATTERN, '');
    return { cleanText, productIds };
};

/** Hides a (possibly still incomplete) recommend tag while text is streaming. */
export const stripPartialRecommendation = (text: string): string =>
    text.replace(PARTIAL_RECOMMEND_PATTERN, '');
