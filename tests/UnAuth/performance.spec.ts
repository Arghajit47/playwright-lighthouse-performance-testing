import { test } from "@playwright/test";
import desktopConfig from "lighthouse/lighthouse-core/config/desktop-config.js";
import { mobileConfig, tabletConfig } from "../../lighthouse/base";
import {
  runPerformanceAuditInMobile,
  runPerformanceAuditInDesktop,
  runPerformanceAuditInTablet,
  recordPerformanceMetrics,
  attachGraph,
} from "../../utils/helpers";
import { attachHtmlToAllureReport } from "../../utils/common";
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
    test(`Desktop performance audit ${key}`, async ({ page }, testInfo) => {
      await runPerformanceAuditInDesktop(
        page,
        `${test.info().title}`,
        desktopConfig,
        folders.desktopPath
      );
      await attachHtmlToAllureReport(
        test.info().title,
        folders.desktopPath,
        testInfo
      );
    });

    test(`Mobile performance audit ${key}`, async ({ page }, testInfo) => {
      await runPerformanceAuditInMobile(
        page,
        `${test.info().title}`,
        mobileConfig,
        folders.mobilePath
      );
      await attachHtmlToAllureReport(
        test.info().title,
        folders.mobilePath,
        testInfo
      );
    });

    test(`Tablet performance audit ${key}`, async ({ page }, testInfo) => {
      await runPerformanceAuditInTablet(
        page,
        `${test.info().title}`,
        tabletConfig,
        folders.tabletPath
      );
      await attachHtmlToAllureReport(
        test.info().title,
        folders.tabletPath,
        testInfo
      );
    });

    test.afterEach(async ({ page }, testInfo) => {
      await attachGraph(metricsRecorder, testInfo);
      // await page.close();
    });
  });
}
