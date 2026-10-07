# Yggy7g

A full-stack AI-powered crochet pattern platform (built on Replit): generate patterns from text or images, edit stitch-by-stitch, match yarn colors to real brands, preview in 3D/AR, and track projects.

## Features

- Pattern generation: text-to-pattern and image-to-pattern via OpenAI (`server/services/openai.ts`), with stitch counting, difficulty assessment, and time estimation
- Advanced editor: stitch-by-stitch canvas editing (15+ stitch types), layers with opacity, undo/redo, real-time preview
- Yarn management: AI color matching to real brands (Red Heart, Lion Brand, Bernat), shopping lists with quantity/cost calculation
- Visualization: 2D/3D preview (Three.js), AR overlay, pattern grid, written instructions, print-optimized PDF/chart exports
- Progress tracking, user auth (registration/login/sessions), and a testing dashboard
- Repo ships `DEPLOYMENT.md`, `TESTING.md`, `PRODUCTION_SUMMARY.md`, a comprehensive test script, and a frontend test checklist

## Tech stack

- Frontend: React + TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Three.js, canvas-based editor, TanStack Query
- Backend: Node.js, Express, TypeScript
- AI: OpenAI API for pattern generation and analysis
- Data: Drizzle ORM, PostgreSQL; auth with sessions

## Getting started

Scripts from `package.json`:

- `npm run dev` — development (tsx server + Vite)
- `npm run build` — build client and bundle server
- `npm start` — run production build
- `npm run check` — `tsc` typecheck
- `npm run db:push` — push Drizzle schema to Postgres (needs `DATABASE_URL`)
- `node comprehensive-test-script.js` — automated checks (see `TESTING.md`)

## Project structure

- `client/src/` — React app (`App.tsx`, `components/` for editor, canvas, AR/3D, yarn matching, progress tracking; `ui/` shadcn components)
- `server/` — Express app (`routes.ts`, `auth.ts`, `storage.ts`, `services/openai.ts`)
- `DEPLOYMENT.md` / `PRODUCTION_SUMMARY.md` / `TESTING.md` / `frontend-test-checklist.md` — docs and test records
- `attached_assets/` — UI screenshots; `generated-icon.png` — app icon

## Status

Full app, documented as production-ready by its own docs (100% test pass claims in `PRODUCTION_SUMMARY.md` — those are the repo's claims, not independently verified here). The one honest caveat: AI features require an OpenAI key configured in the environment.
