import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// --- CONFIGURATION ---
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;
// IMPORTANT: Store this URL in your Render Environment Variables
const DB_URL = [
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse//lighthouse_performance_Auth.db",
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse//lighthouse_performance_UnAuth.db",
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse//lighthouse_performance.db",
];
// Path to save the database on the Render instance's temporary disk
const LOCAL_DB_PATH = path.join("/tmp", "lighthouse_performance.db");
const TEMP_DB_DIR = path.join("/tmp", "temp_dbs");
// How often to refresh the database from the URL (e.g., 15 minutes)
const REFRESH_INTERVAL_MS = 1 * 60 * 1000;

// This variable will hold our live database connection
let db;

/**
 * Downloads a single database from URL and saves it locally.
 */
async function downloadSingleDatabase(dbUrl, localPath, retryCount = 0) {
  console.log(`📥 Downloading database from ${dbUrl}...`);

  try {
    const response = await fetch(dbUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const fileBuffer = await response.buffer();
    fs.writeFileSync(localPath, fileBuffer);

    console.log(`✅ Database downloaded: ${path.basename(localPath)}`);
    return { success: true, path: localPath, url: dbUrl };
  } catch (error) {
    console.error(`❌ Download failed for ${dbUrl}: ${error.message}`);

    // Retry logic
    if (retryCount < 3) {
      console.log(`🔄 Retrying download (${retryCount + 1}/3)...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return downloadSingleDatabase(dbUrl, localPath, retryCount + 1);
    }

    return { success: false, error: error.message, url: dbUrl };
  }
}

/**
 * Downloads multiple databases and merges them into a single database.
 */
async function downloadAndMergeDatabases() {
  console.log(`🚀 Starting download of ${DB_URL.length} databases...`);

  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DB_DIR)) {
    fs.mkdirSync(TEMP_DB_DIR, { recursive: true });
  }

  // Download all databases
  const downloadPromises = DB_URL.map((dbUrl, index) => {
    const fileName = `db_${index}_${Date.now()}.db`;
    const localPath = path.join(TEMP_DB_DIR, fileName);
    return downloadSingleDatabase(dbUrl, localPath);
  });

  const downloadResults = await Promise.all(downloadPromises);

  const successfulDownloads = downloadResults.filter((r) => r.success);
  const failedDownloads = downloadResults.filter((r) => !r.success);

  console.log(
    `📊 Download Summary: ${successfulDownloads.length} successful, ${failedDownloads.length} failed`
  );

  if (successfulDownloads.length === 0) {
    console.error("❌ All database downloads failed");
    return false;
  }

  // Log failed downloads
  failedDownloads.forEach((failed) => {
    console.error(`❌ Failed to download: ${failed.url} - ${failed.error}`);
  });

  // Merge databases
  try {
    await mergeDownloadedDatabases(successfulDownloads);

    // Clean up temporary files
    cleanupTempFiles();

    console.log(`✅ Database merge completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Database merge failed: ${error.message}`);
    cleanupTempFiles();
    return false;
  }
}

/**
 * Merges multiple downloaded databases into a single database.
 */
async function mergeDownloadedDatabases(downloadResults) {
  console.log(`🔄 Starting database merge process...`);

  // Remove existing merged database
  if (fs.existsSync(LOCAL_DB_PATH)) {
    fs.unlinkSync(LOCAL_DB_PATH);
  }

  // Create merged database
  const mergedDb = new Database(LOCAL_DB_PATH);

  try {
    // Get schema from first successful download
    const firstDbPath = downloadResults[0].path;
    const firstDb = new Database(firstDbPath, { readonly: true });

    // Extract and create schema
    const tables = firstDb
      .prepare(
        `
      SELECT name, sql FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
      )
      .all();

    const indexes = firstDb
      .prepare(
        `
      SELECT name, sql FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
      )
      .all();

    firstDb.close();

    // Create tables in merged database
    console.log(`📋 Creating ${tables.length} tables...`);
    for (const table of tables) {
      if (table.sql) {
        mergedDb.exec(table.sql);
      }
    }

    // Create indexes
    console.log(`📋 Creating ${indexes.length} indexes...`);
    for (const index of indexes) {
      if (index.sql) {
        try {
          mergedDb.exec(index.sql);
        } catch (error) {
          console.log(`⚠️  Skipped index: ${error.message}`);
        }
      }
    }

    // Merge data from all databases
    let totalRowsMerged = 0;

    for (const download of downloadResults) {
      console.log(`📊 Merging data from ${path.basename(download.path)}...`);

      const sourceDb = new Database(download.path, { readonly: true });

      try {
        for (const table of tables) {
          const tableName = table.name;

          // Get table info for primary key handling
          const tableInfo = sourceDb
            .prepare(`PRAGMA table_info(${tableName})`)
            .all();
          const primaryKeys = tableInfo.filter((col) => col.pk > 0);
          const columns = tableInfo.map((col) => col.name);

          // Get all rows from source table
          const rows = sourceDb.prepare(`SELECT * FROM ${tableName}`).all();

          if (rows.length === 0) continue;

          // Prepare insert statement with conflict resolution
          const columnList = columns.join(", ");
          const placeholders = columns.map(() => "?").join(", ");

          let insertSql;
          if (primaryKeys.length > 0) {
            const hasAutoIncrement = primaryKeys.some(
              (pk) => pk.type.toUpperCase().includes("INTEGER") && pk.pk === 1
            );
            insertSql = hasAutoIncrement
              ? `INSERT OR IGNORE INTO ${tableName} (${columnList}) VALUES (${placeholders})`
              : `INSERT OR REPLACE INTO ${tableName} (${columnList}) VALUES (${placeholders})`;
          } else {
            insertSql = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`;
          }

          const insertStmt = mergedDb.prepare(insertSql);

          // Use transaction for performance
          const insertMany = mergedDb.transaction((rows) => {
            let inserted = 0;
            for (const row of rows) {
              try {
                const values = columns.map((col) => row[col]);
                const result = insertStmt.run(values);
                if (result.changes > 0) inserted++;
              } catch (error) {
                if (!error.message.includes("UNIQUE constraint")) {
                  console.error(`Error inserting row: ${error.message}`);
                }
              }
            }
            return inserted;
          });

          const insertedCount = insertMany(rows);
          totalRowsMerged += insertedCount;

          console.log(
            `   ✅ ${tableName}: ${insertedCount}/${rows.length} rows merged`
          );
        }
      } finally {
        sourceDb.close();
      }
    }

    // Optimize merged database
    console.log(`🔧 Optimizing merged database...`);
    mergedDb.exec("ANALYZE");
    mergedDb.exec("VACUUM");

    console.log(`✅ Database merge completed: ${totalRowsMerged} total rows`);
  } finally {
    mergedDb.close();
  }
}

