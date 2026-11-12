"use strict";
// PAE-04 v0.2.0 isolated synthetic-only iPhone WebKit smoke QA.
const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: "preview.spec.cjs",
  timeout: 30000,
  expect: { timeout: 7000 },
  retries: 0,
  workers: 1,
  fullyParallel: false,
  use: {
    browserName: "webkit",
    headless: true,
    viewport: { width: 390, height: 844 },
    locale: "ru-RU",
    screenshot: "only-on-failure",
    trace: "off",
    video: "off",
    serviceWorkers: "allow"
  },
  webServer: {
    command: "node qa/medications-v020/serve.cjs",
    url: "http://127.0.0.1:4173/preview/medications-v020/",
    reuseExistingServer: false,
    timeout: 20000
  },
  outputDir: "test-results/medications-v020",
  reporter: [["line"]]
});
