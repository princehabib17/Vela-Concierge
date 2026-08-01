# AGENTS.md

Instructions for OpenAI Codex (and other coding agents) working in this repository.

## Project

VELA Jewellers Concierge — a premium custom-ring experience and companion app for VELA
Jewellers. React + TypeScript + Vite, styled with Tailwind CSS, with a Three.js /
React Three Fiber 3D ring configurator. AI-assisted design features call Gemini via
`@google/genai`.

See `.agents/product-marketing-context.md` for brand voice, personas, and product
positioning if you're touching user-facing copy.

## Setup & commands

- Install deps: `npm install`
- Dev server: `npm run dev` (Vite, port 3000)
- Build: `npm run build`
- Preview build: `npm run preview` (port 4173)
- Type-check (used as lint): `npm run lint` (`tsc --noEmit`)

Requires a `GEMINI_API_KEY` in `.env.local` for the AI design/generation features to
work locally (see `.env.example`).

## Code layout

- `src/pages/` — route-level screens (e.g. `AIGenerator.tsx`, `AIDesign.tsx`).
- `src/components/shell/` — app shell / navigation chrome.
- `src/lib/` — shared utilities.
- `src/App.tsx`, `src/main.tsx` — routing and entry point (react-router-dom).
- `@/*` path alias resolves to `src/*` (see `tsconfig.json` / `vite.config.ts`).

## Conventions

- TypeScript + functional React components; Tailwind utility classes for styling
  (custom `vela-*` color tokens — gold, dark, black, gray, light).
- Keep the luxury/atelier tone in any UI copy: confident, warm, precise — avoid
  generic "luxury lifestyle" filler (see product-marketing-context.md word lists).
- Prefer editing existing files over adding new abstractions; this is a small app,
  not a platform.

## Before finishing a task

- Run `npm run lint` (type-check) and fix any errors your change introduces.
- There is no automated test suite in this repo currently; for UI changes, run
  `npm run dev` and manually verify the affected screen where possible.
