# Talkademic AI v0.3 — Panduan penerbitan aplikasi sebenar

*Dahulu dikenali sebagai ThesTalk. Ditukar nama kepada Talkademic (v1.3) kerana aplikasi kini merangkumi sembang harian, paper jurnal dan rujukan, bukan tesis sahaja. Data yang telah disimpan tidak terjejas.*

**Status:** Sumber aplikasi PWA telah siap, tetapi tiada URL awam yang berjaya diterbitkan. Sambungan GitHub dan Vercel dalam ChatGPT menolak operasi cipta/tulis dengan ralat **403 Forbidden** pada 15 November 2026. Jangan tersalah anggap ZIP ini sebagai aplikasi yang telah dilancarkan.

## 1. Masukkan kod ke GitHub

Repo milik anda: https://github.com/akmahalili/Talkademic

1. Ekstrak `ThesTalk_PWA_Installable_v0.3.zip`.
2. Upload semua kandungan **dalam folder** `ThesTalk_PWA_Deploy` ke root repositori (fail `index.html`, `app.js`, folder `api/`, `lib/`, dll). Jangan muat naik `.env` yang mempunyai kunci.
3. Commit perubahan ke branch `main`.

## 2. Terbitkan URL

1. Buka https://vercel.com/new menggunakan akaun anda.
2. Pilih `Import Git Repository` dan repo `akmahalili/Talkademic`.
3. Pilih framework **Other**, root directory `./`, kemudian Deploy.
4. Buka URL HTTPS `.vercel.app` yang Vercel berikan. Ia akan berfungsi sebagai aplikasi penulisan tempatan (AI masih belum diaktifkan).

## 3. Aktifkan AI sebenar

Di Vercel Project Settings > Environment Variables, tetapkan **secara rahsia** sekurang-kurangnya satu kunci AI (jangan commit ke GitHub):

- `GEMINI_API_KEY`: Google Gemini, ada peringkat percuma (lalai)
- `ANTHROPIC_API_KEY`: Claude, guna kredit API dari https://platform.claude.com
- `OPENAI_API_KEY`: ChatGPT, guna kredit API dari https://platform.openai.com
- `THESTALK_AI_ACCESS_CODE`: kod unik panjang sekurang-kurangnya 12 aksara yang anda cipta, **bukan** API key
- `OPENAI_MODEL` / `CLAUDE_MODEL` / `GEMINI_MODEL`: pilihan, model yang hendak dicuba dahulu

**Pilih AI (v0.7):** setiap kunci menghidupkan AI itu. Pengguna memilih di **Tetapan → Pilih AI** atau butang **✦** di bar atas. Langganan Claude Pro dan ChatGPT Plus tidak termasuk API; plan Claude Max/Team dan ChatGPT Pro/Business ada kredit API bulanan yang perlu dituntut. Rujukan tetap dicari dalam OpenAlex, apa pun AI yang dipilih.

Redeploy selepas menambah konfigurasi. Pada laman aplikasi, tekan `Connect AI` dan masukkan *access code* tadi. Bila lulus, status bertukar menjadi `AI connected`. Tanpa kedua-dua tetapan ini, aplikasi dengan sengaja **tidak** mendakwa menghasilkan teks AI.

## 3b. Aktifkan rujukan jurnal sebenar (v0.4, percuma)

Ciri **📚 Find real references** mencari kertas kajian sebenar di OpenAlex dan memetiknya dalam format APA 7. AI hanya boleh memetik kertas yang betul-betul ditemui, jadi tiada rujukan rekaan.

1. Daftar akaun percuma di https://openalex.org, kemudian salin kunci anda di https://openalex.org/settings/api.
2. Di Vercel → Project Settings → Environment Variables, tambah `OPENALEX_API_KEY` dengan kunci tadi.
3. Redeploy.
4. Dalam aplikasi, tandakan **📚 Find real references** (dan **2015 onwards only** jika mahu kajian terkini) sebelum menukar idea.

Kunci percuma memberi kira-kira $1 penggunaan OpenAlex sehari, iaitu lebih kurang 300 penukaran berujukan. Had harian ditetapkan semula pada 8 pagi waktu Malaysia. Rujukan yang dipetik disimpan dalam **📚 References** di bar sisi dan ditambah sebagai senarai Rujukan/References di hujung fail DOCX. AI hanya membaca abstrak, jadi semak setiap kertas sebelum hantar.

