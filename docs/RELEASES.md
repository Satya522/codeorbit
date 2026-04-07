# Release Guide

## Versioning flow

Use tags in the format `vX.Y.Z`.

Examples:

- `v0.1.0`
- `v0.1.1`
- `v0.2.0`

## Suggested release checklist

1. Confirm `npm run check` passes locally.
2. Update `CHANGELOG.md`.
3. Push the latest commits to `main`.
4. Create and push a version tag.

```bash
git tag v0.1.1
git push origin v0.1.1
```

## What happens next

The GitHub release workflow will:

- trigger on tags matching `v*`
- create a GitHub Release
- attach generated release notes automatically
