import fs from "fs";
import * as path from "path";
// import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";
import "dotenv/config";

import Database from "better-sqlite3";

// 1. Initialize the database connection.
// This will create the 'lighthouse_performance.db' file in your project root if it doesn't exist.
// const db = new Database("lighthouse_performance.db", { verbose: console.log });
const db = process.env.CI
  ? new Database(`lighthouse_performance_${process.env.DEVICE_TYPE}.db`, {
      verbose: console.log,
    })
  : new Database("lighthouse_performance.db", { verbose: console.log });

// 2. Define the table schema and create the table if it doesn't exist.
// This is a crucial step. This code will only run once to set up the table.
const createTableStmt = `
CREATE TABLE IF NOT EXISTS performance_matrix (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    performance INTEGER NOT NULL,
    accessibility INTEGER NOT NULL,
    best_practice INTEGER NOT NULL,
    seo INTEGER NOT NULL,
    device_type TEXT NOT NULL,
    test_name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
db.exec(createTableStmt);

// Add a function to gracefully close the database connection when the script exits
process.on("exit", () => db.close());

/**
 * Runs a Lighthouse performance audit in a headless desktop browser, saves the HTML report, and records scores to the local performance database.
 *
 * @param cookies - Array of Puppeteer-compatible cookie objects to apply to the browser session before auditing.
 * @param url - The URL to audit.
 * @param config - Lighthouse configuration object to use for the audit.
 * @param outputPath - Directory path where the HTML report file will be written.
 * @param reportName - Base filename (without extension) to use for the saved HTML report and for the recorded test name.
 * @throws Error - If Lighthouse returns no result, missing `lhr`, or missing `report`.
 */
export async function runPerformanceAuditInDesktop(
  cookies: any[],
  url: string,
  config: object,
  outputPath: string,
  reportName: string
) {
  const lighthouse = await import("lighthouse");

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 50,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setCookie(...cookies);
  const result = await lighthouse.default(
    url,
    {
      port: parseInt(new URL(browser.wsEndpoint()).port),
      output: "html",
      logLevel: "silent",
      disableStorageReset: true,
    },
    config
  ) as any;

  if (!result || !result.lhr || !result.report) {
    throw new Error('Lighthouse audit failed or returned invalid results');
  }

  const { lhr, report } = result;

  // Ensure the output directory exists
  const directory = path.dirname(path.join(outputPath, `${reportName}.html`));
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true }); // Create parent directories if they don't exist
  }

  // Write the Lighthouse report to the file
  fs.writeFileSync(path.join(outputPath, `${reportName}.html`), report);

  console.log(
    `Performance score for ${reportName}:`,
    lhr.categories.performance.score * 100
  );
  // Lighthouse scores extracted from result
  const record = {
    performance: lhr.categories.performance.score * 100 || 0,
    accessibility: lhr.categories.accessibility.score * 100 || 0,
    best_practice: lhr.categories["best-practices"].score * 100 || 0,
    seo: lhr.categories.seo.score * 100 || 0,
    device_type: "desktop",
    test_name: `${reportName}`,
    url: url,
  };

  // // Call Supabase function to insert the record
  await insertLighthousePerformanceRecord(record);

  await browser.close();
}

/**
 * Runs a Lighthouse performance audit for the given URL using a mobile browser context and saves the HTML report.
 *
 * @param cookies - Array of Puppeteer cookie objects to set on the page before auditing.
 * @param url - The target URL to audit.
 * @param config - Lighthouse configuration object to pass to the auditor.
 * @param outputPath - Directory path where the HTML report will be written.
 * @param reportName - Base filename (without extension) used for the saved report and test name.
 * @throws Error if Lighthouse returns no result, no `lhr`, or no `report`.
 */
export async function runPerformanceAuditInMobile(
  cookies: any[],
  url: string,
  config: object,
  outputPath: string,
  reportName: string
) {
  const lighthouse = await import("lighthouse");

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 50,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setCookie(...cookies);
  const result = (await lighthouse.default(
    url,
    {
      port: parseInt(new URL(browser.wsEndpoint()).port),
      output: "html",
      logLevel: "silent",
      disableStorageReset: true,
    },
    config
  )) as any;

  if (!result || !result.lhr || !result.report) {
    throw new Error('Lighthouse audit failed or returned invalid results');
  }

  const { lhr, report } = result;

  // Ensure the output directory exists
  const directory = path.dirname(path.join(outputPath, `${reportName}.html`));
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true }); // Create parent directories if they don't exist
  }

  // Write the Lighthouse report to the file
  fs.writeFileSync(path.join(outputPath, `${reportName}.html`), report);

  console.log(
    `Performance score for ${reportName}:`,
    lhr.categories.performance.score * 100
  );
  // Lighthouse scores extracted from result
  const record = {
    performance: lhr.categories.performance.score * 100 || 0,
    accessibility: lhr.categories.accessibility.score * 100 || 0,
    best_practice: lhr.categories["best-practices"].score * 100 || 0,
    seo: lhr.categories.seo.score * 100 || 0,
    device_type: "mobile",
    test_name: `${reportName}`,
    url: url,
  };

  // // Call Supabase function to insert the record
  await insertLighthousePerformanceRecord(record);

  await browser.close();
}

/**
 * Runs a Lighthouse performance audit emulating a tablet, writes the HTML report to disk, and records the extracted scores in the local database.
 *
 * @param cookies - Puppeteer cookie objects to set on the page before auditing
 * @param url - The target page URL to audit
 * @param config - Lighthouse configuration object to apply to the audit
 * @param outputPath - Directory path where the HTML report will be written (report file will be named `${reportName}.html`)
 * @param reportName - Base filename (without extension) used for the generated report and test name
 * @throws Error if the Lighthouse audit fails or returns invalid results (missing `lhr` or `report`)
 */
export async function runPerformanceAuditInTablet(
  cookies: any,
  url: string,
  config: object,
  outputPath: string,
  reportName: string
) {
  const lighthouse = await import("lighthouse");

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 50,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setCookie(...cookies);
  const result = (await lighthouse.default(
    url,
    {
      port: parseInt(new URL(browser.wsEndpoint()).port),
      output: "html",
      logLevel: "silent",
      disableStorageReset: true,
    },
    config
  )) as any;

  if (!result || !result.lhr || !result.report) {
    throw new Error('Lighthouse audit failed or returned invalid results');
  }

  const { lhr, report } = result;

  // Ensure the output directory exists
  const directory = path.dirname(path.join(outputPath, `${reportName}.html`));
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true }); // Create parent directories if they don't exist
  }

  // Write the Lighthouse report to the file
  fs.writeFileSync(path.join(outputPath, `${reportName}.html`), report);

  console.log(
    `Performance score for ${reportName}:`,
    lhr.categories.performance.score * 100
  );
  // Lighthouse scores extracted from result
  const record = {
    performance: lhr.categories.performance.score * 100 || 0,
    accessibility: lhr.categories.accessibility.score * 100 || 0,
    best_practice: lhr.categories["best-practices"].score * 100 || 0,
    seo: lhr.categories.seo.score * 100 || 0,
    device_type: "tablet",
    test_name: `${reportName}`,
    url: url,
  };

  // // Call Supabase function to insert the record
  await insertLighthousePerformanceRecord(record);

  await browser.close();
}

export function getCookies() {
  return [
    {
      name: "fpestid",
      value:
        "OpT5KmCDYUTMoF-ZdtcLtu8vKl42v-cx0c8cOv6zvkY7I2iuROcJeVbytOq0hX5kXd3udg",
      path: "/",
      domain: ".nopcommerce.com",
    },
    {
      name: ".Nop.Authentication",
      value:
        "CfDJ8I9z2gb9pbFBplhws12M-g0X8ffHoASHzZPzkhcf8s_AV1xJD5lMyEvODTMl7Rt2PdDgQ6AUgwAvZkx2ccGvI0TXsX3LvtRpu0yqxxUnS9FQeg3Ueh978ImT3wJ4x1CVE8nAm6xGELiF9KkBsgcTknQH6bkVPAlkAvzzl2m2uMKT8K5hzF8E95o1LQE-B66Z8vfZx3M1q3neR3J9N25od4dnO_H6KII_ChQAjNYHiS6FhFCrYdCf_ELXZOeao3W8aVR0KNv4I3O2tfU4h51gwxAAGropYxZZywan87d2fxBsVBZ33HS0FX-_R7WFaWmfHNz7pCWK5Syj5BJQk-flO9ffJWvi4G-XI4HsDBiLOoabOlefD5UG_J2RQR8jhn6gymlLp3Kcx8MdLvga9gvrCTCm43ZgU_VvhoMNmViPFNDkImMz9g1dkR4aFS-CzqYu1Vnh3hZXCtW7SwpM13vnK-mcK6j9PqIMS2qFBR-TS10hFvmH9PxC14TkIZOjR2XIsyO3-6YGBnQvn1QC-1yQoR-VQ47MuydKCt7tI4Xt4vImP_kCqK7XBaxPKLUvVtigxClw_oQ2ZMDnCXD_8FEbYDU",
      path: "/",
      domain: "demo.nopcommerce.com",
    },
  ];
}

export async function handleCookieConsent(page: any) {
  await page.waitForSelector("body");
  const buttonSelector =
    "#CybotCookiebotDialog #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll";
  try {
    await page.waitForSelector(buttonSelector, {
      visible: true,
      timeout: 5000,
    });
    await page.click(buttonSelector);
    console.log("Cookie consent button clicked!");
  } catch (err) {
    console.log("Cookie consent button not clicked!");
  }
}

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_TOKEN
// );

// The function signature remains the same, but the internal logic is now for SQLite.
async function insertLighthousePerformanceRecord(record: {
  performance: number;
  accessibility: number;
  best_practice: number;
  seo: number;
  device_type: string;
  test_name: string;
  url: string;
}) {
  try {
    // 1. Define the SQL query with named parameters (@performance, @accessibility, etc.).
    // This is a secure way to insert data and prevents SQL injection attacks.
    const sql = `
      INSERT INTO performance_matrix (
        performance, 
        accessibility, 
        best_practice, 
        seo, 
        device_type, 
        test_name, 
        url
      ) VALUES (
        @performance, 
        @accessibility, 
        @best_practice, 
        @seo, 
        @device_type, 
        @test_name, 
        @url
      )
    `;

    // 2. Prepare the statement. This compiles the SQL query for efficiency.
    const stmt = db.prepare(sql);

    // 3. Execute the statement with the record object.
    // The keys in the 'record' object (@performance, etc.) are automatically mapped to the named parameters in the SQL query.
    const info = stmt.run(record);

    console.log(
      `Record inserted successfully with ID: ${info.lastInsertRowid}`
    );
    return info;
  } catch (error) {
    console.error("Error inserting record into SQLite:", error);
  }
}