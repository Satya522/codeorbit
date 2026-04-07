# Public Presence Guide

## Live URLs

- Production app: `https://codeorbit-xi.vercel.app`
- Repository: `https://github.com/Satya522/codeorbit`

## GitHub social preview

The prepared social card asset for this repo is:

- `docs/images/social-preview.png`

If you want the image to appear in GitHub shares and repo cards, upload that asset in the repository settings UI:

1. Open the repository on GitHub
2. Go to `Settings`
3. Open the general repository settings area
4. Find `Social preview`
5. Upload `docs/images/social-preview.png`

## Custom domain candidates

Availability and pricing were checked through Vercel on **April 7, 2026**.

| Domain | Status | Indicative purchase price |
| --- | --- | --- |
| `codeorbitapp.com` | Available | `$11.25` |
| `codeorbitapp.dev` | Available | `$13` |
| `getcodeorbit.dev` | Available | `$13` |
| `codeorbit.dev` | Unavailable | - |
| `codeorbit.ai` | Unavailable | - |

## Recommended choice

If you want the cleanest production brand without spending too much, `codeorbitapp.com` is the strongest balance of readability and cost.

## Domain connection flow

Once you buy or already own a domain:

1. Add it in the Vercel project domain settings
2. Point the required DNS records from your registrar
3. Wait for verification
4. Set the chosen domain as primary
5. Update `NEXT_PUBLIC_APP_URL` in Vercel to the final domain
6. Redeploy production

## Maintainer note

The production deployment is already public on the default Vercel domain, so the custom domain is now a branding upgrade rather than a launch blocker.
