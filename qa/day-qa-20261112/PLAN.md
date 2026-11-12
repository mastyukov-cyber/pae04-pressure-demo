# PAE-04 — FAST LANE DAY QA v1.0 (TEST-only)

Prepared 2026-11-12. Target Pressure Demo v0.1.1 TEST; expected build PD-20261112.1.
STATE: PREPARED, NOT STARTED. This document does not authorize running any test.

## Goal and boundaries

Validate the iPhone PWA's mobile UX, Face ID/password autofill, sessions and synthetic pressure entries without changing the working application. This is development QA, not medical advice.

- Public TEST site: https://mastyukov-cyber.github.io/pae04-pressure-demo/
- Repo: mastyukov-cyber/pae04-pressure-demo
- Baseline main commit: d36cb10df5992e1a27931fa5968ffc809a1aa545
- Daytime window: Thursday 2026-11-12, 13:30–20:30 Moscow time, launch requires separate authorization.
- Total planned duration: 150 minutes. Max one iPhone Simulator. Physical iPhone is used for hands-on Face ID verification.
- Automatic static checker: qa/day-qa-20261112/static-contract.mjs. Node.js 20+, built-in libraries only. Reads index.html, makes no network requests and writes no files. It cannot prove runtime Face ID behavior or Supabase RLS.
- No actual medical data, no change to Obsidian Vault, production data, GitHub main, app settings, device settings, or unrelated projects.
- No automatic creation of test accounts, no automatic Supabase record insert/delete, no external collection of screenshots or credentials.

## Estimated launch resources (NOT a permission to execute)

Static offline checker: 1–5 seconds, CPU average under 5%, short peak up to 15%; RAM 30–100 MB; free disk 10 MB; 0 cloud writes; does not require simulator.
Optional full Mac WebKit/simulator run: 150 min, CPU average 10–30%, possible peak 50–70%; RAM 1.5–3.5 GB; free disk 1–2 GB (logs and screenshots included); technical-only Dropbox logs 0.5–5 MB after verifying destination and owner consent. The Mac must remain powered on during such a local run. These are estimates, not measurements.

STOP: Ctrl+C or stop the approved runner. Confirm it exited and produce a cancellation marker. Never delete logs automatically; no main/Vault rollback should be necessary because those are out of scope. Immediately abort if a forbidden path is accessed, tokens appear in logs, the user cancels, or the environment is not isolated. Show the full resource passport and remote-access warning before any later Mac command.

## Scenario matrix — 30 tests, 150 minutes

### A — Preflight (15 min)
A01 Verify actual version and source build are PD-20261112.1; stop on mismatch.
A02 Verify GitHub Pages build/deployment reports SUCCESS.
A03 Verify synthetic-only warning and right-arm wording.
A04 Verify sandbox boundary, resource limits, free disk, and maximum one Simulator.

### B — iPhone layout and keyboard (30 min)
B05 Portrait viewport 320px: no clipped controls.
B06 Portrait viewport 375px: no clipped controls.
B07 Portrait viewport 390px: no clipped controls.
B08 Portrait viewport 430px: no clipped controls.
B09 Landscape: controls readable and accessible.
B10 No unintended horizontal page drift on focus.
B11 Password keyboard and iOS focus zoom: upper login button visible; Go key available.

### C — Face ID and authorization (30 min)
C12 Face ID Password AutoFill fills an existing approved TEST account, but never auto-submits.
C13 Tap upper Войти while keyboard is visible; no need to dismiss keyboard.
C14 Tap keyboard Go to submit login once; no accidental signup.
C15 Invalid invented credentials show a safe error without tokens.
C16 Logout hides private test panels and clears session.
C17 Login again and reload; verify proper restoration without stale user data.

### D — Pressure journal (30 min)
D18 Validate systolic number and reject invalid/blank input without saving.
D19 Validate diastolic number and reject invalid/blank input without saving.
D20 Validate pulse number and reject invalid/blank input without saving.
D21 Check localized date/time picker and conversion without creating a record.
D22 [WRITE GATE] Insert ONE invented reading into approved TEST table; reload and verify.
D23 [ACCOUNT GATE] With two approved synthetic test accounts, verify user B cannot access user A's data.

### E — Stability, offline and privacy (30 min)
E24 Disconnect Internet only on the TEST device; verify graceful error.
E25 Restore Internet; safely reload without duplicate saves.
E26 [WRITE GATE] Two quick taps on Save may duplicate records; test only on disposable synthetic account after approval.
E27 [EMAIL GATE] Password recovery can send email: only approved test mailbox and separate authorization.
E28 Inspect sanitized console / QA logs for secrets, unexpected requests and Vault access; no sensitive screenshot uploads.

### F — Log/report and safe exit (15 min)
F29 PASS/FAIL/PARTIAL/BLOCKED table for all scenarios; include build, environment, error text and measured resources, redact all identifiers.
F30 Verify runner stopped, Mac settings unchanged, no unexpected work; check only approved technical Dropbox logs and note rollback path.

## Gates and acceptance criteria

By default, D22, D23, E26, E27 are BLOCKED until explicit permissions and TEST environment verification; do not silently mark as PASS. Any exposure of medical data, secrets, unauthorized write or cross-account leak is FAIL with immediate stop.

Full PASS requires evidence for each executed scenario and no critical security defects. PARTIAL for cancellation, missing physical iPhone verification or incomplete run. BLOCKED for missing permission, uncertain sandbox path, unavailable tools or unexpected environment. Failed checks are not auto-fixed in main.

## Output paths

Report prefix PAE04-DAY-QA-20261112- with SUMMARY.json, EVENTS.jsonl and redacted screenshots if approved.
Proposed logical Dropbox folder: /PERSONAL AI ECOSYSTEM/Health Tracker/03_Test_Reports/ . First confirm it is a registered, authorized sync location; NEVER guess a full iMac path. Read the delivered logs through Dropbox before reporting delivery PASS.

No automatic Work/Codex handoff is needed for preparation. Mac execution and new Supabase writes must be approved separately.
