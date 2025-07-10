import { test } from "@playwright/test";
import {
  desktopConfig,
  mobileConfig,
  tabletConfig,
} from "../../lighthouse/base";
import {
  runPerformanceAuditInMobile,
  runPerformanceAuditInDesktop,
  runPerformanceAuditInTablet,
  recordPerformanceMetrics,
  attachGraph,
  getCookies,
} from "../../utils/helpers.js";
import { attachHtmlToAllureReport } from "../../utils/common";
import { URLS, UNAUTHORIZED_PATHS } from "../../test-data/enum";

const data = URLS;
const folders = UNAUTHORIZED_PATHS;

test.describe.configure({ mode: "serial" });

for (const key in data) {
  const value = data[key];

  test.describe(`Lighthouse Unauthorized Performance Test - ${key}`, async () => {
    let metricsRecorder;
    const cookies = getCookies();
    test.beforeEach(async ({ page }) => {
      metricsRecorder = await recordPerformanceMetrics();
      await page.goto(value);
      await page.waitForLoadState("networkidle");
    });
    test(`Desktop performance audit ${key}`, async ({ page }, testInfo) => {
      await runPerformanceAuditInDesktop(
        cookies,
        value,
        desktopConfig,
        folders.desktopPath,
        `${test.info().title}`
      );
      await attachHtmlToAllureReport(
        test.info().title,
        folders.desktopPath,
        testInfo
      );
    });

    test(`Mobile performance audit ${key}`, async ({ page }, testInfo) => {
      await runPerformanceAuditInMobile(
        cookies,
        value,
        mobileConfig,
        folders.mobilePath,
        `${test.info().title}`
      );
      await attachHtmlToAllureReport(
        test.info().title,
        folders.mobilePath,
        testInfo
      );
    });

    test(`Tablet performance audit ${key}`, async ({ page }, testInfo) => {
      await runPerformanceAuditInTablet(
        cookies,
        value,
        tabletConfig,
        folders.tabletPath,
        `${test.info().title}`
      );
      await attachHtmlToAllureReport(
        test.info().title,
        folders.tabletPath,
        testInfo
      );
    });

    test.afterEach(async ({ page }, testInfo) => {
      await attachGraph(metricsRecorder, testInfo);
      await page.close();
    });
  });
}
