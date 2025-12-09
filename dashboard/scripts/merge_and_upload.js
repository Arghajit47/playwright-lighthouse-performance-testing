import { createClient } from "@supabase/supabase-js";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = "lighthouse";

const LIGHTHOUSE_DB_URL = [
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse//lighthouse_performance_Auth.db",
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse//lighthouse_performance_UnAuth.db",
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse//lighthouse_performance.db",
];

const VISUAL_DB_URL = [
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse//visual_desktop.db",
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse//visual_mobile.db",
];

const TEMP_DIR = path.join(process.cwd(), "temp_processing");
const TEMP_DB_DIR = path.join(TEMP_DIR, "temp_dbs");

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DB_DIR)) fs.mkdirSync(TEMP_DB_DIR, { recursive: true });

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- YOUR ORIGINAL DOWNLOAD & MERGE LOGIC (Ported) ---

async function downloadSingleDatabase(dbUrl, localPath) {
  console.log(`📥 Downloading: ${dbUrl}`);
  const response = await fetch(dbUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  fs.writeFileSync(localPath, buffer);
  return { success: true, path: localPath };
}

async function mergeDownloadedDatabases(downloadResults, outputPath, dbType) {
  console.log(`🔄 Merging ${dbType} databases...`);
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

  const mergedDb = new Database(outputPath);

  try {
    const firstDbPath = downloadResults[0].path;
    const firstDb = new Database(firstDbPath, { readonly: true });

    // Get Schema
    const tables = firstDb
      .prepare(
        "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      .all();
    const indexes = firstDb
      .prepare(
        "SELECT name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      )
      .all();
    firstDb.close();

    // Create Tables
    mergedDb.exec("BEGIN");
    for (const table of tables) {
      if (table.sql) mergedDb.exec(table.sql);
    }
    for (const index of indexes) {
      try {
        if (index.sql) mergedDb.exec(index.sql);
      } catch (e) {}
    }
    mergedDb.exec("COMMIT");

    // Merge Data (Your exact logic with ID re-assignment)
    let currentMaxIds = {};

    for (const download of downloadResults) {
      const sourceDb = new Database(download.path, { readonly: true });

      for (const table of tables) {
        const tableName = table.name;
        // Handle bracketed table names if needed for queries
        const safeTableName = tableName.includes("-")
          ? `"${tableName}"`
          : tableName;

        const tableInfo = sourceDb
          .prepare(`PRAGMA table_info(${safeTableName})`)
          .all();
        const columns = tableInfo.map((col) => col.name);
        const primaryKeys = tableInfo.filter((col) => col.pk > 0);

        const hasAutoIncrementId =
          primaryKeys.length === 1 &&
          primaryKeys[0].name.toLowerCase() === "id" &&
          primaryKeys[0].type.toUpperCase().includes("INTEGER");

        const rows = sourceDb.prepare(`SELECT * FROM ${safeTableName}`).all();

        if (rows.length === 0) continue;

        // Initialize max ID tracker for this table if needed
        if (hasAutoIncrementId && currentMaxIds[tableName] === undefined) {
          try {
            const res = mergedDb
              .prepare(
                `SELECT COALESCE(MAX(id), 0) as max_id FROM ${safeTableName}`
              )
              .get();
            currentMaxIds[tableName] = res.max_id;
          } catch (e) {
            currentMaxIds[tableName] = 0;
          }
        }

        const insertTransaction = mergedDb.transaction(() => {
          for (const row of rows) {
            if (hasAutoIncrementId) {
              currentMaxIds[tableName]++;
              row.id = currentMaxIds[tableName];
            }
            const placeholders = columns.map(() => "?").join(", ");
            const stmt = mergedDb.prepare(
              `INSERT INTO ${safeTableName} (${columns.join(
                ", "
              )}) VALUES (${placeholders})`
            );
            stmt.run(columns.map((col) => row[col]));
          }
        });

        insertTransaction();
      }
      sourceDb.close();
    }

    mergedDb.exec("VACUUM");
    console.log(`✅ Merge complete for ${dbType}`);
  } finally {
    mergedDb.close();
  }
}

async function processAndUpload(urls, filename, type) {
  // 1. Download
  const downloads = [];
  for (let i = 0; i < urls.length; i++) {
    const localPath = path.join(TEMP_DB_DIR, `${type}_${i}.db`);
    await downloadSingleDatabase(urls[i], localPath);
    downloads.push({ success: true, path: localPath });
  }

  // 2. Merge
  const mergedPath = path.join(TEMP_DIR, filename);
  await mergeDownloadedDatabases(downloads, mergedPath, type);

  // 3. Upload
  console.log(`☁️ Uploading ${filename} to Supabase...`);
  const fileBuffer = fs.readFileSync(mergedPath);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, fileBuffer, {
      contentType: "application/x-sqlite3",
      upsert: true,
    });

  if (error) console.error(`❌ Upload failed for ${filename}:`, error);
  else console.log(`✅ Successfully uploaded ${filename}`);
}

// --- MAIN ---
(async () => {
  try {
    await processAndUpload(
      LIGHTHOUSE_DB_URL,
      "merged_lighthouse.db",
      "lighthouse"
    );
    await processAndUpload(VISUAL_DB_URL, "merged_visual.db", "visual");
  } catch (err) {
    console.error("Critical failure:", err);
    process.exit(1);
  }
})();
