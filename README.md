# Talkademic AI — Installable PWA

*Formerly ThesTalk. Renamed to Talkademic in v1.3 because the app now covers everyday chat, journal papers and references, not only theses. Internal storage keys and API headers keep the old `thestalk` prefix so saved work and installed copies keep working.*

**Just Talk. Build Your Thesis.**

**v0.5 — Sembang • Belajar • Menyelidik.** New dashboard with Chat (casual) and Academic modes, a desktop sidebar and a mobile bottom bar, light and dark themes, a Bahasa Malaysia / English interface, first-run onboarding (language, name, mode), Casual Chat, Proofread & Style, a Projects page, a References library and local search across chats, thesis sections and references. Everything stays in the browser; there is no account system yet, so the design's sign-in screens and Data Analysis (SPSS) are not included (the SPSS tile is marked "Coming soon").

A responsive, installable web application for voice/text brainstorming, thesis chapter management, academic conversion, version history and real editable DOCX export. Browser storage is **local-only**: it does not synchronize between devices.

## Deploy to Vercel (from GitHub)

1. Push **these folder contents** into the repository root at https://github.com/akmahalili/Talkademic (keep `.env` out of Git).
2. In Vercel, **Add New → Project → Import Git Repository → `akmahalili/Talkademic` → Deploy**. Choose framework **Other** if prompted. The app has static assets in `public/` and one serverless function, `api/[route].js`, which serves every `/api/<name>` route from `handlers/<name>.js` (the free Hobby plan allows only 12 functions per deployment).
3. It will have an HTTPS `*.vercel.app` link. On Android Chrome, use **⋮ → Add to Home screen / Install app** for an app icon and standalone experience.
4. For **actual AI**, go to Vercel → Project → Settings → Environment Variables and configure the following **directly in Vercel**, not in source code:
   - At least one AI key: `GEMINI_API_KEY` (free), `ANTHROPIC_API_KEY` (Claude, paid) or `OPENAI_API_KEY` (ChatGPT, paid). Keep keys private.
   - `THESTALK_AI_ACCESS_CODE` — a **unique randomly generated code of at least 12 characters**. **Do not use your API key** as the access code. Share only with trusted users.
   - `OPENAI_MODEL` / `CLAUDE_MODEL` / `GEMINI_MODEL` — optionally set a model to try first (defaults below).
   - `OPENAI_TRANSCRIPTION_MODEL` — optionally set a supported transcription model; default `gpt-4o-mini-transcribe`.
   - `OPENALEX_API_KEY` — free key from https://openalex.org/settings/api, needed for **Find real references** (see below).
5. Redeploy after adding environment variables. In the app, press **Connect AI**, enter the access code and verify the badge changes to **AI connected**.

## Free AI option (Gemini)

