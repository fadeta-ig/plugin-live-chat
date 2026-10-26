import { LAST_SEEN_PRODUCT_KEY } from './constants';
import { clearHistory } from './history.service';
import { renewSessionId } from './session.service';
import { removeStorage } from '../utils/safe-storage';

/** Starts a brand-new conversation: new session id, empty history, reset product nudge. */
export const resetConversation = (): void => {
    removeStorage(LAST_SEEN_PRODUCT_KEY);
    renewSessionId();
    clearHistory();
};