/**
 * Clean up temporary database files.
 */
function cleanupTempFiles() {
  console.log(`🧹 Cleaning up temporary files...`);

  try {
    if (fs.existsSync(TEMP_DB_DIR)) {
      const files = fs.readdirSync(TEMP_DB_DIR);
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(TEMP_DB_DIR, file);
        if (file.endsWith(".db")) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      }

      console.log(`🗑️  Cleaned up ${cleanedCount} temporary database files`);

      // Remove temp directory if empty
      if (fs.readdirSync(TEMP_DB_DIR).length === 0) {
        fs.rmdirSync(TEMP_DB_DIR);
      }
    }
  } catch (error) {
    console.error(`⚠️  Cleanup failed: ${error.message}`);
  }
}

/**
 * Downloads the database from the public URL and saves it locally.
 * (Updated to handle multiple databases)
 */
async function downloadDatabase() {
  console.log(
    `Attempting to download and merge databases from ${DB_URL.length} sources...`
  );

  try {
    const success = await downloadAndMergeDatabases();

    if (success) {
      console.log(
        `Database successfully downloaded and merged to ${LOCAL_DB_PATH}`
      );

      // Log final database statistics
      const stats = fs.statSync(LOCAL_DB_PATH);
      const fileSizeMB = Math.round((stats.size / (1024 * 1024)) * 100) / 100;
      console.log(`📊 Merged database size: ${fileSizeMB} MB`);

      return true;
    } else {
      console.error("❌ Database download and merge failed");
      return false;
    }
  } catch (error) {
    console.error("Error downloading and merging databases:", error.message);
    return false;
  }
}

/**
 * Initializes the database connection from the local file.
 * Closes the old connection if it exists.
 */
