import { test } from "@playwright/test";
import desktopConfig from "lighthouse/lighthouse-core/config/desktop-config.js";
import { mobileConfig } from "../../lighthouse/base";
import {
  runPerformanceAuditInMobile,
  runPerformanceAuditInDesktop,
} from "../../utils/helpers";
import { URLS } from "../../test-data/enum";

const data = URLS;

test.describe.configure({ mode: "serial" });

for (const key in data) {
  const value = data[key];

  test.describe(`Lighthouse Unauthorized Performance Test - ${key}`, () => {
    test(`Desktop Performance Audit - ${key}`, async ({ page }) => {
      await page.goto(value);
      await runPerformanceAuditInDesktop(
        page,
        `${test.info().title}-performance`,
        desktopConfig,
        `Unauthorized-performance-reports`
      );
    });

    test(`Mobile Performance Audit - ${key}`, async ({ page }) => {
      await page.goto(value);
      await runPerformanceAuditInMobile(
        page,
        `${test.info().title}-performance`,
        mobileConfig,
        `Unauthorized-performance-reports`
      );
    });
  });
}
