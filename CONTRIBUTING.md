# Contributing to IRIS 365

Thank you for your interest in contributing to IRIS 365! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your Supabase credentials
4. Run the development server: `npm run dev`

This boots both Next.js (port 3000) and Express (port 4000) concurrently.

## Branching Strategy

- `main` — stable, production-ready code
- `dev` — integration branch for features
- `feature/*` — new features (e.g., `feature/transit-realtime`)
- `fix/*` — bug fixes (e.g., `fix/gate-auth-timeout`)

```bash
git checkout -b feature/your-feature-name dev
```

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Examples:
```
feat(canteen): add order tracking via WebSocket
fix(transit): resolve bus location polling delay
docs(readme): update architecture diagram
```

## Pull Request Process

1. Create your feature branch from `dev`
2. Make your changes following the code conventions below
3. Run `npx tsc --noEmit` to verify no type errors
4. Run `npm run build:frontend && npm run build:backend` to verify builds pass
5. Open a PR against `dev` with a clear title and description
6. Request review from a maintainer

## Code Conventions

- **Frontend**: Next.js App Router, React 18, Tailwind CSS, `"use client"` for client components
- **Backend**: Express with routes → controllers → lib layering
- **Database**: Supabase (PostgreSQL), RPCs for complex operations, RLS for multi-tenancy
- **Styling**: Dark theme with `#0D0A1A` background, `#6C2BD9` / `#8B5CF6` accents, `#C4B5FD` text
- **Naming**: Files use camelCase for utils, PascalCase for React components
- **Dynamic imports**: Use `next/dynamic` with `{ ssr: false }` for Leaflet, Recharts, and any `window`-dependent code

## Project Structure

```
src/
├── app/            # Next.js App Router pages
├── components/     # Shared React components
├── lib/            # Shared utilities (api.ts, socket.ts, charts.tsx)
├── config/         # Server config (supabase, logger, cron)
├── controllers/    # Express route handlers
├── routes/         # Express route definitions
├── middleware/     # Express middleware (auth, rate limit)
├── services/       # Server-side services
└── server.ts       # Express + Socket.io server entry
```

## Reporting Issues

Use the GitHub issue templates for:
- **Bug reports**: Include steps to reproduce, expected vs actual behavior
- **Feature requests**: Include use case and expected behavior

## License

By contributing, you agree that your contributions will be licensed under the project license.