## 4. Pasang pada Android

Dalam Chrome, buka URL HTTPS aplikasi → menu ⋮ → **Add to Home screen** / **Install app**. PWA akan muncul seperti aplikasi berikon pada telefon. Pemasangan bergantung pada sokongan pelayar.

## 5. Had penting

- Sembang, bab, dan kandungan tesis disimpan dalam localStorage telefon/pelayar **sahaja**. Belum ada log masuk/cloud sync antara peranti.
- Sentiasa eksport DOCX sebagai sandaran.
- API memerlukan kod akses dan mempunyai had asas, tetapi belum menyediakan sistem akaun individu, kuota berpusat, atau billing per-user. Jangan buka akses AI tanpa kawalan.
- Bukti akademik, sitasi, dan dapatan penyelidikan mesti disemak oleh pengguna.
- `npm test` dan `npm run check` telah diuji; ujian pelayar headless tidak dapat diselesaikan kerana persekitaran menolak akses localhost/file melalui Chromium (`ERR_BLOCKED_BY_ADMINISTRATOR`).

## Backup & pulih (v0.8)

Semua kerja disimpan dalam pelayar sahaja. Untuk elak kehilangan atau untuk pindah ke peranti lain:

1. Pergi ke **Tetapan → Backup & pulih** dan tekan **Simpan backup**. Fail `Talkademic-backup-…json` akan dimuat turun. Di Android, butang **Kongsi** boleh hantar fail terus ke Google Drive atau WhatsApp.
2. Di peranti lain, buka Talkademic dan tekan **Pulih dari fail**, kemudian pilih fail tadi. App akan tunjuk tajuk, bilangan bab, perkataan dan rujukan sebelum menggantikan projek.
3. Tersilap pilih fail? Tekan **↶ Batalkan pemulihan terakhir** (tersedia selama 7 hari).

Kod akses AI tidak disimpan dalam fail backup. Masukkan semula kod di peranti baharu. Papan pemuka akan mengingatkan anda jika belum backup lebih 7 hari.

## Jurnal & Paper (v0.9)

Untuk artikel jurnal (berasingan daripada tesis). Buka dari kad **Jurnal & Paper** di Utama, menu Akademik, atau **Projek Saya**.

1. **Tulis**: isi tajuk dan bahagian Abstrak hingga Kesimpulan. Guna **Tulis dengan rujukan sebenar** untuk menjana perenggan bersitasi daripada kajian sebenar. Eksport ke DOCX bila siap.
2. **Jurnal sasaran**: tekan **Cari jurnal sesuai**. Talkademic cari jurnal yang sudah menerbitkan kajian serupa dan tunjuk h-index, impak 2 tahun, akses terbuka/APC serta senarai seperti CWTS Core, ABDC dan SINTA. Tekan **Semak kuartil (Scimago)** untuk sahkan Q1–Q4 dan status Scopus, kemudian **Pilih sebagai sasaran**.
3. **Abstrak & tajuk**: jana abstrak berstruktur, lima pilihan tajuk dan kata kunci.
4. **Semak kesediaan**: semakan pantas (tanpa AI) dan semakan AI yang menyenaraikan apa perlu dibaiki, ikut keutamaan, untuk jurnal sasaran.

Semua nombor jurnal datang daripada OpenAlex, bukan AI. Impak 2 tahun bukan Impact Factor rasmi. Hantar hanya melalui laman rasmi jurnal.

## Sembang → Paper penuh (v1.0)

Dalam **Jurnal & Paper → Tulis**, kad **Sembang → Paper penuh**:

1. Taip idea secara santai, satu demi satu, dan tekan Enter atau **Tambah**. Boleh juga guna 🎙 atau **Ambil dari sembang** untuk mengambil ayat daripada Sembang.
2. Tekan **Jana paper penuh dengan rujukan**. Talkademic menyusun idea ikut bahagian jurnal, mencari kajian sebenar di OpenAlex, kemudian menulis Pengenalan hingga Kesimpulan serta abstrak dan kata kunci, dengan sitasi APA dimasukkan secara automatik. Ia mengambil masa kira-kira 30–60 saat.
3. Isi sendiri tanda seperti [PERLU RUJUKAN], [SAIZ SAMPEL] dan [DAPATAN 1]. AI tidak mereka data. Semak kesediaan akan mengira tanda yang masih ada.
4. Tak puas hati? Tekan **↶ Kembalikan draf sebelum jana**.

