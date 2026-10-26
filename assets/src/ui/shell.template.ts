import { escapeHtml } from '../utils/escape-html';
import {
    ICON_ARROW_DOWN,
    ICON_CLOSE,
    ICON_LAUNCHER,
    ICON_REFRESH,
    ICON_SEND,
} from './icons/icons';

const buildHeader = (botName: string): string => `
    <header class="ai-woo-sa-header">
        <div class="ai-woo-sa-header-brand">
            <div class="ai-woo-sa-avatar" aria-hidden="true">
                <span class="ai-woo-sa-avatar-text">SA</span>
            </div>
            <div class="ai-woo-sa-header-info">
                <h3 class="ai-woo-sa-header-title">${escapeHtml(botName)}</h3>
                <div class="ai-woo-sa-header-status">
                    <span class="ai-woo-sa-status-dot" aria-hidden="true"></span>
                    <span class="ai-woo-sa-status-label">Beauty Advisor</span>
                </div>
            </div>
        </div>
        <div class="ai-woo-sa-header-actions">
            <button class="ai-woo-sa-header-btn" id="ai-woo-sa-reset-btn" aria-label="Mulai obrolan baru" title="Mulai obrolan baru">
                ${ICON_REFRESH}
            </button>
            <button class="ai-woo-sa-header-btn" id="ai-woo-sa-close-btn" aria-label="Tutup obrolan" title="Tutup">
                ${ICON_CLOSE}
            </button>
        </div>
    </header>`;

const buildComposer = (): string => `
    <footer class="ai-woo-sa-footer">
        <div class="ai-woo-sa-composer">
            <input type="text" id="ai-woo-sa-input" class="ai-woo-sa-input" placeholder="Tulis pertanyaan Anda..." autocomplete="off" aria-label="Pesan Anda" />
            <button class="ai-woo-sa-send" id="ai-woo-sa-send-btn" aria-label="Kirim pesan" title="Kirim">
                ${ICON_SEND}
            </button>
        </div>
        <div class="ai-woo-sa-disclaimer">
            <span>Dijawab oleh AI. Untuk kepastian, hubungi CS.</span>
        </div>
    </footer>`;

const buildLauncher = (): string => `
    <button class="ai-woo-sa-fab" id="ai-woo-sa-fab" aria-label="Buka layanan konsultasi">
        <span class="ai-woo-sa-badge" id="ai-woo-sa-badge" style="display:none;" aria-label="Pesan baru">0</span>
        <span class="ai-woo-sa-fab-icon">${ICON_LAUNCHER}</span>
    </button>`;

const buildConfirmDialog = (): string => `
    <div class="ai-woo-sa-confirm-overlay" id="ai-woo-sa-confirm-overlay" role="alertdialog" aria-modal="true" aria-labelledby="ai-woo-sa-confirm-title" aria-describedby="ai-woo-sa-confirm-text">
        <div class="ai-woo-sa-confirm-box">
            <h4 id="ai-woo-sa-confirm-title">Mulai Obrolan Baru?</h4>
            <p id="ai-woo-sa-confirm-text"></p>
            <div class="ai-woo-sa-confirm-actions">
                <button class="ai-woo-sa-confirm-btn cancel" id="ai-woo-sa-confirm-cancel">Batal</button>
                <button class="ai-woo-sa-confirm-btn confirm" id="ai-woo-sa-confirm-ok">Mulai Baru</button>
            </div>
        </div>
    </div>`;

export const buildShellHtml = (botName: string): string => `
    <div class="ai-woo-sa-chat-window" id="ai-woo-sa-window" role="dialog" aria-label="Konsultasi Kecantikan Shinyoung">
        ${buildHeader(botName)}
        <div class="ai-woo-sa-body" id="ai-woo-sa-body" role="log" aria-live="polite" aria-atomic="false"></div>
        <button class="ai-woo-sa-jump-btn" id="ai-woo-sa-jump-btn" type="button" aria-label="Lompat ke pesan terbaru" style="display:none;">
            ${ICON_ARROW_DOWN}<span>Pesan baru</span>
        </button>
        ${buildComposer()}
    </div>
    ${buildLauncher()}
    ${buildConfirmDialog()}`;
