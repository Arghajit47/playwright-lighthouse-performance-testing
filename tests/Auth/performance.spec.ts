import { test } from "@playwright/test";
import desktopConfig from "lighthouse/lighthouse-core/config/desktop-config.js";
import { mobileConfig } from "../../lighthouse/base";
import {
  runPerformanceAuditInMobile,
  runPerformanceAuditInDesktop,
} from "../../utils/helpers";
import "dotenv/config";
import { URLS } from "../../test-data/enum";

const data = URLS;

test.describe.configure({ mode: "serial" });

for (const key in data) {
  const value = data[key];

  test.describe(`Lighthouse Authorized Performance Test - ${key}`, () => {
    test(`Authorized Desktop Performance Audit - ${key}`, async ({ page }) => {
      await page.goto(value);
      await page.waitForLoadState("networkidle");
      await page
        .locator(".gap-3 .border-neutral-200 svg")
        .click({ force: true });
      await page.click('//div[text()="Login"]');
      await page.fill("#email", String(process.env.EMAIL));
      await page.fill("#password", String(process.env.PASSWORD));
      await page.click('//button[text()="Continue"]');
      await page.waitForLoadState("networkidle");
      await runPerformanceAuditInDesktop(
        page,
        `${test.info().title}-performance`,
        desktopConfig,
        `Authorized-performance-reports`
      );
    });

    test(`Authorized Mobile Performance Audit - ${key}`, async ({ page }) => {
      await page.goto(value);
      await page.waitForLoadState("networkidle");
      await page
        .locator(".gap-3 .border-neutral-200 svg")
        .click({ force: true });
      await page.click('//div[text()="Login"]');
      await page.fill("#email", String(process.env.EMAIL));
      await page.fill("#password", String(process.env.PASSWORD));
      await page.click('//button[text()="Continue"]');
      await page.waitForLoadState("networkidle");
      await runPerformanceAuditInMobile(
        page,
        `${test.info().title}-performance`,
        mobileConfig,
        `Authorized-performance-reports`
      );
    });
  });
}
