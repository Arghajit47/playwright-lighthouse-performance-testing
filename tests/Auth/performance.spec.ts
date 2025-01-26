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
import "dotenv/config";
import { URLS, AUTHORIZED_PATHS } from "../../test-data/enum";
import { attachHtmlToAllureReport } from "../../utils/common";

const data = URLS;
const folders = AUTHORIZED_PATHS;

test.describe.configure({ mode: "serial" });

for (const key in data) {
  const value = data[key];

  test.describe(`Lighthouse Authorized Performance Test - ${key}`, async () => {
    let metricsRecorder;
    test.beforeEach(async ({ page }) => {
      metricsRecorder = await recordPerformanceMetrics();
      await page.goto(value);
      await page.waitForLoadState("networkidle");
      await page
        .locator(".gap-3 .border-neutral-200 svg")
        .click({ force: true });
      await page.click('//div[text()="Login"]', { force: true });
      await page.fill("#email", String(process.env.EMAIL), { force: true });
      await page.fill("#password", String(process.env.PASSWORD), {
        force: true,
      });
      await page.click('//button[text()="Continue"]', { force: true });
      await page.waitForLoadState("networkidle");
    });
    test(`Authorized Desktop Performance Audit ${key}`, async ({
      page,
    }, testInfo) => {
      await runPerformanceAuditInDesktop(
        page,
        `${test.info().title}`,
        desktopConfig,
        `performance-report/Authorized-performance-reports/Desktop`
      );
      await attachHtmlToAllureReport(
        test.info().title,
        folders.desktopPath,
        testInfo
      );
    });

    test(`Authorized Mobile Performance Audit ${key}`, async ({
      page,
    }, testInfo) => {
      await runPerformanceAuditInMobile(
        page,
        `${test.info().title}`,
        mobileConfig,
        `performance-report/Authorized-performance-reports/Mobile`
      );
      await attachHtmlToAllureReport(
        test.info().title,
        folders.mobilePath,
        testInfo
      );
    });

    test(`Authorized Tablet Performance Audit ${key}`, async ({
      page,
    }, testInfo) => {
      await runPerformanceAuditInMobile(
        page,
        `${test.info().title}`,
        tabletConfig,
        `performance-report/Authorized-performance-reports/Tablet`
      );
      await attachHtmlToAllureReport(
        test.info().title,
        folders.tabletPath,
        testInfo
      );
    });

    test.afterEach(async ({ page }, testInfo) => {
      await attachGraph(metricsRecorder, testInfo);
    });
  });
}
