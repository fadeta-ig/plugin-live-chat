let isWaitingForReply = false;

export const getIsWaiting = (): boolean => isWaitingForReply;

export const setIsWaiting = (value: boolean): void => {
    isWaitingForReply = value;
};
