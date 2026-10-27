# Pemeriksaan tampilan chat 2.7.8

Tanggal: 26 Oktober 2026. Lingkungan: source lokal, bundle produksi `assets/dist`, Chromium melalui browser internal. Respons chat pada preview adalah fixture lokal.

## Hasil

- [VERIFIED] Reset CSS dan aturan komponen sekarang memiliki prioritas yang konsisten. Padding header/dialog serta latar tombol tidak lagi ditimpa reset internal. Sumber: [base.css](../../assets/css/base.css), [header.css](../../assets/css/header.css), [sheet.css](../../assets/css/sheet.css).
- [VERIFIED] Menu pembuka hanya menampilkan empat pilihan. Menu sambutan dihapus dari tampilan ketika pengguna mulai berbicara. Pilihan lanjutan membungkus ke baris berikutnya. Sumber: [welcome template](../../assets/src/ui/welcome/welcome-screen.template.ts), [quick replies](../../assets/src/features/quick-replies/quick-reply.controller.ts), [message list](../../assets/src/ui/message-list.ts), [chips.css](../../assets/css/chips.css).
- [VERIFIED] Header dan composer tidak menyusut; isi percakapan memiliki scroll sendiri. Breakpoint mobile CSS dan JavaScript sama-sama 640 px. Tinggi visual viewport digunakan saat ruang layar berubah. Sumber: [window.css](../../assets/css/window.css), [responsive.css](../../assets/css/responsive.css), [chat-window.ts](../../assets/src/ui/chat-window.ts).
- [VERIFIED] Dialog mulai ulang berada di dalam panel chat. Fokus keyboard dibatasi pada pilihan dialog; Escape membatalkan dialog tanpa menutup chat. Sumber: [confirm-dialog.ts](../../assets/src/ui/confirm-dialog.ts), [tes UI](../../tests/widget.ui.test.mjs).
- [VERIFIED] Tombol pembuka memiliki label `Tanya Shinyoung`. Ikon memakai SVG, tanpa penambahan emoji. Sumber: [shell.template.ts](../../assets/src/ui/shell.template.ts).

## Validasi

- `npm run check`: TypeScript dan build JS/CSS berhasil.
- `node --test "tests/**/*.test.mjs"`: 20 tes lulus, 0 gagal. Cakupan mencakup menu, respons streaming, escaping HTML, keranjang, riwayat, reset, dialog, serta perilaku mobile.
- `git diff --check`: berhasil.
- `php -l ai-woo-sales-assistant.php`: tidak ada kesalahan sintaks.
- Preview memuat contoh aturan tema untuk heading, paragraf, tombol, dan input agar konflik CSS normal dapat diperiksa.

| Viewport CSS px | Hasil pengamatan browser |
| --- | --- |
| 1440 × 900 | Panel 420 × 760; seluruh menu awal terlihat; tidak ada overflow horizontal. |
| 1280 × 720 | Keempat pilihan awal terlihat; composer terpisah dari area scroll. |
| 390 × 844 | Tampilan mobile penuh; semua menu awal terlihat; teks input 16 px. |
| 320 × 568 | Lebar halaman 320; lebar panel 320; lebar scroll isi sama dengan lebar isinya 315; menu bawah dapat dijangkau dengan scroll. |
| 600 × 700 | Panel penuh 600 × 700; scroll halaman terkunci selama chat terbuka. |
| 390 × 480 | Tinggi panel 480; batas bawah footer tepat di 480; area percakapan tetap dapat digulir. Ini simulasi viewport pendek, bukan pengujian keyboard perangkat fisik. |

Screenshot: [desktop](desktop-welcome.jpg), [mobile](mobile-welcome.jpg), [dialog](mobile-confirm.jpg), [percakapan](mobile-conversation.jpg).

## Dasar rancangan dan batas pemeriksaan

Rancangan mengacu pada perilaku [CSS specificity (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity) dan prinsip [WCAG 2.2 Reflow (W3C)](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Pemeriksaan ini bukan sertifikasi kepatuhan WCAG menyeluruh.

Belum diverifikasi pada tema/cache website produksi, Safari/iOS fisik, atau koneksi AI/WooCommerce produksi. Tidak ada perubahan yang diterapkan ke website produksi. Paket runtime sudah menyertakan bundle JS/CSS hasil build.

Untuk mengulang preview lokal: jalankan `npm run preview`, buka `http://127.0.0.1:4173`, kemudian klik `Tanya Shinyoung`.
