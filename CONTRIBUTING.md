# Contributing To CodeOrbit

## Working model

- Create feature branches from `main`
- Keep pull requests focused and small enough to review comfortably
- Run `npm run lint`, `npm run build`, and `npm run prisma:validate` before opening a PR
- Never commit `.env`, machine-specific settings, local logs, or secrets

## Pull request checklist

- Describe the user-facing change clearly
- Mention any schema, environment, or deployment impact
- Include screenshots for UI changes
- Call out follow-up work instead of hiding it

## Branching

- `main` is the protected branch
- Use names like `feat/...`, `fix/...`, `chore/...`, or `docs/...`

## Secrets and privacy

- Store sensitive values only in local `.env` files or hosted environment settings
- Do not hardcode API keys, tokens, private URLs, or personal data
- If a secret is exposed accidentally, rotate it before merging anything
