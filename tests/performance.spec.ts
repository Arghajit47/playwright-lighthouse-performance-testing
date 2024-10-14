import { playAudit } from "playwright-lighthouse";
import { test } from '@playwright/test';
import desktopConfig from 'lighthouse/lighthouse-core/config/desktop-config.js';
import {runPerformanceAuditInMobile, runPerformanceAuditInDesktop} from "../utils/helpers";
const data = require("../url.json");

for (const key in data) {
  const value = data[key];

  test.describe(`Lighthouse Performance Test - ${key}`, () => {
    test(`Performance Audit - ${key}`, async ({ page }) => {
      await page.goto(value);
      const setView = desktopConfig;
      await runPerformanceAuditInDesktop(
        page,
        setView,
        value,
        `${key}-desktop-performance`
      );
    });

    test(`Mobile - Performance Audit - ${key}`, async ({ page }) => {
      const setView = "lighthouse:default";
      await page.goto(value);
      await runPerformanceAuditInMobile(
        page,
        value,
        `${key}-mobile-performance`
      );
    });
  });
}