# ThesTalk AI v0.3 — Panduan penerbitan aplikasi sebenar

**Status:** Sumber aplikasi PWA telah siap, tetapi tiada URL awam yang berjaya diterbitkan. Sambungan GitHub dan Vercel dalam ChatGPT menolak operasi cipta/tulis dengan ralat **403 Forbidden** pada 15 November 2026. Jangan tersalah anggap ZIP ini sebagai aplikasi yang telah dilancarkan.

## 1. Masukkan kod ke GitHub

Repo milik anda: https://github.com/akmahalili/ThesTalk

1. Ekstrak `ThesTalk_PWA_Installable_v0.3.zip`.
2. Upload semua kandungan **dalam folder** `ThesTalk_PWA_Deploy` ke root repositori (fail `index.html`, `app.js`, folder `api/`, `lib/`, dll). Jangan muat naik `.env` yang mempunyai kunci.
3. Commit perubahan ke branch `main`.

## 2. Terbitkan URL

1. Buka https://vercel.com/new menggunakan akaun anda.
2. Pilih `Import Git Repository` dan repo `akmahalili/ThesTalk`.
3. Pilih framework **Other**, root directory `./`, kemudian Deploy.
4. Buka URL HTTPS `.vercel.app` yang Vercel berikan. Ia akan berfungsi sebagai aplikasi penulisan tempatan (AI masih belum diaktifkan).

## 3. Aktifkan AI sebenar (pilihan, berbayar)

Di Vercel Project Settings > Environment Variables, tetapkan **secara rahsia**:

- `OPENAI_API_KEY`: kunci OpenAI API milik anda (jangan kongsi dalam chat, jangan commit ke GitHub)
- `THESTALK_AI_ACCESS_CODE`: kod unik panjang sekurang-kurangnya 12 aksara yang anda cipta, **bukan** API key
- `OPENAI_MODEL`: secara pilihan `gpt-4.1-mini` atau model lain yang akaun API boleh gunakan

Redeploy selepas menambah konfigurasi. Pada laman aplikasi, tekan `Connect AI` dan masukkan *access code* tadi. Bila lulus, status bertukar menjadi `AI connected`. Tanpa kedua-dua tetapan ini, aplikasi dengan sengaja **tidak** mendakwa menghasilkan teks AI.

## 4. Pasang pada Android

Dalam Chrome, buka URL HTTPS aplikasi → menu ⋮ → **Add to Home screen** / **Install app**. PWA akan muncul seperti aplikasi berikon pada telefon. Pemasangan bergantung pada sokongan pelayar.

## 5. Had penting

- Sembang, bab, dan kandungan tesis disimpan dalam localStorage telefon/pelayar **sahaja**. Belum ada log masuk/cloud sync antara peranti.
- Sentiasa eksport DOCX sebagai sandaran.
- API memerlukan kod akses dan mempunyai had asas, tetapi belum menyediakan sistem akaun individu, kuota berpusat, atau billing per-user. Jangan buka akses AI tanpa kawalan.
- Bukti akademik, sitasi, dan dapatan penyelidikan mesti disemak oleh pengguna.
- `npm test` dan `npm run check` telah diuji; ujian pelayar headless tidak dapat diselesaikan kerana persekitaran menolak akses localhost/file melalui Chromium (`ERR_BLOCKED_BY_ADMINISTRATOR`).
