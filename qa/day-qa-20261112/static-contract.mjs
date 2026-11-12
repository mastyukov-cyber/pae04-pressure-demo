// PAE-04 Day QA — static, read-only. Node.js 20+; no dependencies, no network, no writes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const folder = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(folder, "../../index.html"), "utf8");
const scriptBlocks = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const inlineScript = scriptBlocks.join("\n");
const has = (fragment) => html.includes(fragment);
const onlyOnce = (fragment) => html.split(fragment).length === 2;

const checks = [
  ["S01", "HTML doctype", () => /^\s*<!doctype html>/i.test(html)],
  ["S02", "Russian language declared", () => /<html lang="ru">/.test(html)],
  ["S03", "Mobile viewport declared", () => has('name="viewport"')],
  ["S04", "No forced browser zoom disable", () => !/user-scalable\s*=\s*no/i.test(html)],
  ["S05", "Version title pinned", () => has("Pressure Demo v0.1.1 TEST")],
  ["S06", "Visible version matches build", () => has('data-version="0.1.1" data-build="PD-20261112.1"')],
  ["S07", "Synthetic-only banner", () => has("ТЕСТОВАЯ ПЕСОЧНИЦА")],
  ["S08", "Right arm explicitly stated", () => has("правая рука")],
  ["S09", "Authentication panel preserved", () => has('id="authPanel"')],
  ["S10", "Exactly one login button", () => onlyOnce('id="login"')],
  ["S11", "Login button above email input", () => html.indexOf('id="login"') > 0 && html.indexOf('id="login"') < html.indexOf('id="email"')],
  ["S12", "Email has username autocomplete", () => /id="email"[^>]*autocomplete="username"/.test(html)],
  ["S13", "Email keyboard Next hint", () => /id="email"[^>]*enterkeyhint="next"/.test(html)],
  ["S14", "Password has current-password autocomplete", () => /id="password"[^>]*autocomplete="current-password"/.test(html)],
  ["S15", "Password keyboard Go hint", () => /id="password"[^>]*enterkeyhint="go"/.test(html)],
  ["S16", "Enter from email focuses password", () => inlineScript.includes('e.key==="Enter"') && inlineScript.includes('e.preventDefault();$("password").focus()')],
  ["S17", "Enter from password invokes explicit login", () => inlineScript.includes('$("password").blur();auth("login")')],
  ["S18", "Composition guard on Enter handler", () => inlineScript.includes('!e.isComposing')],
  ["S19", "No password input-triggered auto submit", () => !/\$\("password"\)\.addEventListener\("(?:input|change|keyup)"/.test(inlineScript)],
  ["S20", "No private Supabase service key literals", () => !/service_role|sb_secret_/i.test(html)],
  ["S21", "Only publishable Supabase key", () => has('const PUBLIC_KEY="sb_publishable_')],
  ["S22", "Test-only pressure table", () => has('const TABLE="pae04_qa_pressure_entries"')],
  ["S23", "Synthetic record flag", () => inlineScript.includes("synthetic_only:true")],
  ["S24", "Record owner bound to current session", () => inlineScript.includes("owner_id:session.user.id")],
  ["S25", "Session uses sessionStorage", () => inlineScript.includes('sessionStorage.setItem("pae04_qa_session_v1"')],
  ["S26", "Authenticated calls use Bearer token", () => inlineScript.includes('headers.Authorization="Bearer "+session.access_token')],
  ["S27", "Fetch uses omit credentials", () => inlineScript.includes('credentials:"omit"')],
  ["S28", "Status uses accessibility live region", () => /id="status"[^>]*aria-live="polite"/.test(html)],
  ["S29", "No remote script source or innerHTML writes", () => !/<script[^>]*\bsrc\s*=/i.test(html) && !/\.innerHTML\s*=/.test(inlineScript)],
  ["S30", "Inline JavaScript parses without executing", () => scriptBlocks.length === 1 && Boolean(new Script(inlineScript, { filename: "pae04-inline.js" }))],
];

const results = [];
for (const [id, label, fn] of checks) {
  try {
    assert.ok(fn(), label);
    results.push({ id, label, status: "PASS" });
  } catch {
    results.push({ id, label, status: "FAIL" });
  }
}
const failed = results.filter((r) => r.status === "FAIL");
const report = {
  project: "PAE-04",
  mode: "DAY_STATIC_READONLY",
  build_expected: "PD-20261112.1",
  status: failed.length ? "FAIL" : "PASS",
  checks_total: results.length,
  checks_pass: results.length - failed.length,
  checks_fail: failed.length,
  html_sha256: createHash("sha256").update(html).digest("hex"),
  network_requests: 0,
  database_writes: 0,
  vault_reads: 0,
  vault_writes: 0,
  results,
};
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
if (failed.length) process.exitCode = 1;
