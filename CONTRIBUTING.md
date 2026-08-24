# Contributing to IRIS 365

Thank you for contributing to the IRIS 365 AI-Powered Campus Operating System. This document outlines the engineering practices, repository rules, and verification standards required for all developers.

---

## 1. Local Setup & Prerequisites

- **Node.js**: `v20.x` LTS
- **Package Manager**: `npm`

```bash
# Clone the repository
git clone https://github.com/newiris365/khushal22.git
cd "2 july iris"

# Install dependencies
npm install

# Run local development server (Express + Next.js concurrently)
npm run dev
```

---

## 2. Mandatory Verification Before Submitting PRs

Before creating a Pull Request or pushing commits to `main`, every developer MUST run and pass the following 4 automated checks locally:

```bash
# 1. Client Type Check
npx tsc --noEmit -p tsconfig.json

# 2. Server Type Check
npx tsc --noEmit -p tsconfig.server.json

# 3. ESLint Verification
npm run lint

# 4. Jest Unit & Security Test Suite
npm test
```

---

## 3. Branch Protection & GitHub Settings

1. **GitHub Branch Protection Rules**:
   Navigate to **Settings -> Branches -> Add branch protection rule** for `main`:
   - Check **Require a pull request before merging** (Require at least **1 review approval**).
   - Check **Require status checks to pass before merging** (Select status check `verify` from `.github/workflows/ci.yml`).
   - Check **Do not allow bypassing the above settings**.

2. **Pre-Commit Hooks**:
   Husky is configured via `.husky/pre-commit` to execute `npx lint-staged` on every commit.

---

## 4. Coding & Security Standards

- **Strict Type Safety**: Avoid explicit `: any` types. Use proper interfaces or `unknown` with type guards.
- **Structured Logging**: Do not use `console.log` for production logging. Use the Winston logger (`import logger from './config/logger'`).
- **Fail-Closed Security**: Webhooks and payment integrations must fail closed (return 500/503 on missing secrets) and use timing-safe buffer comparisons (`crypto.timingSafeEqual`).
- **File Metadata Validation**: Always validate `file_url`, `file_type`, and `file_size_kb` server-side using `validateFileMetadata`.

---

## 5. Security & Upstream Upgrade Roadmap

- **Next.js 15 Upgrade Tracking**: Upstream Next.js 14.x framework advisories are tracked for upgrade to Next.js 15. Standardize on feature branch `feat/nextjs-15-upgrade` with full regression testing prior to production release.
