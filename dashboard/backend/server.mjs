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
const DB_URL =
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse//lighthouse_performance.db";
// Path to save the database on the Render instance's temporary disk
const LOCAL_DB_PATH = path.join("/tmp", "lighthouse_performance.db");
// How often to refresh the database from the URL (e.g., 15 minutes)
const REFRESH_INTERVAL_MS = 1 * 60 * 1000;

// This variable will hold our live database connection
let db;

/**
 * Downloads the database from the public URL and saves it locally.
 */
async function downloadDatabase() {
  console.log(`Attempting to download database from ${DB_URL}...`);
  try {
    const response = await fetch(DB_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to download DB. Status: ${response.status} ${response.statusText}`
      );
    }
    const fileBuffer = await response.buffer();
    fs.writeFileSync(LOCAL_DB_PATH, fileBuffer);
    console.log(
      `Database successfully downloaded and saved to ${LOCAL_DB_PATH}`
    );
    return true;
  } catch (error) {
    console.error("Error downloading database:", error.message);
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
  } catch (error) {
    console.error("Failed to connect to local database file:", error.message);
    db = null; // Ensure db is null if connection fails
  }
}

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
    res.json(data);
  } catch (error) {
    console.error("Error querying cached database:", error);
    res.status(500).json({ error: "Failed to fetch data from the database" });
  }
});

/**
 * Main function to start the server after the initial DB download.
 */
async function startServer() {
  const success = await downloadDatabase();

  if (success) {
    initializeDbConnection();
    // Set up the periodic refresh
    setInterval(async () => {
      await downloadDatabase();
      initializeDbConnection();
    }, REFRESH_INTERVAL_MS);
  } else {
    console.error(
      "CRITICAL: Initial database download failed. The API will not be available."
    );
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (!success) {
      console.warn(
        "Warning: Server started, but API is non-functional due to DB download failure."
      );
    }
  });
}

// --- START THE APPLICATION ---
startServer();
