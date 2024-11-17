import { test } from "@playwright/test";
import desktopConfig from "lighthouse/lighthouse-core/config/desktop-config.js";
import { mobileConfig, tabletConfig } from "../../lighthouse/base";
import {
  runPerformanceAuditInMobile,
  runPerformanceAuditInDesktop,
  runPerformanceAuditInTablet,
} from "../../utils/helpers";
import "dotenv/config";
import { URLS } from "../../test-data/enum";

const data = URLS;

test.describe.configure({ mode: "serial" });

for (const key in data) {
  const value = data[key];

  test.describe(`Lighthouse Authorized Performance Test - ${key}`, async () => {
    test.beforeEach(async ({ page }) => {
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
    test(`Authorized Desktop Performance Audit - ${key}`, async ({ page }) => {
      await runPerformanceAuditInDesktop(
        page,
        `${test.info().title}-performance`,
        desktopConfig,
        `performance-report/Authorized-performance-reports/Desktop`
      );
    });

    test(`Authorized Mobile Performance Audit - ${key}`, async ({ page }) => {
      await runPerformanceAuditInMobile(
        page,
        `${test.info().title}-performance`,
        mobileConfig,
        `performance-report/Authorized-performance-reports/Mobile`
      );
    });

    test(`Authorized Tablet Performance Audit - ${key}`, async ({ page }) => {
      await runPerformanceAuditInMobile(
        page,
        `${test.info().title}-performance`,
        tabletConfig,
        `performance-report/Authorized-performance-reports/Tablet`
      );
    });

    test.afterEach(async ({ page }) => {
      await page.close();
    });
  });
}
