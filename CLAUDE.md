# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Clover Store is an e-commerce storefront on Next.js (App Router). Only authentication is scaffolded so far — there is **no** product/cart/order schema or storefront UI yet. `src/db/schema.ts` contains only the Better Auth tables, and `src/app/page.tsx` is a placeholder landing page.

## Setup state — read before running anything

This is a fresh scaffold and does **not** run as-is:

- **`package.json` declares no dependencies.** The scripts and `src/` imports require these to be added and installed before `next dev`/`build` works:
  - runtime: `next`, `react`, `react-dom`, `better-auth`, `drizzle-orm`, `@neondatabase/serverless`, `dotenv`
  - dev: `drizzle-kit`, `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `postcss`
- **No `.env`.** Copy `.env.example` → `.env` and set `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`. `src/db/index.ts` no longer throws when `DATABASE_URL` is unset — it warns and defers to a query-time error so `next dev` runs on a fresh checkout, and the homepage falls back to a sample catalog (`src/db/sample-catalog.ts`) when the DB is unreachable. For live, editable data set a real `DATABASE_URL` then run `npm run db:migrate && npm run db:seed`.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` / `npm run start` — production build / serve
- `npm run db:generate` — generate SQL migrations from `src/db/schema.ts` into `./drizzle`
- `npm run db:migrate` — apply migrations
- `npm run db:push` — push schema straight to the DB (fast dev iteration, no migration files)
- `npm run db:studio` — Drizzle Studio
- `npx @better-auth/cli generate` — regenerate the Better Auth tables in `src/db/schema.ts` after changing auth config

No lint or test tooling is configured (`next lint` is not wired up; there is no test runner).

## Architecture

**Auth (Better Auth + Drizzle).** `src/lib/auth.ts` is the server instance — email/password enabled, backed by the Drizzle adapter (`provider: "pg"`) over the shared `db`. `src/app/api/auth/[...all]/route.ts` mounts every auth endpoint through `toNextJsHandler`, so all `/api/auth/*` routes come from that one catch-all. `src/lib/auth-client.ts` is the browser client (`better-auth/react`), keyed off `NEXT_PUBLIC_APP_URL`.

**Database (Drizzle + Neon).** `src/db/index.ts` builds the Drizzle client over Neon's HTTP driver (`drizzle-orm/neon-http` + `@neondatabase/serverless`) — HTTP, not a pooled TCP connection. **The connection is intentionally fail-soft:** `index.ts` never throws at import — if `DATABASE_URL` is unset it warns and constructs the client with a non-resolving placeholder (`postgresql://unset:unset@unset.invalid/unset`), so a bad/missing URL surfaces as a **query-time** error, not a module-load crash. Callers must therefore tolerate query-time failures: the storefront (`src/app/page.tsx`) wraps its reads in `try/catch` and renders sample data from `src/db/sample-catalog.ts`, so `next dev`/`build` run with no reachable DB. For a live connection, put a real Neon `DATABASE_URL` in `.env`, run `db:migrate` + `db:seed`, then restart the server (env is read only at startup, and `index.ts` reads `DATABASE_URL` at import). `src/db/schema.ts` is the single source of truth for tables, consumed by the app (`db`) and by `drizzle.config.ts` (`dialect: "postgresql"`, output `./drizzle`); keep the four Better Auth tables (`user`, `session`, `account`, `verification`) intact.

**Styling.** Tailwind CSS v4 via `@tailwindcss/postcss` (`postcss.config.mjs`); `src/app/globals.css` pulls it in with `@import "tailwindcss"`. There is no `tailwind.config` file — v4 is configured in CSS.

**Imports.** `@/*` maps to `./src/*` (`tsconfig.json`).

## Environment note

The repo lives under a OneDrive-synced path, so `npm install` and `next build` can be slow here due to file-sync contention — slowness is usually contention, not a hang.
