// Static contract checks for isolated TEST medication UI. No network, no writes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const folder = resolve(dirname(fileURLToPath(import.meta.url)), "../../preview/medications-v020");
const read = (filename) => readFileSync(resolve(folder, filename), "utf8");
const html = read("index.html");
const css = read("styles.css");
const app = read("app.mjs");
const worker = read("sw.js");
const model = read("meds-model.mjs");
const cases = [
  ["P01", "Version pinned to v0.2.0 TEST", () => html.includes('data-version="0.2.0" data-build="MT-20261112.1"')],
  ["P02", "Explicit synthetic-only notice", () => html.includes("Только тестовые данные.") && html.includes("СИНТЕТИКА")],
  ["P03", "No real medication names", () => !/(Эдарби|Липримар|Беталок|Эспиро)/i.test(html + app + model)],
  ["P04", "Navigation has 3 tabs", () => ["today","medicines","history"].every(k => html.includes('id="tab-' + k + '"'))],
  ["P05", "Tab panels are semantically associated", () => ["today","medicines","history"].every(k => html.includes('role="tabpanel" aria-labelledby="tab-' + k + '"'))],
  ["P06", "Manual and catalog addition", () => html.includes('id="med-source"') && app.includes("medications.addManual(") && app.includes("medications.addFromCatalog(")],
  ["P07", "Permanent, course, as-needed choices", () => ["permanent","course","as_needed"].every(k => html.includes('value="' + k + '"'))],
  ["P08", "One tap checkbox and history", () => app.includes('box.type = "checkbox"') && app.includes("medications.setTaken(") && app.includes("medications.history()")],
  ["P09", "No reminder or notification API", () => !/(Notification\s*\(|Notification\.requestPermission|showNotification|pushManager|setInterval\s*\()/i.test(app + model + worker)],
  ["P10", "Synthetic backup export only", () => app.includes("medications.exportJson()") && app.includes("PAE04-MEDS-SYNTHETIC-v020.json")],
  ["P11", "Local-only storage key", () => app.includes('pae04_meds_preview_v020_SYNTHETIC_ONLY') && !/supabase\.co|apikey|Authorization:\s*Bearer/.test(app + worker + model)],
  ["P12", "No HTML insertion of untrusted names", () => !/innerHTML\s*=|insertAdjacentHTML\s*\(/.test(app)],
  ["P13", "CSP disallows remote connections", () => html.includes("connect-src 'none'") && html.includes("default-src 'none'")],
  ["P14", "Separate preview with own service worker scope", () => app.includes('register("./sw.js", { scope: "./" })') && worker.includes("pae04-medications-preview-")],
  ["P15", "Only same-origin static GET handled in worker", () => worker.includes('request.method !== "GET"') && worker.includes("url.origin !== self.location.origin")],
  ["P16", "Responsive iPhone keyboard sheet", () => css.includes("position:sticky") && css.includes("max-height:min(90dvh,840px)")],
  ["P17", "No pressure data references", () => !/(pae04_qa_pressure_entries|systolic|diastolic|pulse)/i.test(html + css + app + model + worker)],
  ["P18", "No external library or CDN", () => !/https?:\/\//i.test(html + css + app + worker + model)],
];
const results = [];
for (const [id, title, test] of cases) {
  try { assert.ok(test(), title); results.push({id, title, status:"PASS"}); }
  catch { results.push({id, title, status:"FAIL"}); }
}
const failed = results.filter(x => x.status==="FAIL");
process.stdout.write(JSON.stringify({project:"PAE-04",mode:"MEDICATIONS_V020_STATIC",total:cases.length,pass:cases.length-failed.length,fail:failed.length,status:failed.length?"FAIL":"PASS",results},null,2)+"\n");
if(failed.length) process.exitCode=1;
