import { test } from "@playwright/test";
import desktopConfig from "lighthouse/lighthouse-core/config/desktop-config.js";
import { mobileConfig, tabletConfig } from "../../lighthouse/base";
import {
  runPerformanceAuditInMobile,
  runPerformanceAuditInDesktop,
  runPerformanceAuditInTablet,
  recordPerformanceMetrics,
  attachGraph,
  createHtmlScreenshot,
} from "../../utils/helpers";
import { URLS, UNAUTHORIZED_PATHS } from "../../test-data/enum";

const data = URLS;
const folders = UNAUTHORIZED_PATHS;

test.describe.configure({ mode: "serial" });

for (const key in data) {
  const value = data[key];

  test.describe(`Lighthouse Unauthorized Performance Test - ${key}`, async () => {
    let metricsRecorder;
    test.beforeEach(async ({ page }) => {
      metricsRecorder = await recordPerformanceMetrics();
      await page.goto(value);
      await page.waitForLoadState("networkidle");
    });
    test(`Desktop performance audit ${key}`, async ({ page }) => {
      await runPerformanceAuditInDesktop(
        page,
        `${test.info().title}`,
        desktopConfig,
        folders.desktopPath
      );
    });

    test(`Mobile performance audit ${key}`, async ({ page }) => {
      await runPerformanceAuditInMobile(
        page,
        `${test.info().title}`,
        mobileConfig,
        folders.mobilePath
      );
    });

    test(`Tablet performance audit ${key}`, async ({ page }) => {
      await runPerformanceAuditInTablet(
        page,
        `${test.info().title}`,
        tabletConfig,
        folders.tabletPath
      );
    });

    test.afterEach(async ({ page }, testInfo) => {
      await attachGraph(metricsRecorder, testInfo, folders);
      await createHtmlScreenshot(folders, testInfo);
      await page.close();
    });
  });
}
