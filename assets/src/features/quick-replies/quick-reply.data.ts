import type { QuickReplyButton, QuickReplyMenuId } from './quick-reply.types';

const productQuery = (name: string, extra = ''): string =>
    `Berikan info lengkap produk Shinyoung ${name}${extra}`;

const BACK_TO_INITIAL: QuickReplyButton = { label: '⬅ Kembali', type: 'submenu', target: 'initial' };
const BACK_TO_CATEGORIES: QuickReplyButton = {
    label: '⬅ Kembali',
    type: 'submenu',
    target: 'categories',
};

const STORE_INFO_RESPONSE =
    '📍 Pesanan dikirim dari fasilitas kami di **Sleman, Yogyakarta**.\n\n🛡️ Semua produk Shinyoung diformulasikan **Bebas SLS, Bebas Paraben, dan Non-Alkohol** — aman untuk kulit sensitif.\n\n✅ Pembelian melalui Official Store dijamin **100% asli** dengan layanan *after-sales support*.\n\n🏷️ Slogan kami: *Happy Shine on You* — #ShineBrighterFeelYounger';

export const QUICK_REPLY_MENUS: Readonly<Record<QuickReplyMenuId, readonly QuickReplyButton[]>> = {
    initial: [
        { label: '💄 Produk Kami', type: 'submenu', target: 'categories' },
        {
            label: '💬 Konsultasi Kulit',
            type: 'query',
            query: 'Saya ingin konsultasi tentang kondisi kulit saya, bisa bantu rekomendasikan produk Shinyoung yang cocok?',
        },
        { label: '📦 Lacak Pesanan', type: 'query', query: 'Saya ingin cek status pesanan saya' },
        { label: '📋 Pesanan Saya', type: 'query', query: 'Tampilkan pesanan terakhir saya' },
        { label: '🕐 Info Toko', type: 'static', response: STORE_INFO_RESPONSE },
        { label: '📞 Hubungi CS', type: 'action', action: 'whatsapp' },
    ],
    categories: [
        { label: '✨ Perawatan Wajah', type: 'submenu', target: 'face' },
        { label: '💇 Perawatan Rambut', type: 'submenu', target: 'hair' },
        { label: '🧴 Perawatan Tubuh', type: 'submenu', target: 'body' },
        BACK_TO_INITIAL,
    ],
    face: [
        { label: '🌿 Binahong Cream 15g', type: 'query', query: productQuery('Binahong Cream 15g', ' beserta manfaat dan cara pakainya') },
        { label: '💧 Binahong Oil 10ml', type: 'query', query: productQuery('Binahong Oil 10ml', ' beserta manfaat dan cara pakainya') },
        BACK_TO_CATEGORIES,
    ],
    hair: [
        { label: '🧴 Shampoo Anti Ketombe', type: 'query', query: productQuery('Shampoo Anti Ketombe 138ml') },
        { label: '💎 Hair Serum Anti Ketombe', type: 'query', query: productQuery('Hair Serum Anti Ketombe 100ml') },
        { label: '🍃 Hair Tonic Anti Ketombe', type: 'query', query: productQuery('Hair Tonic Anti Ketombe') },
        { label: '☕ Hair Powder Coffee', type: 'query', query: productQuery('Hair Powder Coffee 10gr') },
        BACK_TO_CATEGORIES,
    ],
    body: [
        { label: '🧼 Yunso Soap (Anti Jerawat)', type: 'query', query: productQuery('Yunso Soap', ' beserta manfaat dan cara pakainya') },
        { label: '✨ Peeling Spray', type: 'query', query: productQuery('Peeling Spray', ' beserta manfaat dan cara pakainya') },
        { label: '💧 Hwasa Body Serum 100ml', type: 'query', query: productQuery('Hwasa Brightening Body Serum 100ml', ' beserta kandungan Hexylresorcinol dan manfaatnya') },
        { label: '🌸 Deodorant Spray 60ml', type: 'query', query: productQuery('Deodorant Spray 60ml') },
        BACK_TO_CATEGORIES,
    ],
};