Set `GEMINI_API_KEY` (free key from https://aistudio.google.com/apikey) instead of `OPENAI_API_KEY`. Talkademic then uses Google's OpenAI-compatible Gemini endpoint with `gemini-3.5-flash-lite`, moving to `gemini-3.1-flash-lite` when a model is busy, missing or over its limit (set `GEMINI_MODEL` to try another model first). On the free tier the Flash-Lite models allow about 500 requests a day each, while Gemini Flash allows only about 20, which is why Flash-Lite is the default. Each conversion with references uses two requests. The free tier has rate limits, and Google may use free-tier data to improve its products, so avoid pasting confidential data. Voice transcription also runs on Gemini (the browser recording is sent as-is), so the mic works for free; without any AI key the app falls back to the browser's speech recognition. The access code is remembered on the device after a successful unlock.

## University thesis formats (v3.2)

Academic → **Format Tesis Universiti**. Choose the university first. Each format is a profile in `public/thesisprofiles.js`, taken from the guideline the university publishes online (the screen links it, with notes on what to confirm where the guideline is silent or inconsistent):

| Sector | Universities |
|---|---|
| Public | UiTM, UM, UKM, USM, UPM, UTM, UTHM, UMS, UPSI, UNIMAS, UniMAP, UIAM/IIUM, UUM, UMK |
| Private | MMU, UNITEN, UCSI |
| Other | **Universiti lain (tetapan sendiri)**: university name, margins, font and size, line spacing, indent, space after paragraphs, page-number position, hidden number on chapter openings, chapter numbering (1, I, ONE) and heading layout, abstract order, title-page statement |

No current guideline was found online for USIM, UMT, UPNM, UTeM, UniSZA or UMPSA; their students use the custom profile with the official template.

A profile sets the margins, font, size and line spacing, paragraph indent (all, all but the first after a heading, none), space after paragraphs, page-number position, size and distance (bottom centre, bottom right, top right; optionally hidden on the first page of each chapter, which puts every chapter in its own section), chapter heading (`CHAPTER 1` / title, `CHAPTER 1: TITLE`, `CHAPTER I`, `CHAPTER ONE`, `BAB SATU`), capitalised section headings, the order of the preliminary pages (approval, declaration, thesis status form, permission to use, copyright, abstracts, acknowledgement, contents, lists, abbreviations), the declaration (the university's own text with name, matric number, signature and date fields, or a highlighted placeholder where a signed official form goes), abstracts (thesis language first, Malay first, English first or English only; title above the abstract, the translated title, keywords, UPM's header block, the IIUM Arabic abstract page), caption positions, the references heading (REFERENCES, REFERENCE, BIBLIOGRAPHY), its alignment and spacing, and the title-page lines with their sizes and spacing. The title page fills the page in the proportions the guideline shows.

The form adds the fields a profile needs: keywords and kata kunci (UM), the title in the second language (for the translated abstract), and the chairman of the supervisory committee (UPM). Formats saved before v3.2 open as UiTM.

### UiTM (v3.1)

Fill in the preliminary pages (type: thesis or mixed-mode dissertation, name, student ID, degree, programme, faculty, month and year, abstract and abstrak with word counts against the 200/250-word minimums, acknowledgement, list of abbreviations with **Find in the thesis**, author's profile, and optionally the Confirmation by Panel of Examiners for the final copy), then download the whole thesis as a Word file built by `public/thesisdocx.js` from the IPSis *Guidelines on Thesis/Dissertation Format* (2026): A4, left margin 3.8 cm and 2.5 cm elsewhere; Times New Roman 12 pt, 1.5 spacing, justified with a first-line indent; page numbers centred at the bottom in lowercase Roman for the preliminary pages (title page counted, not shown) and Arabic from Chapter 1; title page lines and sizes as in Appendix D; author's declaration text and fields as in Appendix F; single-spaced one-paragraph abstract (both abstracts, Malay first, for a Malay thesis); table of contents, list of tables, list of figures and list of abbreviations as Word fields (pre-filled with estimated page numbers; Word updates them on opening); chapter openings as `CHAPTER n` / title, centred, 14 pt bold; headings 1.1 and 1.1.1 bold, 1.1.1.1 bold italic; caption lines such as `Table 4.1: …` and `Figure 2.1: …` in Title Case, tables above and figures below, collected into the lists; tab-separated lines as tables with horizontal rules only; the framework figure in a closed box; review markers highlighted; REFERENCES left-aligned 14 pt bold with a ½-inch hanging indent and italic journal and volume where the reference knows its journal. Malay theses get Malay headings (BAB, ABSTRAK, PENGHARGAAN, ISI KANDUNGAN, RUJUKAN); their title-page and declaration wording is translated from the English template and should be checked with the faculty.

## Similarity check before Turnitin (v3.0)

Academic → **Semak Persamaan**. Choose the thesis or a paper. `POST /api/similarity` (`mode: sources`) fetches the abstracts of the works in its reference list from OpenAlex (by DOI in batches, by title for up to 15 without a DOI). `public/similaritycore.js` then finds runs of 8 or more identical words (6-word shingles) between the text and each abstract, and optionally the student's other papers in the app; in-text citations, quotations in quotation marks and the reference list are ignored, the way a Turnitin report is usually filtered. It shows the share of matching words, each matching sentence with the copied words marked and its source, the share per source, and passages of 15 or more words repeated between two sections of the same document. **Suggest a paraphrase** (`mode: paraphrase`) rewrites one sentence and is refused if a citation or number is lost; the before/after overlap is shown, and **Use this sentence** replaces it in the section (with an undo copy in the thesis history). The check only sees abstracts, not full texts or the web, so it is a first pass, not a Turnitin score.

## Viva practice (v2.9)

Academic → **Latihan Viva**. Choose the thesis or a paper, the session (proposal defence, final viva, conference Q&A), the examiner (supportive, balanced, tough external examiner), the number of questions and the language. `POST /api/viva` (`mode: questions`) reads the document and writes questions about this study across areas (contribution, problem and gap, literature, theory, method, sample and instrument, analysis, findings, limitations, implications), each with what the examiner is testing and the key points of a strong answer (flagging points the document does not cover). Questions can be read aloud with the browser's speech voices; answers are typed or spoken with the shared microphone, with a timer. `mode: feedback` scores each answer 1–5 against the key points and the section it came from, lists strengths and what was missing, gives a model answer built only from the document, and asks a follow-up question that can be answered too. The summary shows the average and per-area scores, the weakest answers, a retry of weak questions, and saves the whole session as a Word file. The last 12 sessions are kept in the history.

## Survey analysis (v2.8)

Academic → **Analisis Soal Selidik** (also linked from Data Analysis). Open the questionnaire CSV (Google Forms: Responses → Sheets → File → Download → CSV). `public/surveycore.js` parses it in the browser (quotes, line breaks, `,` `;` or tab), guesses each column (ignore, demographic, number, Likert item, open text; timestamps, e-mails and names are ignored), reads numbers and Malay/English 5- and 7-point labels, and groups items into constructs from Google Forms grid titles (`Konstruk [item]`) or code prefixes (`KP1`, `KP2`). Every guess can be changed, items can be reverse-coded, and constructs renamed. It computes the respondent profile, Cronbach's alpha with corrected item-total correlations and alpha if item deleted, construct and item means and SDs with low/moderate/high levels, skewness and kurtosis (SPSS formulas), and Pearson correlations with two-tailed p (checked against NumPy/SciPy in the tests). Results come as tables (copy to Word, or one Excel file), charts (PNG), coded data (CSV for SPSS/SmartPLS), and a Results write-up generated only from the numbers, with `[PERLU RUJUKAN]` where a method citation belongs. **Polish with AI** (`POST /api/survey`) sends only that text, and the polish is refused if any number or marker changes. Respondent data never leaves the device; files over about 700 KB are kept in memory only.

## Conceptual framework (v2.7)

Academic → **Kerangka Konseptual**. Add constructs with a role (independent, mediator, moderator, dependent, control) and optional dimensions, then the arrows between them (positive or negative) and which path each moderator moderates; **Connect automatically** links IV → mediator → DV and IV → DV. **Suggest with AI** (`POST /api/framework`) proposes constructs and paths from the thesis title, objectives, research questions and first chapters, or from a paper, using only what the text names. `public/frameworkcore.js` numbers the hypotheses (direct paths, then mediation X → M → Y when switched on, then moderation) in Malay or English and draws the figure as SVG in a black-and-white thesis style or in colour; the figure downloads as PNG. **Add figure + hypotheses** puts the line `[Rajah: Kerangka Konseptual]`, a numbered caption and the hypotheses into the chosen thesis section (or a paper's Literature Review), and the Word export (`public/docx.js`) replaces that line with the figure as an embedded picture. Presentation slides generated from the thesis use this framework on their framework slide.

## Citation audit (v2.6)

Academic → **Audit Sitasi**. Pick the thesis or one journal paper. In the browser, `public/citeaudit.js` reads every in-text citation (parenthetical with several works, page numbers and lead words such as *see* or *lihat*; narrative such as *Menurut Hair et al. (2019)*) and matches it with the reference list by first-author surname and year. It lists citations with no reference, year mismatches, references never cited, same author and year without a/b letters, and APA 7 slips (et al. needed for three or more authors, not allowed for two, et al. written in the list). Each finding names the section with an **Open** button; uncited references can be removed. `POST /api/audit` then checks DOIs through OpenAlex (no AI): a DOI that is not found, or whose title or year does not match, is flagged, and references without a DOI get a suggested DOI that can be added with one tap.

## Second free AI: Groq (v2.4)

Only AIs that are switched on appear in **Choose AI**, so Claude and ChatGPT (paid API) are hidden. Add `GROQ_API_KEY` (free tier at console.groq.com, no card; over the limit it returns 429, never a charge) to show **Groq** (GPT-OSS 120B, then Qwen 3.8 27B and GPT-OSS 20B). When Gemini's free limit is used up or Gemini is down, requests fall back to Groq automatically.

## Sync between devices (v2.2)

Profile → **Sync telefon ↔ laptop**. One device creates a 16-character sync code; the other types it in. No account is needed. The code never leaves the device: it derives the storage id (SHA-256) and the encryption key (PBKDF2, 210,000 rounds → AES-GCM 256), and the workspace (the same contents as a backup file) is gzipped and encrypted in the browser before `POST /api/sync` stores it in the project's private Vercel Blob store (`BLOB_READ_WRITE_TOKEN`, store `talkademic-sync`). Each push is a new version; the three newest are kept. A push based on an older version is refused (409) and the app asks which version to keep. With automatic sync on, changes are sent 15 seconds after the last edit and a newer version is fetched when the app opens, but only when this device has no unsent changes; pulling keeps an Undo restore copy. Slide pictures and the AI access code are not synced.

## Presentation slides (v2.1)

Academic → **Slaid Pembentangan**. Choose the source (whole thesis, one chapter or a paper), the type (proposal defence, viva, conference, progress report, class lecture), the length and the language. `POST /api/slides` returns an outline in fixed layouts (title, key statement, bullets, big numbers, conceptual framework, comparison, full picture, closing), each with a picture idea and speaker notes; numbers come only from the source. The preview is editable, and pictures added from the phone are resized and kept on the device in IndexedDB (not in the workspace or backups). Six design themes (Klasik, Galeri, Bilik Gelap, Tropika, Neon, Pastel; `public/slidethemes.js`) restyle the preview and the PowerPoint file, each with its own palette, Office-safe fonts and decorations; the theme can be switched any time or picked at random. Layouts include steps (process or timeline) and a key quote, and the AI is asked to vary layouts. **Download PowerPoint** builds the .pptx in the browser with PptxGenJS (vendored in `public/vendor/pptxgenjs`, MIT), adds a references slide for works cited on the slides, and puts the speaker notes in the notes pane.

## Goals & reminders (v2.0)

Home shows today's words against a daily target, the current streak and the nearest deadline; **Sasaran & Peringatan** (Academic) holds the settings. Today's words are the growth of the workspace (thesis, and papers if chosen) since the last count before today, so generated or imported text counts too. Deadlines show a countdown and download as calendar files (.ics) with alerts a week and a day before at 9 a.m.; the daily writing reminder is a repeating calendar event. The phone's own calendar delivers the notifications, so no account or push server is needed. Everything is stored in the workspace (`state.goals`) and included in backups.

## Import references (v1.9)

Library → **Import RIS / BibTeX**, and the same button under a paper's references. Files exported from Mendeley, Zotero, EndNote or Google Scholar are parsed in the browser by `public/refimport.js` (RIS tags, BibTeX braces, `@string` macros, LaTeX accents, corporate authors) and each entry gets an APA 7 reference (journal article, book with edition, chapter or proceedings with editors, thesis, web page). The thesis language decides "n.d." / "t.t." and the thesis label. Duplicates (same DOI or title) are skipped.

## Literature matrix (v1.8)

Academic → **Matriks Literatur**. Add article PDFs (several at once). The text is read in the browser with pdf.js (vendored in `public/vendor/pdfjs`, Apache-2.0), so the PDF itself is never uploaded; only its text goes to `POST /api/matrix` (mode `extract`). Long articles are trimmed to the opening plus the method, results, discussion and conclusion, and the reference list is dropped. Each article becomes one row: context, theory, method, sample, analysis, findings, gap/limitations and relevance to your topic. The reference is confirmed on OpenAlex by DOI or title (`findWork` in `lib/sources.js`); rows that cannot be confirmed are marked "Check reference". Scanned PDFs with no text can be handled with **Paste text**. Cells are editable, the matrix downloads as an .xlsx file, and all references can be added to the thesis. **Synthesise & find gaps** (mode `synth`) returns themes, research gaps and a literature-review passage that cites the studies in APA 7 through `lib/cite.js`.

## Data analysis (v1.7)

Academic → **Analisis Data**. Paste SmartPLS or SPSS output (or open a .csv, .txt or .html export), optionally list the hypotheses, and press Analyse. `POST /api/analysis` returns a plain-language explanation, threshold checks (pass / fail / check), a results table and an editable APA Results section. The write-up may cite only a fixed list of verified method sources in `lib/analysis.js` (Hair et al., 2019; Henseler et al., 2015; Fornell & Larcker, 1981; Kock, 2015; Hu & Bentler, 1999; and standard textbooks), rendered by `lib/cite.js`. Numbers come only from the pasted output; anything missing appears as `[NILAI?]` / `[VALUE?]`. The result can be copied, added to a paper's Results section or to the current thesis section, with its references merged. Uses the same free Gemini key.

## Import from Word (v1.5)

`public/docximport.js` reads a `.docx` entirely on the device (nothing is uploaded): the zip is unpacked with the browser's `DecompressionStream`, `word/document.xml` and `word/styles.xml` are parsed, and headings come from Word heading styles in any language (style names or outline levels) or, in files without styles, from short numbered (`1.0`, `2.1`), BAB/CHAPTER, ALL-CAPS or all-bold lines. Tables of contents, acknowledgements and appendices are skipped.

- **Jurnal & Paper → Import DOCX** creates a new paper: Abstract … Conclusion are recognised from English or Malay headings, sub-headings such as "3.2 Data analysis" stay inside their section, `Keywords:` / `Kata kunci:` and the reference list are picked up, author and affiliation lines are left out, and the paper language is detected.
- **Projects → Import DOCX** imports a thesis: level-1 headings (BAB 1, CHAPTER 2…) become chapters and level-2 headings (1.1, 1.2…) become sections; references are merged into the thesis reference list. It asks before replacing existing chapters and keeps an undo copy (Profile → Backup & restore → Undo last restore).
- Old `.doc` files get a clear message to save as `.docx` first.

## Chat-first papers (v1.4)

A paper now opens on **Chat**. Each casual remark (typed or spoken) goes to `POST /api/draft` mode `sort`, which returns the section it belongs to, the element it covers (for example *masalah kajian*), a formal academic sentence, and one follow-up question aimed at the parts of the paper that are still empty. An outline row counts ideas per section, and any bubble can be moved to another section. **Build the full paper** sends the tagged remarks with their formal sentences to the plan step, so concrete details (such as "300 buyers from Shopee and Lazada") survive into the Methodology. Section prompts ask for a set number of paragraphs and keep every detail the researcher gave.

## Tech look (v1.2)

`public/theme-tech.css` layers the owner's mockup style over `styles.css`: purple-to-indigo gradient on everything you press, glass surfaces, a faint dot-grid backdrop with soft violet and cyan light, and a cyan signal accent used sparingly. The hero has an original AI robot mascot (SVG symbol `#robot` with a mortarboard) over glowing signal waves; it floats and blinks, and stops under `prefers-reduced-motion`. Phones get the mockup's floating glass bottom bar (Utama · Sembang · Akademik · Projek · Profil), a new **Ruang Akademik** hub listing every academic tool, a mic in the home ask box, a new-paper button on Projects, and a profile header with an optional role in Settings.

## Refine with your own ChatGPT / Claude (v1.1)

No API and no extra cost: under each paper section the user picks an instruction (polish for Q1–Q2, expand, shorten, grammar only, translate) and taps **ChatGPT** or **Claude**. Talkademic copies a prompt that tells the model to keep every citation and placeholder and invent nothing, then opens `https://chatgpt.com/?q=…` or `https://claude.ai/new?q=…` (prefilled when the link is short enough; otherwise the user pastes once). **Paste result** brings the answer back to replace or append to the section, with one-step undo, and warns about author–year citations that are not in the paper's reference list. The readiness tab has the same hand-off for a whole-paper reviewer report.

## Chat → full paper (v1.0)

In **Jurnal & Paper → Write**, the *Sembang → Paper penuh* card collects casual remarks for the paper (typed, by voice, or imported from the chats). **Generate full paper with references** then runs `POST /api/draft` step by step, each step a short request inside the serverless time limit:

1. `mode: "plan"` — the AI sorts the remarks into IMRaD sections as formal points (inferred elements are marked "(cadangan)"), writes a working title, five evidence searches and one theory search; OpenAlex returns a pool of up to 24 real papers with abstracts.
2. `mode: "section"` × 6 — each section is written from its points, citing pool papers only by number; `lib/cite.js` turns numbers into APA 7 citations and drops unknown numbers. Results never cite and never invents numbers; missing details become placeholders such as `[SAIZ SAMPEL]`, `[DAPATAN 1]` or `[PERLU RUJUKAN]`.
3. `/api/paper` `meta` writes the structured abstract and keywords.

The previous draft is kept so it can be restored, and the readiness checklist counts placeholders still to fill. In a real run five casual Malay/English remarks became a ~2,100-word paper with 15 real references in about 35 seconds on the free Gemini tier (8 AI requests).

## Journal papers (v0.9)

**Jurnal & Paper** (home card, Academic menu, or My Projects) holds any number of journal articles next to the thesis, stored in the same workspace so they are saved and backed up with it.

- **Write**: IMRaD sections (Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion) with writing guidance, keywords, word counts, and *Write with real references* (same OpenAlex-backed `/api/cite` as the thesis). DOCX export.
- **Target journal**: `POST /api/journals`. The AI only turns the title/abstract into English search keywords; OpenAlex then finds recent articles like the paper, counts which journals published them, and returns each journal's real h-index, 2-year mean citedness, open access, APC, DOAJ and the lists OpenAlex records (CWTS Core, ABDC, FT50, ERIH PLUS, SINTA and others). OpenAlex has no Scopus/WoS or quartile data, so each journal links to Scimago to check the quartile.
- **Abstract & title**: `POST /api/paper` mode `meta` — structured abstract (purpose, method, findings, originality), five titles and six keywords in the paper's language, with placeholders instead of invented findings.
- **Readiness check**: an instant on-device checklist (empty sections, abstract and title length, keywords, references count and recency, target chosen), then `POST /api/paper` mode `fit` — reviewer-style verdict, scope fit and prioritised fixes for the chosen journal. Word and reference counts are computed by the server, not the model.

## Backup & restore (v0.8)

Everything lives in the browser's local storage, so **Settings → Backup & restore** saves the whole workspace (thesis, chats, references, display settings) as `Talkademic-backup-<title>-<date>.json`. On Android the **Share** button sends it straight to Drive or WhatsApp. **Restore from file** shows what the backup contains, asks before replacing the current project and keeps an undo copy for 7 days. The AI access code is never written to the file. The dashboard shows a reminder once there is work and no backup in the last 7 days. The file logic is in `public/backup.js` and tested in `tests/backup.test.js`.

## Choose AI: Gemini, Claude or ChatGPT (v0.7)

Each AI key switches that AI on. Users pick one in **Settings → Choose AI** or from the **✦ pill** in the top bar; the choice is saved on the device and sent with every request in the `X-ThesTalk-AI` header. If the chosen AI has no key, the server falls back to `AI_PROVIDER`, then Gemini, ChatGPT, Claude.

| AI | Key | Default model (fallback) | Cost |
|---|---|---|---|
| Gemini | `GEMINI_API_KEY` | `gemini-3.5-flash-lite` (`gemini-3.1-flash-lite`) | Free tier |
| Claude | `ANTHROPIC_API_KEY` | `claude-sonnet-5-5` (`claude-haiku-5-5`) | API credits from platform.claude.com |
| ChatGPT | `OPENAI_API_KEY` | `gpt-5.6-terra` (`gpt-5.4-mini`, `gpt-4.1-mini`) | API credits from platform.openai.com |

Claude Pro and ChatGPT Plus subscriptions do not include API usage. Claude Max/Team and ChatGPT Pro/Business plans include monthly API credits that can be claimed and linked to an API organization. Real references always come from OpenAlex, whichever AI writes the paragraph, and the server still drops any citation number that matches no retrieved paper. `/api/status` reports only which AIs are on (true/false), never the keys.

## Voice and export (v0.6)

- 🎙 Mic in Casual Chat and the thesis chat: speech is transcribed by Gemini (free) or OpenAI, mixing Bahasa Melayu and English. Optional "send right after I speak" in Settings → Voice.
- 🔊 Listen buttons on AI replies, the academic draft, the selected thesis section and proofread text, using the phone's built-in voices (Malay or English is picked automatically). Optional auto-read of replies.
- References library → **↓ RIS** and **↓ BibTeX** downloads for Mendeley, Zotero and EndNote (authors, journal, volume, issue, pages and DOI included for references found from v0.6 onwards).

## Real references (v0.4)

Tick **📚 Find real references** in the Academic Writing Assistant before converting an idea. Talkademic then:

1. turns the casual idea (BM, English or mixed) into three keyword searches;
2. searches [OpenAlex](https://openalex.org) for real papers that have abstracts (optionally 2015 onwards only);
3. asks the AI to write one paragraph that may cite those papers **only by number**;
4. converts the numbers into APA 7 citations on the server, removes any number that does not match a retrieved paper, and lists only the papers actually cited (with DOI links).

Claims that no retrieved paper supports stay marked `[SOURCE NEEDED]`. Inserting the draft adds its cited papers to **📚 References** in the sidebar, and **Export DOCX** appends them as a References (or Rujukan) list with hanging indents. The AI reads abstracts only, so users must still check each paper.

Setup: create a free OpenAlex account, copy your key from https://openalex.org/settings/api and add `OPENALEX_API_KEY` in Vercel → Settings → Environment Variables, then redeploy. A free key gives about $1 of OpenAlex usage per day (around 300 conversions with references, since each one runs three searches). Without a key, searches share a tiny allowance with everyone on the same server address and will usually fail. The endpoint is `POST /api/cite` (protected by the same access code as the other AI endpoints).

Until both secrets are configured, the app runs in transparent **AI not enabled** mode. Conversation, notes, thesis editor and DOCX export still function locally. The code is **not** a hosted SaaS multi-user account system. All users share an access code for AI; change it whenever access should be revoked. A robust public multi-user product will need actual authentication, durable database, budget/quotas, secure storage, audit logs and rate limiting beyond a single serverless instance.

**Important:** Do not put confidential thesis contents into an unlocked public shared device. Research material remains in that device's localStorage. The service worker caches only static app assets, not messages or AI API responses. Back up thesis contents by exporting DOCX.

## Local tests

```bash
npm run check
npm test
npm start
```

Visit http://127.0.0.1:3000. Requires Node.js 20+. The PWA installation experience needs an HTTPS deployment.

### Status

This source is ready for deployment but does **not** itself prove a Vercel deployment is live. The authorized tool calls to create a Vercel project and deployment currently returned **403 forbidden**. GitHub write access also returned **403**. The connected account owner must fix write/deployment permissions or manually import the repository.
