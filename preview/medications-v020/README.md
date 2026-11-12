# PAE-04 · Medications v0.2.0 TEST (isolated preview)

**Version:** v0.2.0 TEST, build MT-20261112.1.
**Location:** preview/medications-v020/ . This is **not** the released Health Tracker PWA.
**Status:** synthetic-only candidate; do not merge without explicit owner approval.

## What exists
- iPhone-first screen with tabs **Сегодня / Препараты / История**.
- Add strictly fictional test medicines by entering an allowed synthetic name or choosing from a two-item fictitious catalog.
- Three modes: permanent, course with start/end date, and as-needed.
- Mark/unmark one daily intake via checkbox, history lists completed marks.
- No reminders, notification APIs, prescription editing, dosages or clinical logic.
- Browser-local synthetic data via localStorage under a dedicated key, no shared keys with pressure demo.
- Download synthetics-only JSON, reset with confirmation.
- Static shell service worker under this subdirectory only; offline behavior requires real-device QA.
- No Supabase, no authentication, no external API calls, no real medical information.
- Exact copied model from prior 12/12 day QA synthetic contract.

## Not implemented
- Real medication catalog, dosing schedules or several doses per day.
- Cloud synchronization, multi-device sync, real-user accounts, data sharing, medical recommendations.
- Real medication recording; this prototype must not be used as a medication log.
- Import UI (model supports validated synthetic import for tests).
- Live integration with blood pressure or Obsidian AI.
- Physical iPhone Face ID/WebKit verification.

## Automated acceptance
Run on isolated GitHub Actions runner only (no Mac):
- 12 medication model contracts
- 18 static safety, layout-structure, CSP and isolation checks
- 8 iPhone-size WebKit browser smoke tests, including optional offline shell
- Workflow: .github/workflows/pae04-medications-v020.yml (push to sandbox branch only).

If CI fails: collect step-level evidence and fix this sandbox branch only; keep main unchanged.

## Release gate
**Do not merge automatically.** After all QA passes, ask the owner to authorize publishing a separate preview URL within the existing TEST GitHub Pages site. Publishing the preview would add files under /preview/medications-v020/ but must leave the currently live root index.html v0.1.1 unchanged. Verify exact build label and iPhone behavior, then plan an integration milestone separately.

## Rollback and data safety
Before merging: close Draft PR and delete the sandbox branch only if separately authorized.
After a possible preview publish: separately revert the preview-only files; do not touch live app or clinical databases.
All saved preview data are synthetic, stored locally in the testing browser only. Do not paste passwords, personal or real medical data into this preview.
