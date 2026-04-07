# Branch Protection Guide

Recommended GitHub protection rules for `main`:

1. Require a pull request before merging.
2. Require at least 1 approving review.
3. Require review from Code Owners.
4. Dismiss stale approvals when new commits are pushed.
5. Require conversation resolution before merge.
6. Require status checks to pass.
7. Select the `validate` GitHub Actions check.
8. Block force pushes and branch deletion.

Recommended admin posture:

- Keep admin bypass available while the repository is still being bootstrapped.
- Turn on stricter admin enforcement only when the collaboration flow is stable.
