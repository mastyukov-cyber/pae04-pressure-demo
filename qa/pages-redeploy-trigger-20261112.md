# PAE-04 TEST Pages redeploy request — 2026-11-12

Purpose: request a fresh GitHub Pages deployment after GitHub's automatic pages-build-deployment runs #6 and #7 ended with startup_failure.

Source baseline: main commit be107fefeb1e2414761f81deab230150310c05d5.
Expected visible version: Pressure Demo v0.1.0 TEST, build PD-20261111.1.

Safety:
- No application code, authentication logic, secrets, database policy, or synthetic measurements changed.
- Do not merge without explicit owner approval.
- After merging, verify the new Pages workflow succeeds and check the version on an iPhone.
- This documentation-only change is a deploy trigger and does not itself fix GitHub Actions infrastructure.
