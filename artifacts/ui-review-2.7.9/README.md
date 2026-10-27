# Penyempurnaan chat Shinyoung 2.7.9

27 Oktober 2026. Verifikasi pada source lokal dan bundle `assets/dist`, melalui preview browser dengan respons fixture. Konten produk pada screenshot merupakan contoh QA.

## Perubahan yang diverifikasi

- [VERIFIED] Teks “Personal Beauty Concierge” dihapus dari template dan bundle. Pembuka menampilkan wordmark Shinyoung, judul serif, dan pilihan bantuan dengan pemisah yang lebih sederhana. Sumber: `assets/src/ui/welcome/welcome-screen.template.ts`, `assets/css/welcome.css`.
- [VERIFIED] Aksen utama memakai sage `#B5C4A9`, teks tombol `#293622`, latar ivory `#F8F9F5`, dan permukaan sage muda `#EDF1E8`. Header, monogram, launcher, composer, aksi produk, dan konfirmasi memakai palet yang sama. Sumber: `assets/css/tokens.css` dan stylesheet komponen.
- [VERIFIED] Renderer sebelumnya menggabungkan semua fragmen dengan `<br>` sehingga elemen tersebut juga masuk di antara item daftar; jalur respons biasa membungkus hasilnya dalam `<p>`. Sekarang paragraf, `ul`, dan `ol` menjadi elemen sejajar dalam `.ai-woo-sa-message-content`. Respons streaming, JSON, dan riwayat memakai renderer yang sama. Sumber: `assets/src/utils/inline-markup.ts`, `assets/src/ui/messages/append-message.ts`, `assets/src/features/chat/handle-stream-reply.ts`, `assets/src/features/chat/stream-session.ts`.
- [VERIFIED] Bullet memakai marker di luar teks, hanging indent, jarak antarpoin 7 px, serta jarak paragraf setelah daftar 12 px. Ketiga item fixture memiliki posisi kiri yang sama, 55 CSS px pada viewport 390 px. Tidak ada `<br>` sebagai anak langsung daftar. Sumber: `assets/css/messages.css`, `responsive-metrics.json`.
- [VERIFIED] Saat dibuka, halaman sambutan kembali ke bagian atas. Respons streaming juga memperoleh waktu pesan setelah selesai. Sumber: `assets/src/ui/chat-window.ts`, `assets/src/features/chat/handle-stream-reply.ts`.

## Pemeriksaan

- `npm run check`: TypeScript dan build JS/CSS lulus.
- `node --test "tests/**/*.test.mjs"`: 22 tes lulus, 0 gagal. Regresi baru mencakup daftar dengan baris kosong, bullet `-`/`*`/`•`, langkah bernomor, baris lanjutan, escaping HTML, streaming terpecah, dan replay riwayat.
- `php -l ai-woo-sales-assistant.php`: lulus.
- `git diff --check`: lulus.
- Versi PHP plugin, konstanta runtime, package, dan lockfile: `2.7.9`.

| Viewport CSS px | Hasil browser |
| --- | --- |
| 390 × 844 | Pembuka dan percakapan diperiksa secara visual. Bullet sejajar, paragraf terpisah, composer terlihat. |
| 320 × 568 | Percakapan diperiksa secara visual. Teks membungkus dan composer terlihat; lebar scroll isi sama dengan lebar isinya. |
| 390 × 480 | Simulasi layar pendek: area pesan tetap memiliki tinggi dan composer berada di batas bawah panel. |
| 527 × 695 | Ukuran pembanding screenshot pengguna. Daftar dan jarak paragraf diperiksa secara visual. |
| 1440 × 900 | Panel desktop 420 × 760; percakapan dan composer diperiksa. Keempat menu pembuka terlihat dan scroll pembuka berada di atas. Tidak ada overflow horizontal pada area chat. |

Ukuran DOM mentah disimpan pada `responsive-metrics.json`; browser dapat menghasilkan nilai pecahan akibat skala tampilan. Tidak ada nilai pecahan yang dibulatkan dalam file tersebut.

## Kontras dan dasar teknis

Rasio dihitung memakai luminans relatif sRGB sesuai [WCAG 2.2 Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Angka berikut dibulatkan ke dua angka desimal:

| Pasangan warna | Rasio |
| --- | --- |
| Teks tombol `#293622` / sage `#B5C4A9` | 6.95:1 |
| Teks isi `#303B2B` / putih | 11.76:1 |
| Teks sekunder `#65705F` / ivory `#F8F9F5` | 4.92:1 |
| Teks sekunder `#65705F` / header `#EDF1E8` | 4.55:1 |
| Teks sage tua `#56694B` / putih | 5.97:1 |

Pemilihan viewport sempit mengacu pada [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Struktur pesan mengikuti batas konten [elemen paragraf HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/p). Pemeriksaan ini berfokus pada bagian yang diubah; bukan audit WCAG menyeluruh.

## Artefak dan batas pemeriksaan

- [Pembuka mobile](mobile-welcome.jpg)
- [Percakapan mobile](mobile-conversation.jpg)
- [Percakapan ukuran screenshot pengguna](screenshot-size-conversation.jpg)
- [Layar sempit](narrow-conversation.jpg)
- [Percakapan desktop](desktop-conversation.jpg)
- [Pembuka desktop](desktop-welcome.jpg)
- ZIP runtime: `../plugin-live-chat-2.7.9.zip`, berisi bundle hasil build.

Belum diterapkan ke website produksi. Tema/cache WordPress produksi, Safari/iOS fisik, dan koneksi AI/WooCommerce produksi belum diuji pada pengerjaan ini. Langkah pemasangan berikutnya adalah memperbarui plugin menggunakan ZIP 2.7.9 dan memeriksa chat pada website yang terpasang.

Ulangi preview dengan `npm run preview`, buka `http://127.0.0.1:4173`, lalu pilih “Tanya Shinyoung”.