Semak setiap sitasi sebelum hantar, dan nyatakan penggunaan AI jika jurnal memintanya.

## Perhalusi dengan ChatGPT / Claude (v1.1, percuma guna langganan anda)

Di bawah setiap bahagian paper (tab Tulis):

1. Pilih **Arahan**, contohnya *Perhalusi untuk jurnal Q1–Q2*, *Kembangkan hujah*, *Ringkaskan*, *Semak tatabahasa* atau *Terjemah*.
2. Tekan **ChatGPT** atau **Claude**. Teks berserta arahan disalin, dan app dibuka. Jika kotak taip kosong, tekan lama dan pilih **Tampal**, kemudian hantar.
3. Salin jawapan, kembali ke Talkademic, tekan **📋 Tampal hasil**, kemudian pilih **Ganti bahagian** atau **Tambah di bawah**. Tersilap? Tekan **↶ Batal perubahan**.
4. Jika jawapan mengandungi sitasi yang tiada dalam senarai rujukan paper, Talkademic akan beri amaran supaya anda semak (ChatGPT dan Claude kadang-kadang menambah rujukan sendiri).

Di tab **Semak kesediaan**, butang **Minta penilaian ChatGPT / Claude** menghantar seluruh paper untuk dinilai seperti penilai jurnal.

## Import DOCX (v1.5)

Fail Word dibaca terus di peranti dan tidak dimuat naik ke mana-mana.

- **Paper:** Jurnal & Paper → **📄 Import DOCX**. Satu paper baharu dicipta. Tajuk, Abstrak hingga Kesimpulan, kata kunci dan senarai rujukan dikenal pasti secara automatik, dalam BM atau English, sama ada dokumen guna gaya Heading Word ataupun tajuk bernombor atau huruf besar seperti "1.0 PENGENALAN".
- **Tesis:** Projek → **📄 Import DOCX**. BAB/CHAPTER menjadi bab, dan 1.1, 1.2 menjadi sub-bahagian. Rujukan dimasukkan ke senarai rujukan tesis. Jika tesis sedia ada akan diganti, app akan bertanya dahulu dan menyimpan salinan untuk dibatalkan.
- Fail **.doc** lama perlu disimpan semula sebagai **.docx** dalam Word.

## Analisis Data (v1.7)

Akademik → **Analisis Data**.

1. Pilih jenis analisis (atau biar "Kenal pasti sendiri") dan bahasa tulisan.
2. Tampal output SmartPLS (Copy to clipboard) atau SPSS (klik kanan jadual → Copy), atau buka fail .csv / .txt / .html.
3. Tulis hipotesis jika ada, kemudian tekan **Analisis**.

Talkademic memberi: penerangan ringkas, semakan ambang (✓ lulus, ✗ tidak lulus, ? semak), jadual keputusan dan bahagian Dapatan gaya APA yang boleh disunting. Sitasi hanya daripada sumber kaedah yang telah disahkan (contohnya Hair et al., 2019; Henseler et al., 2015). Angka diambil terus daripada output; jika tiada, ditanda [NILAI?]. Hasil boleh disalin, dimasukkan ke bahagian Dapatan paper, atau ke bahagian tesis semasa bersama rujukannya.

## Matriks Literatur (v1.8)

Akademik → **Matriks Literatur**.

1. Tulis topik kajian anda (untuk lajur Kaitan) dan pilih bahasa matriks.
2. Tekan **Tambah PDF** dan pilih satu atau beberapa artikel. Teks dibaca dalam telefon; fail PDF tidak dimuat naik.
3. Setiap artikel menjadi satu baris: konteks, teori, kaedah, sampel, analisis, dapatan, jurang/limitasi dan kaitan. Rujukan disahkan di OpenAlex ("✓ Disahkan OpenAlex"); jika tidak dijumpai, ditanda "Semak rujukan".
4. Ketik mana-mana sel untuk menyunting. PDF imbasan (gambar) tiada teks, jadi guna **Tampal teks**.
5. **Muat turun Excel** untuk fail .xlsx, atau **Tambah semua ke rujukan tesis**.
6. **Sintesis & cari jurang** memberi tema, jurang kajian dan petikan tinjauan literatur bersitasi APA yang boleh dimasukkan ke tesis atau paper.

## Import rujukan RIS / BibTeX (v1.9)

