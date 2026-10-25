<?php
/**
 * Intent Lexicon
 *
 * Fixed vocabularies used by the zero-cost local pre-filters of the intent
 * classifier. Anything not matched here is deferred to the LLM classifier,
 * so entries must be PRECISE: a false positive here silently mis-routes a user.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class AI_Woo_SA_Intent_Lexicon {

    /** Words that, alone or combined, form a pure greeting / address ("halo kak admin"). */
    const GREETING_TOKENS = array(
        'halo', 'hai', 'hay', 'hi', 'hey', 'hello', 'hola', 'helo',
        'pagi', 'siang', 'sore', 'malam', 'selamat', 'good', 'morning', 'afternoon', 'evening',
        'tes', 'test', 'ping', 'p', 'permisi', 'salam',
        'assalamualaikum', 'assalamu', 'alaikum', 'wr', 'wb',
        'kak', 'kakak', 'kk', 'min', 'admin', 'bang', 'mas', 'mbak', 'sis', 'gan', 'bro',
        'shinyoung', 'shinmates', 'shinmate', 'woi', 'oi', 'oy',
    );

    /** Questions about who/what the assistant is or can do. */
    const IDENTITY_PHRASES = array(
        'apa ini', 'ini apa', 'apaan ini', 'ini apaan', 'ini siapa', 'siapa ini',
        'kamu siapa', 'siapa kamu', 'anda siapa', 'siapa anda', 'ini bot', 'kamu bot',
        'ini bot apa', 'bot apa ini', 'bisa apa', 'bisa apa aja', 'bisa apa saja', 'kamu bisa apa',
        'kamu bisa apa aja', 'kamu bisa apa saja', 'kamu bisa bantu apa', 'kamu bisa bantu apa aja',
        'bisa bantu apa', 'bisa bantu apa aja', 'fitur apa aja', 'fungsi kamu apa',
        'who are you', 'what is this', 'what can you do',
    );

    /** Conversation openers that contain no actual question yet. */
    const OPENER_PHRASES = array(
        'mau tanya', 'mau nanya', 'boleh tanya', 'boleh nanya', 'tanya dong', 'nanya dong',
        'mau tanya dong', 'mau nanya dong', 'boleh tanya dong', 'tanya dikit', 'nanya dikit',
        'numpang tanya', 'numpang nanya', 'i have a question', 'can i ask',
    );

    /** Pure gratitude. Short acknowledgements like "oke" are NOT here: they may answer a bot offer. */
    const GRATITUDE_PHRASES = array(
        'terima kasih', 'terima kasih banyak', 'makasih', 'makasih banyak', 'makasih ya',
        'oke makasih', 'ok makasih', 'oke terima kasih', 'ok terima kasih', 'sama sama',
        'thanks', 'thank you', 'thx', 'tengkyu',
    );

    const TRACKING_PHRASES = array(
        'lacak', 'tracking', 'cek resi', 'nomor resi', 'no resi', 'resi', 'sampai mana',
        'posisi paket', 'paket saya', 'sudah dikirim', 'belum dikirim', 'kapan dikirim',
        'status pengiriman', 'status pesanan', 'belum sampai', 'belum nyampe', 'belum datang',
        'belum diterima', 'track my order', 'where is my order', 'shipping status', 'order status',
    );

    const DETAIL_PHRASES = array(
        'detail pesanan', 'rincian pesanan', 'invoice', 'nota', 'struk', 'total belanja',
        'order details', 'receipt',
    );

    const LIST_PHRASES = array(
        'pesanan saya', 'pesanan terakhir', 'riwayat pesanan', 'riwayat belanja', 'order saya',
        'history pesanan', 'daftar pesanan', 'my orders', 'order history', 'recent orders',
    );
}
