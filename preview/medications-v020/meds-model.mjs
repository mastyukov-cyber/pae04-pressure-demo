// TEST-ONLY, fictitious medicines, in-memory and offline. Do not use for real medical information.
export function createMedicationSandbox(owner = "qa-owner-a") {
  const CATALOG = Object.freeze([
    { id: "QA-CAT-A", name: "Тестовый препарат А" },
    { id: "QA-CAT-B", name: "Тестовый препарат Б" }
  ]);
  const allowed = new Set(["permanent", "course", "as_needed"]);
  let meds = [];
  let checks = [];
  let sequence = 1;
  const validDay = (day) => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day)
    && !Number.isNaN(Date.parse(day + "T00:00:00Z"))
    && new Date(day + "T00:00:00Z").toISOString().slice(0, 10) === day;
  const ensure = (cond, message) => { if (!cond) throw Error(message); };
  const copy = (value) => JSON.parse(JSON.stringify(value));
  function validSpec(spec) {
    ensure(spec && typeof spec === "object", "Invalid medication");
    ensure(typeof spec.name === "string" && /^Тестовый препарат [А-ЯA-Z0-9 -]{1,40}$/.test(spec.name), "Only fictitious QA medicine names permitted");
    ensure(allowed.has(spec.type), "Invalid medication type");
    if (spec.type === "course") {
      ensure(validDay(spec.start) && validDay(spec.end) && spec.start <= spec.end, "Course dates invalid");
    } else {
      ensure(spec.start == null && spec.end == null, "Only courses can have dates");
    }
  }
  function addManual(spec) {
    validSpec(spec);
    const item = { id: `qa-med-${sequence++}`, name: spec.name, type: spec.type, start: spec.start || null, end: spec.end || null };
    meds.push(item);
    return copy(item);
  }
  function addFromCatalog(id, type, dates = {}) {
    const found = CATALOG.find((x) => x.id === id);
    ensure(Boolean(found), "Catalog ID not found");
    return addManual({ name: found.name, type, ...dates });
  }
  function availableOn(med, day) {
    return med.type !== "course" || (day >= med.start && day <= med.end);
  }
  function plannedFor(day) {
    ensure(validDay(day), "Invalid day");
    return copy(meds.filter((med) => med.type !== "as_needed" && availableOn(med, day)));
  }
  function setTaken(id, day, taken = true) {
    ensure(validDay(day) && typeof taken === "boolean", "Invalid check input");
    const med = meds.find((m) => m.id === id);
    ensure(Boolean(med), "Unknown medication ID");
    ensure(availableOn(med, day), "Outside course window");
    const existing = checks.find((c) => c.medicationId === id && c.day === day);
    if (existing) existing.taken = taken;
    else checks.push({ medicationId: id, day, taken });
    return taken;
  }
  function wasTaken(id, day) { return Boolean(checks.find((c) => c.medicationId === id && c.day === day && c.taken)); }
  function history() { return copy(checks).sort((a, b) => a.day.localeCompare(b.day) || a.medicationId.localeCompare(b.medicationId)); }
  function list() { return copy(meds); }
  function catalog() { return copy(CATALOG); }
  function exportJson() {
    return JSON.stringify({ schema: "PAE04-MEDS-QA-1", owner, synthetic_only: true, medications: meds, checks });
  }
  function importJson(json) {
    let data;
    try { data = JSON.parse(json); } catch { throw Error("Invalid backup JSON"); }
    ensure(data && data.schema === "PAE04-MEDS-QA-1" && data.synthetic_only === true && data.owner === owner, "Invalid schema or cross-owner data");
    ensure(Array.isArray(data.medications) && Array.isArray(data.checks), "Invalid backup arrays");
    const ids = new Set();
    for (const item of data.medications) {
      validSpec(item);
      ensure(typeof item.id === "string" && /^qa-med-\d+$/.test(item.id) && !ids.has(item.id), "Invalid medication ID");
      ids.add(item.id);
    }
    const keys = new Set();
    for (const item of data.checks) {
      const med = data.medications.find((m) => m.id === item.medicationId);
      ensure(Boolean(med) && validDay(item.day) && typeof item.taken === "boolean", "Invalid intake entry");
      ensure(availableOn(med, item.day), "Invalid course intake");
      const key = item.medicationId + "/" + item.day;
      ensure(!keys.has(key), "Duplicate intake");
      keys.add(key);
    }
    const largest = Math.max(0, ...data.medications.map((m) => Number(m.id.slice(7))));
    meds = copy(data.medications);
    checks = copy(data.checks);
    sequence = largest + 1;
  }
  return Object.freeze({ addManual, addFromCatalog, plannedFor, setTaken, wasTaken, history, list, catalog, exportJson, importJson });
}