Perpustakaan → **Import RIS / BibTeX** (atau dalam Rujukan paper).

- Mendeley / Zotero / EndNote: pilih rujukan → Export → RIS atau BibTeX.
- Google Scholar: tekan Cite → BibTeX, simpan sebagai fail .bib.

Setiap rujukan ditukar ke format APA 7 (artikel jurnal, buku, bab buku, prosiding, tesis, laman web). Rujukan yang sudah ada (DOI atau tajuk sama) tidak ditambah dua kali.

## Sasaran & Peringatan (v2.0)

Kad di halaman Utama menunjukkan perkataan hari ini berbanding sasaran, streak 🔥 dan tarikh akhir terdekat. Ketik kad itu (atau Akademik → Sasaran & Peringatan) untuk:

- Tetapkan sasaran perkataan harian (lalai 500). Perkataan dikira daripada pertambahan teks dalam tesis dan paper hari ini.
- Tambah tarikh akhir (contoh: hantar Bab 2, viva). Tekan **📅 Kalendar** untuk masukkan ke kalendar telefon; notifikasi seminggu dan sehari sebelum, jam 9 pagi.
- **Peringatan menulis harian**: pilih masa, tekan **Tambah ke kalendar telefon**, buka fail itu dan pilih Tambah/Simpan.

## Slaid Pembentangan (v2.1)

Akademik → **Slaid Pembentangan**.

1. Pilih sumber (seluruh tesis, satu bab, atau paper), jenis pembentangan (proposal, viva, persidangan, laporan kemajuan, kuliah), masa dan bahasa.
2. Tekan **Jana slaid**. Setiap slaid ada cadangan gambar dan nota penyampai.
3. Ketik teks untuk sunting. Tekan **🖼 Tambah gambar** untuk letak gambar sendiri dari telefon (gambar disimpan dalam peranti ini sahaja).
4. Susun semula dengan ↑ ↓, buang dengan ×.
5. **Tema reka bentuk** (v2.5): pilih Klasik, Galeri, Bilik Gelap, Tropika, Neon atau Pastel, atau tekan 🎲 Rawak. Tema boleh ditukar bila-bila masa dan mengubah pratonton serta fail PowerPoint.
6. **Muat turun PowerPoint**: fail .pptx dengan nota penyampai, dan slaid rujukan untuk sumber yang disebut dalam slaid.

## Audit Sitasi (v2.6)

Akademik → **Audit Sitasi**. Pilih tesis atau satu paper jurnal, kemudian tekan **Audit sekarang**. App akan semak:

1. **Sitasi tanpa rujukan**: nama dalam teks yang tiada dalam senarai rujukan (atau ejaan/tahun berbeza).
2. **Tahun tidak sepadan**: contoh Smith (2018) dalam teks tetapi 2019 dalam senarai.
3. **Rujukan tidak disitasi**: ada dalam senarai tetapi tidak disebut dalam teks. Boleh tekan **Buang**.
4. **Pengarang dan tahun sama**: perlu huruf a/b (2019a, 2019b).
5. **Gaya APA 7**: et al. untuk 3 pengarang ke atas, bukan untuk 2 pengarang.
6. **DOI**: disemak dengan OpenAlex. DOI yang salah ditanda; rujukan tanpa DOI diberi cadangan DOI, tekan **Tambah DOI**.

Tekan **Buka** untuk terus ke bahagian yang bermasalah. Semakan ini percuma dan tidak guna AI.

## Sync telefon ↔ laptop (v2.2)

Profil → **Sync telefon ↔ laptop**. Tiada akaun diperlukan.

1. Di telefon: tekan **🔐 Cipta kod sync**. Salin kod 16 aksara itu.
2. Di laptop: buka Talkademic, masukkan kod akses AI seperti biasa, kemudian Profil → masukkan kod sync → **Sambung**. Data dari telefon akan dimuatkan.
3. Dengan **Sync automatik**, perubahan dihantar sendiri dan versi terkini diambil bila app dibuka.
4. Jika kedua-dua peranti diubah serentak, app akan tanya versi mana yang mahu disimpan. Versi lama boleh dikembalikan dengan **Batalkan pemulihan** di kad Backup.

Data disulitkan dalam peranti sebelum dihantar. Simpan kod sync seperti kata laluan: sesiapa yang ada kod boleh membaca data anda, dan kod yang hilang tidak boleh dipulihkan. Gambar slaid dan kod akses AI tidak disync.

