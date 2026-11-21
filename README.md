# ThesTalk AI — Installable PWA

**Just Talk. Build Your Thesis.**

**v0.5 — Sembang • Belajar • Menyelidik.** New dashboard with Chat (casual) and Academic modes, a desktop sidebar and a mobile bottom bar, light and dark themes, a Bahasa Malaysia / English interface, first-run onboarding (language, name, mode), Casual Chat, Proofread & Style, a Projects page, a References library and local search across chats, thesis sections and references. Everything stays in the browser; there is no account system yet, so the design's sign-in screens and Data Analysis (SPSS) are not included (the SPSS tile is marked "Coming soon").

A responsive, installable web application for voice/text brainstorming, thesis chapter management, academic conversion, version history and real editable DOCX export. Browser storage is **local-only**: it does not synchronize between devices.

## Deploy to Vercel (from GitHub)

1. Push **these folder contents** into the repository root at https://github.com/akmahalili/ThesTalk (keep `.env` out of Git).
2. In Vercel, **Add New → Project → Import Git Repository → `akmahalili/ThesTalk` → Deploy**. Choose framework **Other** if prompted. The app has root-level static assets and API serverless functions.
3. It will have an HTTPS `*.vercel.app` link. On Android Chrome, use **⋮ → Add to Home screen / Install app** for an app icon and standalone experience.
4. For **actual AI**, go to Vercel → Project → Settings → Environment Variables and configure the following **directly in Vercel**, not in source code:
   - At least one AI key: `GEMINI_API_KEY` (free), `ANTHROPIC_API_KEY` (Claude, paid) or `OPENAI_API_KEY` (ChatGPT, paid). Keep keys private.
   - `THESTALK_AI_ACCESS_CODE` — a **unique randomly generated code of at least 12 characters**. **Do not use your API key** as the access code. Share only with trusted users.
   - `OPENAI_MODEL` / `CLAUDE_MODEL` / `GEMINI_MODEL` — optionally set a model to try first (defaults below).
   - `OPENAI_TRANSCRIPTION_MODEL` — optionally set a supported transcription model; default `gpt-4o-mini-transcribe`.
   - `OPENALEX_API_KEY` — free key from https://openalex.org/settings/api, needed for **Find real references** (see below).
5. Redeploy after adding environment variables. In the app, press **Connect AI**, enter the access code and verify the badge changes to **AI connected**.

## Free AI option (Gemini)

Set `GEMINI_API_KEY` (free key from https://aistudio.google.com/apikey) instead of `OPENAI_API_KEY`. ThesTalk then uses Google's OpenAI-compatible Gemini endpoint with `gemini-3.5-flash-lite`, moving to `gemini-3.1-flash-lite` when a model is busy, missing or over its limit (set `GEMINI_MODEL` to try another model first). On the free tier the Flash-Lite models allow about 500 requests a day each, while Gemini Flash allows only about 20, which is why Flash-Lite is the default. Each conversion with references uses two requests. The free tier has rate limits, and Google may use free-tier data to improve its products, so avoid pasting confidential data. Voice transcription also runs on Gemini (the browser recording is sent as-is), so the mic works for free; without any AI key the app falls back to the browser's speech recognition. The access code is remembered on the device after a successful unlock.

## Tech look (v1.2)

`public/theme-tech.css` layers the owner's mockup style over `styles.css`: purple-to-indigo gradient on everything you press, glass surfaces, a faint dot-grid backdrop with soft violet and cyan light, and a cyan signal accent used sparingly. The hero has an original AI robot mascot (SVG symbol `#robot` with a mortarboard) over glowing signal waves; it floats and blinks, and stops under `prefers-reduced-motion`. Phones get the mockup's floating glass bottom bar (Utama · Sembang · Akademik · Projek · Profil), a new **Ruang Akademik** hub listing every academic tool, a mic in the home ask box, a new-paper button on Projects, and a profile header with an optional role in Settings.

## Refine with your own ChatGPT / Claude (v1.1)

No API and no extra cost: under each paper section the user picks an instruction (polish for Q1–Q2, expand, shorten, grammar only, translate) and taps **ChatGPT** or **Claude**. ThesTalk copies a prompt that tells the model to keep every citation and placeholder and invent nothing, then opens `https://chatgpt.com/?q=…` or `https://claude.ai/new?q=…` (prefilled when the link is short enough; otherwise the user pastes once). **Paste result** brings the answer back to replace or append to the section, with one-step undo, and warns about author–year citations that are not in the paper's reference list. The readiness tab has the same hand-off for a whole-paper reviewer report.

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

Everything lives in the browser's local storage, so **Settings → Backup & restore** saves the whole workspace (thesis, chats, references, display settings) as `ThesTalk-backup-<title>-<date>.json`. On Android the **Share** button sends it straight to Drive or WhatsApp. **Restore from file** shows what the backup contains, asks before replacing the current project and keeps an undo copy for 7 days. The AI access code is never written to the file. The dashboard shows a reminder once there is work and no backup in the last 7 days. The file logic is in `public/backup.js` and tested in `tests/backup.test.js`.

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

Tick **📚 Find real references** in the Academic Writing Assistant before converting an idea. ThesTalk then:

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
