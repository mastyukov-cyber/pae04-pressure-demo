'use strict';
// No stored auth/session state and no real medical data.
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './qa',
  testMatch: 'viewport.spec.cjs',
  timeout: 30000,
  expect: { timeout: 7000 },
  retries: 0,
  workers: 1,
  use: {
    browserName: 'webkit',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'node qa/serve.cjs',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: false,
    timeout: 15000,
  },
  outputDir: 'test-results',
  reporter: [['line']],
});
