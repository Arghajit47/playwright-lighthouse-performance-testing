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
import { URLS } from "../../test-data/enum";

const data = URLS;

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
        `performance-report/Unauthorized-performance-reports/Desktop`
      );
    });

    test(`Mobile performance audit ${key}`, async ({ page }) => {
      await runPerformanceAuditInMobile(
        page,
        `${test.info().title}`,
        mobileConfig,
        `performance-report/Unauthorized-performance-reports/Mobile`
      );
    });

    test(`Tablet performance audit ${key}`, async ({ page }) => {
      await runPerformanceAuditInTablet(
        page,
        `${test.info().title}`,
        tabletConfig,
        `performance-report/Unauthorized-performance-reports/Tablet`
      );
    });

    test.afterEach(async ({ page }, testInfo) => {
      await page.close();
      await attachGraph(metricsRecorder, testInfo);
    });
  });
}
