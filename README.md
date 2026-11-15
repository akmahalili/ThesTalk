# ThesTalk AI

> **Just Talk. Build Your Thesis.**

**Working MVP (November 2026)** — a browser-based thesis-writing workspace where casual Malay/English conversations can be used as source ideas for academic drafts. The app has a polished responsive interface, editable chapter structure, local persistence, browser-based voice input where supported, and a **real DOCX export**.

## ⚡ Try it immediately (no installation)

Open **`ThesTalk_Prototype.html`** (included in this ZIP and also available separately) in Chrome, Edge, or another modern browser. You can chat, manage the thesis, create structured *local preview notes*, and export DOCX **without an API key**. The local preview is **not AI-generated prose**, and this is clearly labeled in the interface.

## Full AI conversion with your own API key

1. Install **Node.js 20 or newer**.
2. Unzip this project and open a terminal inside `ThesTalk_App`.
3. Configure `OPENAI_API_KEY` as a **server environment variable** (never paste it into frontend source code or GitHub).
4. Run `npm start` (no `npm install` needed; the server uses built-in Node modules only).
5. Open <http://127.0.0.1:3000>.
6. The academic conversion badge changes to **AI connected** if a key is configured.

**macOS / Linux:**
```bash
OPENAI_API_KEY='YOUR_KEY_HERE' npm start
```

**Windows PowerShell:**
```powershell
$env:OPENAI_API_KEY='YOUR_KEY_HERE'
npm start
```

You can choose an API-enabled model using `OPENAI_MODEL`. It defaults to `gpt-6-luna`, but your account must have access. API usage may incur charges.

## What currently works

- Create/reset a thesis workspace and configure project title, degree, university, ROs, RQs, methodology/theory context, drafting language, and citation style.
- Type and save chat messages, select any message to convert to a new academic draft.
- Optional real AI rewriting using the server-side OpenAI Responses API.
- Offline/local fallback prepares a **clearly labeled preliminary research note**, never misrepresents it as AI writing.
- Add chapters and sections, switch between sections, edit, save, and restore recent versions.
- Save local state automatically in the same browser (localStorage).
- Use speech-to-text in browsers that support SpeechRecognition, including BM/EN toggle; review transcription before sending.
- Export an editable `.docx` (ZIP/OpenXML) with thesis title, chapter headings, section headings, and body text.
- Responsive two-panel desktop UI and mobile tabs.

## Not implemented yet

There is **no account/login**, cloud sync, document upload, verified literature search, bibliographic manager, cross-device backup, institution-specific formatting, plagiarism detection, or production-ready collaboration. Citation style is profile metadata only. Word styling currently uses Times New Roman 12pt, 1.5 line spacing and 1-inch margins; these are NOT a verified UiTM or other university thesis template.

## Academic integrity and privacy

AI writing requires a human review. It does not invent scholarly citations or findings by design, but its outputs still need verification. If a claim needs evidence, mark it `[SOURCE NEEDED]` rather than fabricating an author/year citation. Uploaded studies and verified references are a future feature.

Content is stored in **localStorage** on the current device; private/incognito browsing, cleaning browser storage, and switching devices may delete or hide it. Export regularly. When using real AI, the selected idea, project metadata, and recent conversation snippets are sent to the configured external AI provider; avoid entering confidential data without approval.

The included local server is built for **single-user local development only**. Do not expose it publicly as-is: add authentication, rate-limits tied to authenticated users, CSRF protection, encryption, security monitoring, and appropriate data policy before production deployment. Keep `.env` and API keys out of your public GitHub repository.

## Project structure

```
ThesTalk_App/
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── server.js                 # Optional OpenAI proxy + static server
├── public/
│   ├── index.html           # App UI
│   ├── styles.css           # Responsive styling
│   ├── app.js               # Workspace logic / local persistence
│   └── docx.js              # Dependency-free DOCX writer
└── docs/
    ├── PRODUCT_REQUIREMENTS.md
    └── BUILD_PROMPT.md
```

## Next phase

Add auth + private database, upload/reference library, verified citations, more advanced editor, automatic thesis template formatting, and proper model cost controls and deployment.

## GitHub

Existing repository: <https://github.com/akmahalili/ThesTalk>

**Important:** These local project files are not yet pushed to GitHub. The GitHub integration returned a 403 error for writes. Upload the unzipped folder's contents to your repository, or push from your own local Git client.
