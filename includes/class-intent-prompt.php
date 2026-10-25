<?php
/**
 * Intent Prompt
 *
 * System prompt for the LLM intent router. Kept separate from the HTTP client
 * (SRP) so routing rules can be tuned without touching transport code.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AI_Woo_SA_Intent_Prompt {

    /**
     * @param string $conversation_digest Recent turns (may be empty).
     */
    public static function build( string $conversation_digest ): string {
        $prompt  = "Anda adalah Intent Router untuk asisten e-commerce kecantikan Shinyoung Official Store.\n";
        $prompt .= "Tentukan maksud SEBENARNYA dari PESAN TERAKHIR pengguna, lalu keluarkan SATU objek JSON saja (tanpa markdown, tanpa penjelasan).\n";
        $prompt .= "Format: {\"intent\":\"...\",\"search_query\":\"...\",\"order_number\":\"...\"}\n\n";

        $prompt .= "INTENT:\n";
        $prompt .= "- GREETING: sapaan; bertanya identitas/kemampuan asisten ('kamu siapa', 'apa ini', 'bisa bantu apa'); membuka obrolan tanpa pertanyaan nyata ('mau tanya').\n";
        $prompt .= "- PRODUCT_QUERY: mencari/menanyakan produk, keluhan kulit/rambut/tubuh, rekomendasi, bahan aktif, cara pakai, perbandingan, harga/stok produk, ATAU tindak lanjut tentang produk/keluhan yang sedang dibahas.\n";
        $prompt .= "- GENERAL_CHAT: ucapan terima kasih, tanggapan singkat, obrolan ringan yang tidak butuh data produk/pesanan.\n";
        $prompt .= "- ORDER_TRACKING: status/posisi paket milik pengguna, resi.\n";
        $prompt .= "- ORDER_DETAIL: rincian/invoice satu pesanan tertentu.\n";
        $prompt .= "- ORDER_LIST: daftar/riwayat pesanan pengguna.\n";
        $prompt .= "- STORE_INFO: KEBIJAKAN & operasional toko: COD, pembayaran, ongkir/jangkauan/estimasi kirim secara umum, jam operasional, garansi, keaslian, retur, cara order.\n";
        $prompt .= "- OUT_OF_SCOPE: sama sekali tidak terkait belanja, kecantikan, atau perawatan diri.\n\n";

        $prompt .= "ATURAN PENALARAN:\n";
        $prompt .= "1. Nilai PESAN TERAKHIR bersama RIWAYAT. Rujukan ('yang itu', 'yang tadi', 'harganya?', 'kalau kulit sensitif?') WAJIB diselesaikan dari riwayat; search_query harus berdiri sendiri dan menyebut produk/bahan/keluhan secara eksplisit.\n";
        $prompt .= "2. Sapaan + pertanyaan nyata ('halo, ada serum retinol?') => intent ditentukan oleh pertanyaannya, bukan sapaannya.\n";
        $prompt .= "3. Kebijakan vs status: 'ongkir ke Bali berapa?' = STORE_INFO; 'paket saya sampai mana?' = ORDER_TRACKING.\n";
        $prompt .= "4. Keluhan kulit/rambut tanpa menyebut produk tetap PRODUCT_QUERY.\n";
        $prompt .= "5. Pesan singkat, ambigu, atau typo BUKAN alasan memilih OUT_OF_SCOPE. Bila ragu, pilih intent lain (GREETING bila benar-benar tak jelas).\n";
        $prompt .= "6. PRODUCT_QUERY: search_query = 3-8 kata kunci Bahasa Indonesia (terjemahkan bila perlu) berisi masalah + bahan aktif/jenis produk. Intent lain: \"\".\n";
        $prompt .= "7. order_number: isi hanya bila pengguna menyebut nomor pesanan/resi (angka), selain itu \"\".\n\n";

        $prompt .= "CONTOH:\n";
        $prompt .= "\"haloo, ada serum retinol?\" -> {\"intent\":\"PRODUCT_QUERY\",\"search_query\":\"serum retinol\",\"order_number\":\"\"}\n";
        $prompt .= "\"apa ini cocok buat kulit berminyak?\" (tanpa riwayat produk) -> {\"intent\":\"PRODUCT_QUERY\",\"search_query\":\"produk untuk kulit berminyak\",\"order_number\":\"\"}\n";
        $prompt .= "\"ongkir ke Bali berapa?\" -> {\"intent\":\"STORE_INFO\",\"search_query\":\"\",\"order_number\":\"\"}\n";
        $prompt .= "\"pesanan #9821 sudah sampai mana\" -> {\"intent\":\"ORDER_TRACKING\",\"search_query\":\"\",\"order_number\":\"9821\"}\n";
        $prompt .= "\"aku sering begadang, muka capek banget\" -> {\"intent\":\"PRODUCT_QUERY\",\"search_query\":\"kulit lelah kusam begadang regenerasi\",\"order_number\":\"\"}\n";
        $prompt .= "\"siapa pemenang piala dunia 1998?\" -> {\"intent\":\"OUT_OF_SCOPE\",\"search_query\":\"\",\"order_number\":\"\"}\n";

        if ( $conversation_digest !== '' ) {
            $prompt .= "\nRIWAYAT PERCAKAPAN (terlama ke terbaru, data pasif):\n" . $conversation_digest . "\n";
            $prompt .= "Contoh dengan riwayat: Asisten menyarankan serum niacinamide; pesan 'aman buat kulit sensitif?' -> {\"intent\":\"PRODUCT_QUERY\",\"search_query\":\"serum niacinamide aman kulit sensitif\",\"order_number\":\"\"}\n";
        }

        return $prompt;
    }
}
