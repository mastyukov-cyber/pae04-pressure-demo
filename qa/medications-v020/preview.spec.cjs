// WebKit smoke tests of isolated synthetic medications preview only.
// Never authenticate, call Supabase, or input real patient/medication data.
const { test, expect } = require("@playwright/test");
const target = "http://127.0.0.1:4173/preview/medications-v020/";

test("iPhone: version and three synthetic starter medicines", async ({page}) => {
  await page.goto(target);
  await expect(page.locator("#pae04-build")).toContainText("MT-20261112.1");
  await expect(page.locator(".test-pill")).toContainText("СИНТЕТИКА");
  await expect(page.locator("#planned-list .med-row")).toHaveCount(2);
  await expect(page.locator("#asneeded-list .med-row")).toHaveCount(1);
  await page.getByRole("tab",{name:"Препараты"}).click();
  await expect(page.locator("#all-medicines-list .med-row")).toHaveCount(3);
  await expect(page.locator("#view-today")).toBeHidden();
});

test("iPhone: checkmark, history, reload local persistence and undo", async ({page}) => {
  await page.goto(target);
  const first = page.locator("#planned-list input[type=checkbox]").first();
  await first.check();
  await expect(page.locator("#count-done")).toHaveText("1");
  await page.getByRole("tab",{name:"История"}).click();
  await expect(page.locator("#history-list .med-row")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("#count-done")).toHaveText("1");
  await page.locator("#planned-list input[type=checkbox]").first().uncheck();
  await page.getByRole("tab",{name:"История"}).click();
  await expect(page.locator("#history-list .empty")).toBeVisible();
});

test("iPhone: add manual and catalog test medicines", async ({page}) => {
  await page.goto(target);
  await page.getByRole("button",{name:"+ Добавить",exact:true}).click();
  await expect(page.locator("#add-dialog")).toBeVisible();
  await page.locator("#med-source").selectOption("manual");
  await page.locator("#med-name").fill("Тестовый препарат Г");
  await page.locator("#med-type").selectOption("permanent");
  await page.locator("#save-med").click();
  await expect(page.locator("#add-dialog")).toBeHidden();
  await expect(page.locator("#all-medicines-list .med-row")).toHaveCount(4);
  await page.locator("#open-add-secondary").click();
  await page.locator("#med-catalog").selectOption("QA-CAT-B");
  await page.locator("#med-type").selectOption("course");
  await expect(page.locator("#course-fields")).toBeVisible();
  await page.locator("#med-start").fill("2026-11-10");
  await page.locator("#med-end").fill("2026-11-20");
  await page.locator("#save-med").click();
  await expect(page.locator("#all-medicines-list .med-row")).toHaveCount(5);
});

test("iPhone: reject non-synthetic names and invalid course dates", async ({page}) => {
  await page.goto(target);
  await page.locator("#open-add").click();
  await page.locator("#med-source").selectOption("manual");
  await page.locator("#med-name").fill("Настоящий препарат");
  await page.locator("#save-med").click();
  await expect(page.locator("#form-error")).toBeVisible();
  await expect(page.locator("#add-dialog")).toBeVisible();
  await page.locator("#med-name").fill("Тестовый препарат Д");
  await page.locator("#med-type").selectOption("course");
  await page.locator("#med-start").fill("2026-11-20");
  await page.locator("#med-end").fill("2026-11-10");
  await page.locator("#save-med").click();
  await expect(page.locator("#form-error")).toBeVisible();
  await page.locator("#close-add").click();
  await expect(page.locator("#all-medicines-list .med-row")).toHaveCount(0);
  await page.getByRole("tab",{name:"Препараты"}).click();
  await expect(page.locator("#all-medicines-list .med-row")).toHaveCount(3);
});

test("iPhone: no horizontal drift across portrait and landscape sizes", async ({page}) => {
  for (const [w,h] of [[320,690],[375,812],[390,844],[430,932],[844,390]]) {
    await page.setViewportSize({width:w,height:h});
    await page.goto(target);
    const width = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth
    }));
    expect(width.document, "document overflow at "+w+"x"+h).toBeLessThanOrEqual(width.viewport+1);
    expect(width.body, "body overflow at "+w+"x"+h).toBeLessThanOrEqual(width.viewport+1);
    await expect(page.locator("#open-add")).toBeVisible();
  }
});

test("iPhone: synthetic wipe requires confirmation and survives reload", async ({page}) => {
  await page.goto(target);
  page.once("dialog", async dialog => await dialog.dismiss());
  await page.locator("#reset-data").click();
  await expect(page.locator("#planned-list .med-row")).toHaveCount(2);
  page.once("dialog", async dialog => await dialog.accept());
  await page.locator("#reset-data").click();
  await expect(page.locator("#planned-list .empty")).toBeVisible();
  await page.getByRole("tab",{name:"Препараты"}).click();
  await expect(page.locator("#all-medicines-list .empty")).toBeVisible();
  await page.reload();
  await expect(page.locator("#planned-list .empty")).toBeVisible();
});

test("iPhone: no requests to Supabase or remote URLs", async ({page}) => {
  const external = [];
  page.on("request", req => {
    if (!req.url().startsWith("http://127.0.0.1:4173/")) external.push(req.url());
  });
  await page.goto(target);
  await page.getByRole("tab",{name:"История"}).click();
  await page.locator("#open-add").click();
  await page.locator("#close-add").click();
  expect(external).toEqual([]);
});

test("iPhone: synthetic offline shell works after service worker activation", async ({page,context}) => {
  await page.goto(target);
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("WebKit has no service worker");
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve,reject) => {
        const timeout = setTimeout(() => reject(new Error("service worker did not take control")), 8000);
        navigator.serviceWorker.addEventListener("controllerchange", () => {clearTimeout(timeout);resolve();},{once:true});
      });
    }
  });
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.locator("#pae04-build")).toContainText("v0.2.0 TEST");
    await expect(page.locator("#planned-list .med-row")).toHaveCount(2);
  } finally {
    await context.setOffline(false);
  }
});
