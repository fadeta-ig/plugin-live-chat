import {
    ICON_CHAT,
    ICON_CHEVRON_RIGHT,
    ICON_LEAF,
    ICON_PACKAGE,
    ICON_SPARKLE,
} from '../icons/icons';

export const buildWelcomeHtml = (): string => `
    <div class="ai-woo-sa-welcome-badge">
        <span>Personal Beauty Concierge</span>
    </div>
    <h2 class="ai-woo-sa-welcome-title">Selamat datang.</h2>
    <p class="ai-woo-sa-welcome-subtitle">
        Temukan perawatan yang tepat untuk Anda.<br>Pilih bantuan di bawah untuk memulai.
    </p>
    <div class="ai-woo-sa-starter-actions" role="group" aria-label="Aksi Cepat">
        <button class="ai-woo-sa-starter-row primary" data-starter="products" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${ICON_SPARKLE}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Temukan produk</span><span class="ai-woo-sa-starter-description">Jelajahi perawatan pilihan Shinyoung</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${ICON_CHEVRON_RIGHT}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="consultation" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${ICON_LEAF}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Konsultasi perawatan</span><span class="ai-woo-sa-starter-description">Ceritakan kebutuhan kulit atau rambut Anda</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${ICON_CHEVRON_RIGHT}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="track" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${ICON_PACKAGE}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Lacak pesanan</span><span class="ai-woo-sa-starter-description">Periksa status dan pengiriman pesanan</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${ICON_CHEVRON_RIGHT}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="cs" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${ICON_CHAT}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Hubungi tim Shinyoung</span><span class="ai-woo-sa-starter-description">Lanjutkan bantuan melalui WhatsApp</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${ICON_CHEVRON_RIGHT}</span>
        </button>
    </div>`;
