# Production Hardening

## What is already hardened

The public CodeOrbit deployment is live at `https://codeorbit-xi.vercel.app` and currently has these production-safe pieces in place:

- Clerk authentication environment variables
- `NEXT_PUBLIC_APP_URL` pointed at the public production URL
- AI provider defaults with Gemini configured on Vercel
- Session cookie defaults
- CORS origin locked to the public production URL
- Web Analytics and Speed Insights enabled on the Vercel project
- GitHub release flow active through version tags

## Current live state

The production health route is intentionally environment-aware:

- AI assistant: configured
- AI tutor: configured
- Remote execution engine: configured
- Redis: fallback mode
- Database: missing
- Realtime PartyKit host: missing

That means the public product story and AI-backed surfaces are live, while the full data-backed and collaborative experience still needs external infrastructure.

## Remaining blockers for full-stack production

### 1. Managed database

Needed for:

- persistent user progress
- profile-linked data
- Prisma-backed practice sync

Required variable:

- `DATABASE_URL` or the `POSTGRES_*` set

### 2. Managed Redis

Needed for:

- shared cache across instances
- restart-safe cache behavior

Required variable:

- `REDIS_URL`

### 3. PartyKit deployment

Needed for:

- collaborative editing
- realtime room presence
- code execution callbacks through the collaboration channel

Required variables:

- `NEXT_PUBLIC_PARTYKIT_HOST`
- `NEXT_PUBLIC_APP_URL`

Current blocker:

- the local machine is not logged into PartyKit, so the collaboration service cannot be deployed yet

## Custom domain status

The app is public on the Vercel domain already. A custom domain is now a branding upgrade, not a launch blocker.

Recommended next choice:

- `codeorbitapp.com`

See [docs/PUBLIC_PRESENCE.md](docs/PUBLIC_PRESENCE.md) for domain options and connection steps.

## Suggested completion order

1. Provision a managed PostgreSQL database
2. Provision a managed Redis instance
3. Log into PartyKit and deploy the collaboration server
4. Set `NEXT_PUBLIC_PARTYKIT_HOST`
5. Re-run a production deploy
6. Attach a custom domain and update `NEXT_PUBLIC_APP_URL`
