import type { WidgetConfig } from '../types/chat.types';

let activeConfig: WidgetConfig | null = null;

export const setConfig = (config: WidgetConfig): void => {
    activeConfig = config;
};

export const getConfig = (): WidgetConfig => {
    if (!activeConfig) throw new Error('AI Sales Assistant: configuration accessed before init.');
    return activeConfig;
};
