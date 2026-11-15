# ThesTalk AI — Installable PWA

**Just Talk. Build Your Thesis.**

A responsive, installable web application for voice/text brainstorming, thesis chapter management, academic conversion, version history and real editable DOCX export. Browser storage is **local-only**: it does not synchronize between devices.

## Deploy to Vercel (from GitHub)

1. Push **these folder contents** into the repository root at https://github.com/akmahalili/ThesTalk (keep `.env` out of Git).
2. In Vercel, **Add New → Project → Import Git Repository → `akmahalili/ThesTalk` → Deploy**. Choose framework **Other** if prompted. The app has root-level static assets and API serverless functions.
3. It will have an HTTPS `*.vercel.app` link. On Android Chrome, use **⋮ → Add to Home screen / Install app** for an app icon and standalone experience.
4. For **actual AI**, go to Vercel → Project → Settings → Environment Variables and configure the following **directly in Vercel**, not in source code:
   - `OPENAI_API_KEY` — paid API account key; keep private.
   - `THESTALK_AI_ACCESS_CODE` — a **unique randomly generated code of at least 12 characters**. **Do not use your API key** as the access code. Share only with trusted users.
   - `OPENAI_MODEL` — optionally set a model you have permission to use; default `gpt-4.1-mini`.
   - `OPENAI_TRANSCRIPTION_MODEL` — optionally set a supported transcription model; default `gpt-4o-mini-transcribe`.
5. Redeploy after adding environment variables. In the app, press **Connect AI**, enter the access code and verify the badge changes to **AI connected**.

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
