# Vercel Deployment Guide

## Recommended setup

1. Import the GitHub repository into Vercel.
2. Use the framework preset detected for Next.js.
3. Keep the root directory as the repository root.
4. Add environment variables in Project Settings instead of `vercel.json`.

## Minimum environment variables

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `POSTGRES_HOST` or `DATABASE_URL`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `REDIS_URL`
- `AI_PROVIDER`
- `GEMINI_API_KEY` or `OPENAI_API_KEY` or `DEEPSEEK_API_KEY`
- `NEXT_PUBLIC_PARTYKIT_HOST`
- `CORS_ALLOWED_ORIGINS`
- `SESSION_COOKIE_NAME`
- `SESSION_MAX_AGE_SECONDS`

## Production recommendations

- Set `NEXT_PUBLIC_APP_URL` to the production domain.
- Set `CORS_ALLOWED_ORIGINS` to your production domain and preview domains when needed.
- Use managed PostgreSQL and Redis instead of local services.
- Keep preview and production secrets separated in Vercel environments.

## Before promoting to production

1. Confirm `npm run build` passes locally.
2. Verify Clerk keys match the target environment.
3. Confirm database migrations or `prisma db push` strategy.
4. Confirm PartyKit host points at the deployed collaboration service.
5. Smoke test sign-in, dashboard, playground, practice, and API health routes.
