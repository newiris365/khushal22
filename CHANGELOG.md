# Changelog

All notable changes to IRIS 365 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- API rewrite hard-coded to localhost — now uses `NEXT_PUBLIC_API_URL` env var
- Socket.io creating new connections on every screen mount — added shared singleton (`src/lib/socket.ts`)
- Sequential waterfall fetches on 7 pages — converted independent fetches to `Promise.all`
- Leaflet, Recharts, and Framer Motion loaded without dynamic import — all now use `next/dynamic` with `{ ssr: false }`
- No loading states on pages — added skeleton loaders to Director Dashboard, Transit Tracking, Financial P&L, and Gate Inside pages
- `logs/` folder committed to git — added to `.gitignore` and removed from tracking

### Added
- Shared Recharts dynamic wrapper (`src/lib/charts.tsx`) — 19 chart components loaded on-demand
- Skeleton component library (`src/components/Skeleton.tsx`) — reusable `Skeleton`, `SkeletonCard`, `SkeletonTable`, `SkeletonDashboard`
- Socket.io singleton (`src/lib/socket.ts`) — `getSocket(namespace)` with auto-reconnect
- Stale-while-revalidate cache headers on Express for read-only GET endpoints
- Optional `cacheSeconds` parameter on `apiGet()` client
- `bus_tracking` composite index migration (`supabase/migrations/20260611_add_bus_tracking_index.sql`)
- CI/CD pipeline (`.github/workflows/ci.yml`) — type check, build frontend/backend, tests
- Contributing guide (`CONTRIBUTING.md`)
- Changelog (`CHANGELOG.md`)
- GitHub issue templates (bug report + feature request)
- Jest test configuration and initial test suite

### Changed
- `next.config.mjs` rewrite destination now prioritizes `NEXT_PUBLIC_API_URL`
- `src/lib/api.ts` `apiGet()` supports optional `cacheSeconds` for SWR-style caching
- `src/server.ts` adds `Cache-Control: s-maxage=60, stale-while-revalidate=300` for cacheable routes

## [1.0.0] - 2026-06-01

### Added
- Initial release of IRIS 365 AI-Powered Campus Operating System
- 20+ modules: Attendance, Canteen, Library, Transit, Hostel, Gate, Events, Placement, HR, Admissions, Director Dashboard, AI Concierge, and more
- Express backend with 15 route groups and Socket.io real-time namespaces
- Next.js 14 App Router frontend with dark theme UI
- Supabase integration with 45+ tables, RLS policies, and RPC functions
- Mobile screens specification (14 screens)
- PDF report generation, AI insights, predictive analytics
