# CodeOrbit

![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-UNLICENSED-red)

CodeOrbit is a Next.js learning and practice platform that brings curriculum, coding playgrounds, AI help, DSA tracking, interview prep, and project-based learning into one workspace.

## Highlights

- Marketing pages and product storytelling for the public site
- Authenticated platform routes for dashboard, profile, learn, practice, playground, projects, DSA, and interview prep
- AI tutor and assistant endpoints with provider-based configuration
- Prisma-backed progress and profile data flows
- PartyKit and Yjs collaboration hooks for shared editing features

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Clerk authentication
- Prisma with PostgreSQL
- Redis-backed cache with in-memory fallback
- PartyKit and Yjs for collaboration

## Project structure

```text
src/
├── app/              # App Router pages, layouts, and API routes
├── components/       # Shared UI and layout components
├── config/           # Site and navigation config
├── data/             # Mock content and static datasets
├── features/         # Domain-focused feature modules
├── hooks/            # Reusable React hooks
├── lib/              # Infrastructure helpers
├── services/         # Service layer integrations
├── types/            # Shared TypeScript types
└── utils/            # Generic utilities
```

## Quick start

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL if you want persistence beyond the local bootstrap path
- Redis is optional because the app falls back to in-memory caching

### Installation

```bash
git clone https://github.com/Satya522/codeorbit.git
cd codeorbit
npm ci
cp .env.example .env
```

### Configure environment

`.env.example` already includes every variable used by the app. Start by copying it to `.env`, then update only the values you need.

Important variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for authentication
- `POSTGRES_*` or `DATABASE_URL` for Prisma-backed routes
- `REDIS_URL` for external caching
- `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, or `OPENAI_API_KEY` for AI features
- `GITHUB_TOKEN` if you want richer GitHub profile sync behavior
- `NEXT_PUBLIC_PARTYKIT_HOST` if you run collaboration outside localhost

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Optional local backend bootstrap

For a Windows-first local setup, the repository includes a helper that bootstraps local backend services:

```bash
npm run backend:bootstrap
```

If you prefer manual setup, point the app at your own PostgreSQL and Redis instances through `.env`.

## Available scripts

- `npm run dev` starts the Next.js dev server
- `npm run build` creates a production build
- `npm run start` serves the production build
- `npm run lint` runs ESLint
- `npm run prisma:generate` generates the Prisma client
- `npm run prisma:validate` validates the Prisma schema
- `npm run prisma:push` pushes the Prisma schema to the configured database
- `npm run db:seed:practice` seeds practice data
- `npm run partykit:dev` starts the PartyKit server

## Release-ready repo defaults

This repository includes:

- GitHub Actions CI for install, Prisma validation, linting, and production build checks
- issue templates, PR template, CODEOWNERS, Dependabot, contributing guide, and security policy
- tightened `.gitignore` rules so local secrets and machine-specific files stay out of Git
- production-safe Next.js response headers for baseline hardening

## Deployment

- Vercel is the recommended deployment target for the Next.js app
- Mirror `.env` values into Vercel Project Settings instead of committing secrets
- Review the deploy checklist in [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)
- Review branch rules in [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md)

## Privacy and licensing

This repository is intentionally marked `UNLICENSED`. The included [LICENSE](LICENSE) keeps the code proprietary by default, which is the safer choice while the project remains private.
