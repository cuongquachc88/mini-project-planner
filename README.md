# Mini Project Planner

Offline-first project management tool built as a PWA. No backend, no subscription — all data lives in your browser via PGlite (WebAssembly PostgreSQL), with optional Google Drive backup.

**[Live App](https://cuongquachc88.github.io/mini-project-planner/)** · **[Docs](https://cuongquachc88.github.io/mini-project-planner/docs/)** · **[Architecture](https://cuongquachc88.github.io/mini-project-planner/docs/sad.html)**

---

## Features

| Area | What's included |
|---|---|
| **Board** | Kanban with drag & drop, custom stages, 6 work item types |
| **Sprints** | Plan → Start → Complete lifecycle, backlog assignment |
| **Epics** | Color-coded epics, milestone health indicators |
| **Reports** | Velocity chart, rolling average, completion rate trend |
| **Vault** | Meeting notes, decisions, retros, run sheets, wiki, costs |
| **Sync** | Google Drive backup (SQL dump), auto-sync every 15 min |
| **PWA** | Installable, fully offline, 6-digit PIN lock screen |

## Tech Stack

- **React 18** + TypeScript + Vite
- **PGlite** — PostgreSQL compiled to WASM, persisted in IndexedDB
- **Zustand** — state management
- **TipTap** — rich text editing
- **Recharts** — data visualization
- **dnd-kit** — drag and drop
- **Tailwind CSS** + Radix UI
- **Vite PWA** — service worker, offline support

## Getting Started

### Run locally

```bash
npm install
cp .env.example .env.local   # optional: add Google OAuth credentials
npm run dev
```

App runs at `http://localhost:5174`

### Environment variables

```env
# Required only for Google Drive sync
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Set up OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
- Enable **Google Drive API**
- Scope: `https://www.googleapis.com/auth/drive.appdata`
- Redirect URI (dev): `http://localhost:5174/oauth-callback`
- Redirect URI (prod): `https://<your-domain>/oauth-callback`

### Build & deploy

```bash
npm run build        # outputs to dist/
npm run preview      # preview production build locally
```

### Tests

```bash
npm test             # unit tests (Vitest)
npm run test:e2e     # end-to-end tests (Playwright, Chromium only)
```

> E2E tests require Chromium — PGlite's SharedArrayBuffer support only works there.

## Project Structure

```
src/
├── pages/          # Route-level components (Board, Backlog, Epics, Reports, Vault…)
├── modules/        # Feature modules (board, sprint, epics, reports, vault)
├── components/     # Shared UI components
├── db/             # PGlite client, migrations, query functions
├── hooks/          # Custom React hooks
├── store/          # Zustand slices
├── lib/            # Google Drive integration, HTML export, utilities
└── types/          # TypeScript type definitions
public/
├── docs/           # Static documentation site
└── icons/          # PWA icons
```

## License

MIT
