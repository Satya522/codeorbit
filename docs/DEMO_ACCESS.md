# Demo Access Guide

## Public evaluation path

Visitors can understand CodeOrbit quickly without needing private credentials.

Recommended flow:

1. Start on the live homepage at `https://codeorbit-xi.vercel.app`
2. Open `/about` to understand the product direction
3. Open `/case-study` to see the build narrative
4. Open `/playground` and `/learn` to inspect real product surfaces

## Authentication policy

CodeOrbit uses Clerk for sign-in.

- There are no shared demo credentials in this repository
- There is no public admin account exposed for testing
- Visitors who want to explore authenticated flows should use their own sign-in path on the live deployment

This keeps the public repo safe while still making the product understandable.

## What public viewers should expect

- Marketing and product-story routes are available as the first impression layer
- Some deeper user-linked flows depend on authentication and environment-backed services
- The health endpoint at `/api/health` can report `degraded` when optional dependencies are not configured for the public demo

## Maintainer note

If you later want a richer public trial flow, the next best upgrade is a dedicated demo tenant with rate-limited seed data rather than publishing shared credentials.
