# PAE-04 TEST — iPhone keyboard / Face ID autofill UX QA

Candidate: Pressure Demo v0.1.1 TEST; build PD-20261112.1.
Scope: synthetic test login page ONLY.

## Static checks performed
- Login button exists exactly once and is in auth header above both input fields.
- Input hints: email Next, password Go.
- Pressing Enter in email focuses password; pressing Enter in password calls existing auth("login") once per keydown and prevents default; IME composition is ignored.
- Auth, recovery, RLS-related request paths, data-save routines, endpoints and public API key unchanged.
- No automatic submit on password autofill: user must explicitly tap button or Go.

## Manual iPhone acceptance (PENDING)
1. In Safari, open version PD-20261112.1 after release; confirm version label.
2. Without credentials: focus email then password; confirm the upper login button remains visible above the keyboard.
3. Use iPhone Password AutoFill unlocked with Face ID on a TEST-only account; confirm no automatic submission and a visible login button.
4. On iOS keyboard, tap Go on password; confirm one login attempt and no unwanted extra signup requests.
5. Tap the header login button while keyboard open; confirm login works without tapping outside fields first.
6. Test sign out, password recovery controls, and no horizontal page drift at narrow screen widths.
7. Never input real medical records. Do not record or share passwords or tokens in QA screenshots.

Outcome: pending physical iPhone QA and successful GitHub Pages release; do not mark E2E PASS yet.