function initializeDbConnection() {
  // Close existing connection before creating a new one to prevent leaks
  if (db) {
    db.close();
  }

  try {
    db = new Database(LOCAL_DB_PATH, { readonly: true });
    console.log("Successfully connected to the local cached database.");

    // Log available tables for debugging
    const tables = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `
      )
      .all();

    console.log(`📋 Available tables: ${tables.map((t) => t.name).join(", ")}`);
  } catch (error) {
    console.error("Failed to connect to local database file:", error.message);
    db = null; // Ensure db is null if connection fails
  }
}

app.get("/api/getcredentials", (req, res) => {
  const authToken = req.headers["x-api-key"];

  if (authToken !== process.env.CREDS_API_KEY) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const username = process.env.EMAIL;
  const password = process.env.PASSWORD;

  if (!username || !password) {
    return res
      .status(500)
      .json({ error: "Credentials not set in environment variables" });
  }

  return res.status(200).json({ username, password });
});

app.post("/api/verifycredentials", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  if (username === "" && password === "") {
    return res
      .status(401)
      .json({ error: "Invalid username or password", isAuthenticated: false });
  }

  // Default case: credentials are valid
  return res
    .status(200)
    .json({ message: "Credentials are valid", isAuthenticated: true });
});

// --- API ROUTE ---
// Queries the local, cached database file.
app.get("/api/data", (req, res) => {
  if (!db) {
    // This happens if the initial download or connection failed
    return res
      .status(503)
      .json({ error: "Service Unavailable: Database is not ready." });
  }

  try {
    const stmt = db.prepare(
      "SELECT * FROM performance_matrix ORDER BY created_at DESC"
    );
    const data = stmt.all();

    console.log(
      `📊 API call: Retrieved ${data.length} records from performance_matrix`
    );
    res.json(data);
  } catch (error) {
    console.error("Error querying cached database:", error);
    res.status(500).json({ error: "Failed to fetch data from the database" });
  }
});

// --- NEW API ROUTE: Get database statistics ---
app.get("/api/stats", (req, res) => {
  if (!db) {
    return res
      .status(503)
      .json({ error: "Service Unavailable: Database is not ready." });
  }

  try {
    // Get table statistics
    const tables = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `
      )
      .all();

    const tableStats = {};
    let totalRows = 0;

    for (const table of tables) {
      const count = db
        .prepare(`SELECT COUNT(*) as count FROM ${table.name}`)
        .get();
      tableStats[table.name] = count.count;
      totalRows += count.count;
    }

    // Get database file size
    const stats = fs.statSync(LOCAL_DB_PATH);
    const fileSizeMB = Math.round((stats.size / (1024 * 1024)) * 100) / 100;

    res.json({
      totalTables: tables.length,
      totalRows,
      fileSizeMB,
      tableStats,
      lastUpdated: stats.mtime,
      sourceUrls: DB_URL.length,
    });
  } catch (error) {
    console.error("Error getting database stats:", error);
    res.status(500).json({ error: "Failed to get database statistics" });
  }
});

// --- NEW API ROUTE: Manual database refresh ---
app.post("/api/refresh", async (req, res) => {
  console.log("🔄 Manual database refresh requested");

  try {
    const success = await downloadDatabase();

    if (success) {
      initializeDbConnection();
      res.json({
        success: true,
        message: "Database refreshed successfully",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Database refresh failed",
      });
    }
  } catch (error) {
    console.error("Manual refresh failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Main function to start the server after the initial DB download.
 */
async function startServer() {
  console.log(`🚀 Starting server with ${DB_URL.length} database sources...`);

  const success = await downloadDatabase();

  if (success) {
    initializeDbConnection();

    // Set up the periodic refresh
    console.log(
      `⏰ Setting up periodic refresh every ${Math.round(
        REFRESH_INTERVAL_MS / 1000
      )} seconds`
    );
    setInterval(async () => {
      console.log("🔄 Periodic database refresh starting...");
      const refreshSuccess = await downloadDatabase();
      if (refreshSuccess) {
        initializeDbConnection();
      }
    }, REFRESH_INTERVAL_MS);
  } else {
    console.error(
      "CRITICAL: Initial database download failed. The API will not be available."
    );
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API endpoints available:`);
    console.log(`   - GET  /api/data        - Get performance data`);
    console.log(`   - GET  /api/stats       - Get database statistics`);
    console.log(`   - POST /api/refresh     - Manual database refresh`);
    console.log(`   - GET  /api/getcredentials - Get credentials`);
    console.log(`   - POST /api/verifycredentials - Verify credentials`);

    if (!success) {
      console.warn(
        "⚠️  Warning: Server started, but API is non-functional due to DB download failure."
      );
    }
  });
}

// --- START THE APPLICATION ---
startServer();