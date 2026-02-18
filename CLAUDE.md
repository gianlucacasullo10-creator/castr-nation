# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run Vitest once
npm run test:watch   # Vitest in watch mode
npm run preview      # Preview production build
```

## Architecture

**Stack:** React 18 + TypeScript + Vite (SWC) + Tailwind CSS + shadcn/ui + Supabase + React Query

**Path alias:** `@` resolves to `./src`

### Key directories

- `src/pages/` — Route-level page components (one per route)
- `src/components/` — Reusable UI components; `src/components/ui/` contains shadcn/Radix primitives
- `src/hooks/` — Custom React hooks
- `src/integrations/supabase/` — Supabase client and generated types
- `src/utils/` — Utility functions (e.g., `achievementTracker.ts`, `battleTiers.ts`, `titles.ts`)
- `src/lib/` — Shared helpers
- `supabase/` — Database migrations and edge functions

### Routing

React Router v6 with 12 routes defined in `src/App.tsx`. Main routes:

| Path | Page |
|---|---|
| `/` | Home feed |
| `/auth` | Authentication |
| `/capture` | Catch photo upload |
| `/leaderboards` | Rankings |
| `/shop` | Item marketplace |
| `/inventory` | User inventory |
| `/profile` / `/profile/:id` | User profiles |
| `/clubs` | Club listings |
| `/achievements` | Achievement tracking |
| `/castrs-pro` | Premium features |
| `/tournaments` | Tournament management |
| `/admin/review` | Admin moderation |

### App-level concerns (App.tsx)

- Wraps app in React Query, Tooltip, and Toast providers
- Manages a **global upload modal** state shared across the app
- Subscribes to **Supabase real-time** events for like notifications
- Bottom navigation with camera button for catch upload is persistent across all routes

### Data layer

- All backend calls go through Supabase (auth, database, real-time subscriptions)
- Server state is managed with **TanStack React Query** (caching, invalidation)
- Forms use **React Hook Form + Zod** for validation

### Styling

- Tailwind with a custom CSS-variable-based color system (primary, gold, silver, bronze, success, points, etc.)
- Dark mode via `next-themes` using the `class` strategy
- Custom animations: `scale-in`, `slide-in-bottom`, `accordion-down/up`

### Mobile

Capacitor is configured for iOS/Android builds. The web app is also a PWA with a service worker registered in `main.tsx` (update interval: 60 min).
