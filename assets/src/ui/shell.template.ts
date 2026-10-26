import { escapeHtml } from '../utils/escape-html';

const RESET_ICON_PATH = 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z';
const CLOSE_ICON_PATH =
    'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

const buildHeader = (botName: string): string => `
    <div class="ai-woo-sa-header">
        <div>
            <h3>${escapeHtml(botName)}</h3>
            <div class="ai-woo-sa-header-status"><span class="ai-woo-sa-status-dot"></span> Online</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
            <button class="ai-woo-sa-reset" id="ai-woo-sa-reset-btn" aria-label="Reset chat" style="background:transparent; border:none; color:white; cursor:pointer; opacity:0.8; padding:4px;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="${RESET_ICON_PATH}"/></svg>
            </button>
            <button class="ai-woo-sa-close" id="ai-woo-sa-close-btn" aria-label="Close chat" style="background:transparent; border:none; color:white; cursor:pointer; padding:4px;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="${CLOSE_ICON_PATH}"/></svg>
            </button>
        </div>
    </div>`;

const buildComposer = (): string => `
    <div class="ai-woo-sa-footer">
        <input type="text" id="ai-woo-sa-input" class="ai-woo-sa-input" placeholder="Tanya sesuatu..." autocomplete="off">
        <button class="ai-woo-sa-send" id="ai-woo-sa-send-btn" aria-label="Send message">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
    </div>`;

const buildLauncher = (): string => `
    <button class="ai-woo-sa-fab" id="ai-woo-sa-fab" aria-label="Open chat">
        <span class="ai-woo-sa-badge" id="ai-woo-sa-badge" style="display:none;">0</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    </button>`;

const buildConfirmDialog = (): string => `
    <div class="ai-woo-sa-confirm-overlay" id="ai-woo-sa-confirm-overlay">
        <div class="ai-woo-sa-confirm-box">
            <h4 id="ai-woo-sa-confirm-title">Konfirmasi</h4>
            <p id="ai-woo-sa-confirm-text"></p>
            <div class="ai-woo-sa-confirm-actions">
                <button class="ai-woo-sa-confirm-btn cancel" id="ai-woo-sa-confirm-cancel">Batal</button>
                <button class="ai-woo-sa-confirm-btn confirm" id="ai-woo-sa-confirm-ok">OK</button>
            </div>
        </div>
    </div>`;

export const buildShellHtml = (botName: string): string => `
    <div class="ai-woo-sa-chat-window" id="ai-woo-sa-window">
        ${buildHeader(botName)}
        <div class="ai-woo-sa-body" id="ai-woo-sa-body"></div>
        ${buildComposer()}
    </div>
    ${buildLauncher()}
    ${buildConfirmDialog()}`;
