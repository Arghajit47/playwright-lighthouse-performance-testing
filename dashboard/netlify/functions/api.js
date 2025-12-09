import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
// Netlify writable temp path
const DB_PATH_LH = "/tmp/merged_lighthouse.db";
const DB_PATH_VIS = "/tmp/merged_visual.db";

// URLs to the PRE-MERGED files (uploaded by the worker script)
const URL_LH =
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse/merged_lighthouse.db";
const URL_VIS =
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/lighthouse/merged_visual.db";

// Credentials from Env
const CRED_API_KEY = process.env.CREDS_API_KEY;
const USER_EMAIL = process.env.EMAIL;
const USER_PASS = process.env.PASSWORD;

let lhDb = null;
let visDb = null;

// --- FAST DOWNLOADER ---
async function ensureDb(localPath, url, currentDb) {
  // If we already have a connection and the file exists, reuse it
  if (currentDb && fs.existsSync(localPath)) return currentDb;

  try {
    // If file exists but no connection, try connecting first
    if (fs.existsSync(localPath)) {
      try {
        return new Database(localPath, { readonly: true });
      } catch (e) {}
    }

    console.log(`📥 Downloading merged DB from ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    const buffer = await res.buffer();
    fs.writeFileSync(localPath, buffer);

    return new Database(localPath, { readonly: true });
  } catch (e) {
    console.error(`DB Load Error: ${e.message}`);
    return null;
  }
}

// --- MIDDLEWARE ---
// Ensures DBs are ready before every request
const dbMiddleware = async (req, res, next) => {
  // Skip DB check for credential routes
  if (req.path.includes("credentials")) return next();

  if (!lhDb) lhDb = await ensureDb(DB_PATH_LH, URL_LH, lhDb);
  if (!visDb) visDb = await ensureDb(DB_PATH_VIS, URL_VIS, visDb);
  next();
};

app.use(dbMiddleware);

// --- AUTH ROUTES ---

app.get("/api/getcredentials", (req, res) => {
  const authToken = req.headers["x-api-key"];
  if (authToken !== CRED_API_KEY)
    return res.status(403).json({ error: "Unauthorized access" });
  if (!USER_EMAIL || !USER_PASS)
    return res.status(500).json({ error: "Credentials not set in env" });
  return res.status(200).json({ username: USER_EMAIL, password: USER_PASS });
});

app.post("/api/verifycredentials", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  if (username === "" && password === "") {
    return res
      .status(401)
      .json({ error: "Invalid credentials", isAuthenticated: false });
  }
  return res.status(200).json({ message: "Valid", isAuthenticated: true });
});

// --- LIGHTHOUSE ROUTES ---

app.get("/api/lighthouse/data", (req, res) => {
  if (!lhDb) return res.status(503).json({ error: "Service Unavailable" });
  try {
    const data = lhDb
      .prepare("SELECT * FROM performance_matrix ORDER BY created_at DESC")
      .all();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/lighthouse/stats", (req, res) => {
  if (!lhDb) return res.status(503).json({ error: "Service Unavailable" });
  try {
    const count = lhDb
      .prepare("SELECT COUNT(*) as c FROM performance_matrix")
      .get();
    res.json({ totalRows: count.c, source: "Merged DB" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- VISUAL ROUTES ---

app.get("/api/visual/data", (req, res) => {
  if (!visDb) return res.status(503).json({ error: "Service Unavailable" });

  try {
    // 1. Check if table exists (handle brackets)
    const tableCheck = visDb
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='visual-matrix'"
      )
      .get();

    if (!tableCheck) {
      return res.status(200).json([]); // Return empty if table missing
    }

    // 2. Query with brackets [visual-matrix]
    // We check for columns to decide sort order
    const cols = visDb.prepare("PRAGMA table_info([visual-matrix])").all();
    const hasCreated = cols.some((c) => c.name === "created_at");
    const hasId = cols.some((c) => c.name === "id");

    let query = "SELECT * FROM [visual-matrix]";
    if (hasCreated) query += " ORDER BY created_at DESC";
    else if (hasId) query += " ORDER BY id DESC";

    const data = visDb.prepare(query).all();
    res.json(data);
  } catch (e) {
    console.error("Visual Data Error", e);
    res.status(500).json({ error: "Failed to fetch visual data" });
  }
});

app.get("/api/baseline/data", (req, res) => {
  if (!visDb) return res.status(503).json({ error: "Service Unavailable" });
  try {
    const tableCheck = visDb
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='baseline'"
      )
      .get();
    if (!tableCheck) return res.status(200).json([]);

    const cols = visDb.prepare("PRAGMA table_info(baseline)").all();
    const hasCreated = cols.some((c) => c.name === "created_at");

    let query = "SELECT * FROM baseline";
    if (hasCreated) query += " ORDER BY created_at DESC";

    res.json(visDb.prepare(query).all());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- LEGACY ROUTES ---
app.get("/api/data", (req, res) => {
  // Redirect to lighthouse data logic
  if (!lhDb) return res.status(503).json({ error: "Service Unavailable" });
  try {
    res.json(
      lhDb
        .prepare("SELECT * FROM performance_matrix ORDER BY created_at DESC")
        .all()
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- REFRESH ROUTES ---
// These now just force a re-download of the merged file from Supabase
app.post("/api/refresh", async (req, res) => {
  try {
    if (fs.existsSync(DB_PATH_LH)) fs.unlinkSync(DB_PATH_LH);
    if (fs.existsSync(DB_PATH_VIS)) fs.unlinkSync(DB_PATH_VIS);
    lhDb = null;
    visDb = null; // Force reload on next request
    res.json({
      success: true,
      message: "Cache cleared. DBs will update on next request.",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export const handler = serverless(app);
