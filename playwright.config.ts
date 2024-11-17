import { defineConfig, devices } from '@playwright/test';


/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: ".",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: false,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  timeout: 3 * 1000 * 100, // this is the timeout for each individual test(step) - approximately 5min
  expect: {
    timeout: 15 * 1000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    headless: true,
    launchOptions: {
      // Specify the --remote-debugging-port option
      args: ["--remote-debugging-port=9222"],
    },

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 60 * 1000,
    actionTimeout: 20 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: /global.setup\.ts/,
    },
    {
      name: "Authorized_Test",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          slowMo: 3000,
          args: ["--window-size=1920,1080", "--remote-debugging-port=9222"],
          timeout: 300000,
        },
        viewport: { width: 1920, height: 1080 },
      },
      testDir: "./tests/Auth/",
    },
    {
      name: "Unauthorized_Test",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          slowMo: 3000,
          args: ["--window-size=1920,1080", "--remote-debugging-port=9222"],
          timeout: 300000,
        },
        viewport: { width: 1920, height: 1080 },
      },
      testDir: "./tests/UnAuth/",
    },
    {
      name: "Test",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          slowMo: 3000,
          args: ["--window-size=1920,1080", "--remote-debugging-port=9222"],
          timeout: 300000,
        },
        viewport: { width: 1920, height: 1080 },
      },
      testDir: "./tests/",
    },

    // {
    //   name: "firefox",
    //   dependencies: ['setup'],
    //   use: { ...devices["Desktop Firefox"]},
    // },

    // {
    //   name: "webkit",
    //   dependencies: ['setup'],
    //   use: { ...devices["Desktop Safari"]},
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ..devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
