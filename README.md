# CodeOrbit

CodeOrbit is a Next.js learning and practice platform that brings curriculum, coding playgrounds, AI help, DSA tracking, interview prep, and project-based learning into one workspace.

## What is inside

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
git clone https://github.com/your-username/codeorbit.git
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

## GitHub-ready defaults

This repository now includes:

- a cleaned-up `.gitignore` for local-only artifacts
- a GitHub Actions CI workflow for install, Prisma validation, linting, and production build checks
- issue templates and a pull request template for cleaner collaboration

## Deployment notes

- Vercel is the most direct deployment target for the Next.js app
- Add the same environment variables from `.env` to your hosting provider
- If you use PartyKit in production, make sure `NEXT_PUBLIC_PARTYKIT_HOST` points to the deployed PartyKit host

## License

No license file is included yet. Add one before publishing publicly if you want to define reuse terms clearly.
