import { WIDGET_ROOT_ID } from './core/constants';
import { setConfig } from './core/config.store';
import { registerEventListeners } from './features/bootstrap/register-listeners';
import { restoreConversation } from './features/bootstrap/restore-conversation';
import { renderQuickReplies } from './features/quick-replies/quick-reply.controller';
import { asWidgetConfig } from './guards/config.guard';
import { mountShell } from './ui/mount-shell';

const initWidget = (): void => {
    const root = document.getElementById(WIDGET_ROOT_ID);
    if (!root) return;

    const config = asWidgetConfig(window.aiWooSaConfig);
    if (!config) {
        console.warn('AI Sales Assistant: Configuration not found. Widget disabled.');
        return;
    }

    setConfig(config);
    mountShell(root, config.botName);
    registerEventListeners();
    restoreConversation();
    renderQuickReplies('initial');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
} else {
    initWidget();
}
