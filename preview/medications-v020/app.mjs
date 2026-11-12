import { createMedicationSandbox } from "./meds-model.mjs";
// TEST-only: fictitious medicines. No Supabase, patient records or clinical advice.
const STORAGE_KEY = "pae04_meds_preview_v020_SYNTHETIC_ONLY";
const OWNER = "qa-medications-preview";
const $ = (id) => document.getElementById(id);
let medications = createMedicationSandbox(OWNER);
function isoLocalDate(date = new Date()) {
  const p = (x) => String(x).padStart(2, "0");
  return date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate());
}
function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoLocalDate(d);
}
function prettyDay(day) {
  return new Date(day + "T12:00:00").toLocaleDateString("ru-RU", {
    year: "numeric", month: "short", day: "numeric"
  });
}
function status(message, error = false) {
  $("app-status").textContent = message;
  $("app-status").classList.toggle("error", error);
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, medications.exportJson());
    return true;
  } catch {
    status("Сохранение в браузере недоступно. Отметки действуют только до обновления страницы.", true);
    return false;
  }
}
function seedDemo() {
  medications.addFromCatalog("QA-CAT-A", "permanent");
  medications.addFromCatalog("QA-CAT-B", "as_needed");
  medications.addManual({
    name: "Тестовый препарат В",
    type: "course",
    start: offsetDate(-2),
    end: offsetDate(5)
  });
}
function initializeModel() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      medications.importJson(saved);
      status("Тестовые данные загружены из этого браузера.");
      return;
    }
    seedDemo();
    if (persist()) status("Добавлены три вымышленных препарата для демонстрации.");
  } catch {
    medications = createMedicationSandbox(OWNER);
    seedDemo();
    status("Хранилище недоступно или тестовые данные повреждены. Показана временная демонстрация.", true);
  }
}
function kindLabel(med) {
  if (med.type === "permanent") return "Постоянный";
  if (med.type === "as_needed") return "По необходимости";
  return "Курс · " + prettyDay(med.start) + " — " + prettyDay(med.end);
}
function emptyRow(label) {
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = label;
  return li;
}
function medicationRow(med, day, selectable) {
  const li = document.createElement("li");
  li.className = "med-row";
  const checked = selectable && medications.wasTaken(med.id, day);
  if (checked) li.classList.add("is-taken");
  const icon = document.createElement("span");
  icon.className = "med-icon";
  icon.textContent = checked ? "✓" : "✚";
  icon.setAttribute("aria-hidden", "true");
  const info = document.createElement("div");
  info.className = "med-info";
  const title = document.createElement("strong");
  title.textContent = med.name;
  const description = document.createElement("small");
  description.textContent = kindLabel(med);
  info.append(title, description);
  li.append(icon, info);
  if (selectable) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "med-checkbox";
    box.checked = checked;
    box.setAttribute("aria-label", "Принято: " + med.name + ", " + prettyDay(day));
    box.addEventListener("change", () => {
      try {
        medications.setTaken(med.id, day, box.checked);
        const stored = persist();
        renderAll();
        if (stored) status(box.checked ? "Приём отмечен в тестовом журнале." : "Отметка тестового приёма снята.");
      } catch {
        status("Не удалось изменить отметку. Проверьте дату и режим приёма.", true);
        renderAll();
      }
    });
    li.append(box);
  }
  return li;
}
function renderToday() {
  const day = $("day").value;
  const planned = medications.plannedFor(day);
  const onDemand = medications.list().filter((item) => item.type === "as_needed");
  const all = [...planned, ...onDemand];
  const done = all.filter((item) => medications.wasTaken(item.id, day)).length;
  $("count-done").textContent = String(done);
  $("count-planned").textContent = String(planned.length);
  const plannedList = $("planned-list");
  const optionalList = $("asneeded-list");
  plannedList.replaceChildren();
  optionalList.replaceChildren();
  if (!planned.length) plannedList.append(emptyRow("На выбранную дату постоянных и курсовых препаратов нет."));
  for (const med of planned) plannedList.append(medicationRow(med, day, true));
  if (!onDemand.length) optionalList.append(emptyRow("Ситуативных тестовых препаратов пока нет."));
  for (const med of onDemand) optionalList.append(medicationRow(med, day, true));
}
function renderMedicines() {
  const list = medications.list();
  $("medicines-count").textContent = list.length + " шт.";
  const target = $("all-medicines-list");
  target.replaceChildren();
  if (!list.length) target.append(emptyRow("Список пуст. Добавьте вымышленный препарат."));
  for (const med of list) target.append(medicationRow(med, null, false));
}
function renderHistory() {
  const all = medications.list();
  const names = new Map(all.map((item) => [item.id, item]));
  const entries = medications.history().filter((x) => x.taken).reverse();
  const target = $("history-list");
  target.replaceChildren();
  if (!entries.length) target.append(emptyRow("Пока нет отмеченных тестовых приёмов."));
  for (const entry of entries) {
    const med = names.get(entry.medicationId);
    if (!med) continue;
    const li = document.createElement("li");
    li.className = "med-row is-taken";
    const icon = document.createElement("span");
    icon.className = "med-icon";
    icon.textContent = "✓";
    icon.setAttribute("aria-hidden", "true");
    const info = document.createElement("div");
    info.className = "med-info";
    const title = document.createElement("strong");
    title.textContent = med.name;
    const subtitle = document.createElement("small");
    subtitle.textContent = prettyDay(entry.day) + " · " + kindLabel(med);
    info.append(title, subtitle);
    li.append(icon, info);
    target.append(li);
  }
}
function renderAll() { renderToday(); renderMedicines(); renderHistory(); }
function setTab(selected) {
  for (const tab of document.querySelectorAll(".tab")) {
    const active = tab.dataset.tab === selected;
    tab.classList.toggle("selected", active);
    tab.setAttribute("aria-selected", String(active));
  }
  for (const view of ["today", "medicines", "history"]) $("view-" + view).hidden = selected !== view;
}
function syncForm() {
  const source = $("med-source").value;
  const isCourse = $("med-type").value === "course";
  $("catalog-field").hidden = source !== "catalog";
  $("manual-field").hidden = source !== "manual";
  $("course-fields").hidden = !isCourse;
  $("med-name").required = source === "manual";
  $("med-start").required = isCourse;
  $("med-end").required = isCourse;
  $("form-error").hidden = true;
}
function openAdd() {
  $("med-form").reset();
  $("med-start").value = isoLocalDate();
  $("med-end").value = offsetDate(7);
  syncForm();
  $("add-dialog").showModal();
}
function closeAdd() { $("add-dialog").close(); }
function addMedication(event) {
  event.preventDefault();
  const type = $("med-type").value;
  const dates = type === "course" ? {start: $("med-start").value, end: $("med-end").value} : {};
  try {
    if ($("med-source").value === "catalog") {
      medications.addFromCatalog($("med-catalog").value, type, dates);
    } else {
      medications.addManual({ name: $("med-name").value.trim(), type, ...dates });
    }
    const stored = persist();
    closeAdd();
    renderAll();
    setTab("medicines");
    if (stored) status("Вымышленный препарат добавлен в локальную тестовую песочницу.");
  } catch {
    $("form-error").textContent = "Проверьте вымышленное название, тип и даты курса. Реальные препараты добавлять нельзя.";
    $("form-error").hidden = false;
  }
}
function downloadBackup() {
  const blob = new Blob([medications.exportJson()], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "PAE04-MEDS-SYNTHETIC-v020.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status("Подготовлен локальный JSON только с синтетическими данными лекарств.");
}
function resetData() {
  if (!window.confirm("Очистить только вымышленные тестовые препараты и отметки этого прототипа?")) return;
  medications = createMedicationSandbox(OWNER);
  const stored = persist();
  renderAll();
  setTab("today");
  if (stored) status("Тестовые препараты и отметки очищены. Журнал давления не затронут.");
}

$("day").value = isoLocalDate();
initializeModel();
renderAll();
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setTab(tab.dataset.tab));
});
$("day").addEventListener("change", () => {
  try { renderToday(); status("Выбрана дата " + prettyDay($("day").value) + "."); }
  catch { $("day").value = isoLocalDate(); renderToday(); status("Недействительная дата. Показан текущий день.", true); }
});
$("jump-today").addEventListener("click", () => { $("day").value = isoLocalDate(); renderToday(); });
$("open-add").addEventListener("click", openAdd);
$("open-add-secondary").addEventListener("click", openAdd);
$("close-add").addEventListener("click", closeAdd);
$("med-source").addEventListener("change", syncForm);
$("med-type").addEventListener("change", syncForm);
$("med-form").addEventListener("submit", addMedication);
$("download-backup").addEventListener("click", downloadBackup);
$("reset-data").addEventListener("click", resetData);
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
    // Offline mode depends on browser caching and still needs iPhone E2E verification.
  });
}
