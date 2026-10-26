import { bindElements, type Elements } from './elements';
import { buildShellHtml } from './shell.template';

export const mountShell = (root: HTMLElement, botName: string): Elements => {
    root.innerHTML = buildShellHtml(botName);
    return bindElements();
};
