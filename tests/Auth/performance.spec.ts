import { test } from "@playwright/test";
import {
  mobileConfig,
  tabletConfig,
  desktopConfig,
} from "../../lighthouse/base";
import {
  runPerformanceAuditInMobile,
  runPerformanceAuditInDesktop,
  runPerformanceAuditInTablet,
  getCookies,
} from "../../utils/helpers.js";
import "dotenv/config";
import { URLS, AUTHORIZED_PATHS } from "../../test-data/enum";
import { attachHtmlToAllureReport } from "../../utils/common";

const data = URLS;
const folders = AUTHORIZED_PATHS;

test.describe.configure({ mode: "serial" });

for (const key in data) {
  const value = data[key as keyof typeof data];

  test.describe(`Lighthouse Authorized Performance Test - ${key}`, async () => {
    const cookies = getCookies();
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
    test(`Authorized Desktop Performance Audit ${key}`, async ({
      page,
    }, testInfo) => {
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

    test(`Authorized Mobile Performance Audit ${key}`, async ({
      page,
    }, testInfo) => {
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

    test(`Authorized Tablet Performance Audit ${key}`, async ({
      page,
    }, testInfo) => {
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

    test.afterEach(async ({ page }) => {
      await page.close();
    });
  });
}
