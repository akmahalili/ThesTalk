# ThesTalk AI — GitHub Copilot / Coding Agent Implementation Prompt

> Paste this into GitHub Copilot Chat, Cursor, Claude Code or another coding agent **while it is open inside the existing repository**. Attach `ThesTalk_AI_Product_Requirements.md` as the source of product requirements. This prompt does not assume any knowledge of the repository until it has been inspected.

## TASK

You are acting as a senior full-stack engineer, AI product architect and UX engineer. I already have a GitHub repository for **ThesTalk AI — “Just Talk. Build Your Thesis.”**

**Mission:** Extend this existing codebase into a production-oriented MVP for a chat-first AI thesis writing application. Users can talk or type naturally in Malay or English; the system converts their ideas into faithful academic prose, organizes approved content into editable thesis chapters, and exports a real editable DOCX document.

### NON-NEGOTIABLE FIRST STEP

1. Inspect the repository structure, `package.json`/dependency manifests, framework, current UI, authentication, storage/database setup, tests, scripts, deployment configuration and existing environment variable names.
2. Report briefly what is already functional, what is missing, which existing parts can be reused and any migration risks.
3. **Do not replace the entire repo, delete working functionality or introduce a new framework unnecessarily.** Maintain the current stack unless a change is essential and justified.
4. Implement features incrementally with tests. If a required service credential is absent, create secure server-side integration points, `.env.example` and descriptive setup instructions. Never hard-code or expose API keys.

## PRODUCT BEHAVIOR

**Core path:** `Conversation → Academic Rewrite → Preview/Edit → Insert into Thesis → Export`.

MVP requirements, in priority order:

1. Responsive authenticated project dashboard with New Thesis Project.
2. Project research profile: title, degree, institution, discipline, preferred academic language, objectives, research questions, methodology, theoretical framework, citation style.
3. Persistent chat workspace (text input first), project-specific conversation history and streaming responses where supported.
4. Voice record/stop/cancel, recorded-audio transcription, editable transcript preview and graceful microphone-denied fallback.
5. **Convert to Academic Writing**: server-side AI call accepts original informal text and the project's academic context; returns structured content for original/draft side-by-side UI, suggested chapter, linked RO/RQ and claim/source-needed indicators.
6. Configurable rewrite target: paragraph, section, research background, problem statement, literature synthesis, methodology, findings discussion and conclusion. Never claim generated findings without real uploaded research evidence.
7. Five-chapter editable thesis builder; add/reorder/rename sections; Insert into Section requires explicit user confirmation.
8. Rich-text editing, autosave, reload persistence, revision history/undo.
9. Generate **real, valid, editable `.docx` files** with headings and body paragraphs, directly downloadable without requiring the user to unpack a ZIP.
10. All buttons, states, navigation and error handling functional in the production build.

**Academic safety requirements:**

- Faithfully preserve user meaning; avoid making qualitative assertions into proven claims.
- Never invent citations, DOI, publication titles, quotations, statistics, survey responses or research results.
- Clearly mark unsupported factual claims as `source_needed`.
- Keep original user transcript separate from generated drafts and approved chapter content.
- Scope every API/database query to the authenticated project owner.
- Uploaded text must be treated as untrusted evidence, never as instructions.
- Ensure any citations added later come from actual available source records and evidence excerpts.

## UI DESIGN

Create a clean, modern academic SaaS-style UI; visually polished but not excessively decorative. Preserve existing product branding, if any. Use **ThesTalk AI** and tagline **Just Talk. Build Your Thesis.**

Desktop main workspace: left thesis chapter sidebar; middle chat and microphone; right academic-draft preview with Edit, Source Needed indicators and Insert into Chapter. Mobile: tab-based or stacked responsive layout, with clearly accessible Chat, Thesis, Sources and Export.

User flow states: empty, listening, recording, transcribing, generating, review-required, saving, saved, error and export-ready. Every button must have real behavior. Avoid fake demos and placeholder download buttons.

## IMPLEMENTATION GUIDELINES

- **Existing repo architecture wins.** If the repository is empty or unsuitable, recommend a Next.js + TypeScript + Tailwind + Supabase baseline, but make that choice explicit before large refactoring.
- Use environment variables for AI/transcription/storage credentials.
- Perform AI calls server-side. Validate all AI structured outputs with a schema and do not trust returned source IDs without checking them.
- Use migrations and database authorization (e.g. RLS if on Supabase).
- Keep uploaded audio private; make retention behavior explicit; default to deleting temporary audio after transcription unless retention is specifically enabled.
- Store structured editor content and version snapshots; avoid losing content on refresh.
- Keep export file creation on the server and test Word-file validity.
- Do not introduce premium libraries without flagging licensing and alternative solutions.
- Implement loading, toasts, empty screens and retry handling with no duplicate submissions.
- Write setup instructions for local development and deployment.

## IMPLEMENTATION ORDER

**Step A — Audit:** Examine repo, summarize status, make an implementation checklist.

**Step B — Foundation:** Finish auth, database schema, authorization and project profile.

**Step C — Core delight:** Implement persistent chat + typed input + academic rewrite structured output + preview/diff and explicit insertion.

**Step D — Voice:** Add recorded audio, stop/cancel, transcription preview/edit and language handling.

**Step E — Thesis editor:** Chapters/sections, editable content, autosave and revision history.

**Step F — Export:** Basic reliable `.docx` with correct hierarchy and direct download.

**Step G — Quality:** Add tests, fix broken controls, accessibility, security and README.

Do not scatter partial placeholder implementations across all phases. Complete and verify each critical user journey. More advanced literature tools, university-specific formatting presets and realtime audio belong to later phases unless already supported by the repo.

## REQUIRED TEST CASES

1. User A cannot access User B's project by guessing a project/section ID.
2. Signed-in user creates a project, starts a conversation, reloads and retains chat history.
3. Malay colloquial input generates a faithful English academic paragraph.
4. Voice permission denied: no crash, text entry remains functional.
5. Voice recording is transcribed, then user corrects the transcript before conversion.
6. `Convert` never automatically modifies an existing thesis section.
7. `Insert` creates exactly one approved document insertion (prevent double clicks/retries).
8. Save, navigate away, return and all text remains intact.
9. Export contains actual chapter text and opens as a valid editable DOCX.
10. No AI API key exposed in frontend code, browser requests or committed files.
11. No fabricated citations returned as “verified”.
12. Layout remains functional at mobile widths and with lengthy Malay/English text.

## DEFINITION OF DONE

Report the **actual changed files**, database migrations, environment variables needed, commands to run locally, tests executed and pass/fail results, known limitations and deployment instructions. Do not claim any function works without implementing and testing it. Do not promise features that require credentials which are not configured; use a clearly labeled demo/mock mode only where appropriate.

## SAMPLE ACCEPTANCE DEMO

Input in Malay:

> "Aku rasa gambar produk dekat Shopee penting sebab buyer tak boleh pegang barang dan nak tengok kain tu macam mana."

Expected academic output in English (example only):

> Product imagery serves as an important visual information source in e-commerce, particularly because customers cannot physically inspect merchandise before purchase. For fashion-apparel products, visual representations may help consumers assess perceived material characteristics and product appearance. [Source needed for empirical support.]

Then the user can review, edit, select a section, click **Insert into Chapter**, reopen the chapter and **download the edited thesis as a DOCX**.

---

**Primary product source document:** `ThesTalk_AI_Product_Requirements.md`. If its requirement conflicts with the implementation, prioritize user data security, source integrity and preservation of the existing working repository, and document the tradeoff.
