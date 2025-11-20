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
  const { lhr, report } = await lighthouse.default(
    url,
    {
      port: new URL(browser.wsEndpoint()).port,
      output: "html",
      logLevel: "silent",
      disableStorageReset: true,
    },
    config
  );

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
  const { lhr, report } = await lighthouse.default(
    url,
    {
      port: new URL(browser.wsEndpoint()).port,
      output: "html",
      logLevel: "info",
      disableStorageReset: true,
    },
    config
  );

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

// Helper function to run a Lighthouse audit with a given config
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
  const { lhr, report } = await lighthouse.default(
    url,
    {
      port: Number(new URL(browser.wsEndpoint()).port),
      output: "html",
      logLevel: "info",
      disableStorageReset: true,
    },
    config
  );

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
      name: "orangehrm",
      value: "gb0ap2v7f80h0cql8rk77af17i",
      path: "/web",
      domain: "opensource-demo.orangehrmlive.com",
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
