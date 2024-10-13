import { playAudit } from "playwright-lighthouse";
import { test } from '@playwright/test';
import desktopConfig from 'lighthouse/lighthouse-core/config/desktop-config.js';
import {runPerformanceAuditInMobile, runPerformanceAuditInDesktop} from "../utils/helpers"

test.describe('Lighthouse Performance Test', () => {
  test('Home Page Performance Audit', async ({page}) => {
    await page.goto("https://nextbnb-three.vercel.app/")
    const setView = desktopConfig;
    await runPerformanceAuditInDesktop(page, setView, "https://nextbnb-three.vercel.app/", "b-performance");
  })
  
  test.skip('Desktop - About Page Performance Audit', async ({page}) => {
    const setView = desktopConfig;
    await page.goto("https://www.webpagetest.org/about")
    await runPerformanceAuditInDesktop(page, setView,"https://www.webpagetest.org/about", "about-page-performance");
  })

  test('Mobile - About Page Performance Audit', async ({page}) => {
    const setView = "lighthouse:default";
    // await page.goto("https://sagnik-ghosh.vercel.app/")
    await runPerformanceAuditInMobile(page, "https://nextbnb-three.vercel.app/", "a-performance");
  })
})