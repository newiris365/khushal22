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

## 3. Branch Protection & PR Requirements

1. **Direct Pushes Blocked**: Direct commits to `main` are restricted. All changes must be submitted via feature branches (`feat/feature-name`, `fix/bug-name`).
2. **Mandatory CI Pipeline**: Every Pull Request must pass the automated GitHub Actions CI workflow (`.github/workflows/ci.yml`).
3. **Review Approval**: At least 1 peer review approval from a senior engineer is required before merging.

---

## 4. Coding & Security Standards

- **Strict Type Safety**: Avoid explicit `: any` types. Use proper interfaces or `unknown` with type guards.
- **Structured Logging**: Do not use `console.log` for production logging. Use the Winston logger (`import logger from './config/logger'`).
- **Fail-Closed Security**: Webhooks and payment integrations must fail closed (return 500/503 on missing secrets) and use timing-safe buffer comparisons (`crypto.timingSafeEqual`).
- **File Metadata Validation**: Always validate `file_url`, `file_type`, and `file_size_kb` server-side using `validateFileMetadata`.
