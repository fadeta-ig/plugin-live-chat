/**
 * Strips all Unicode emojis from incoming text as a client-side safety guardrail.
 */
const EMOJI_PATTERN = /\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu;

export const stripEmojis = (text: string): string => text.replace(EMOJI_PATTERN, '').trim();
