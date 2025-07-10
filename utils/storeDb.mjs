import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export async function uploadDB(fileName, pathContent) {
  // Validate environment variables
  if (
    !process.env.DB_SUPABASE_URL ||
    !process.env.DB_SUPABASE_TOKEN ||
    !process.env.DB_SUPABASE_BUCKET_NAME
  ) {
    console.error("❌ Missing required environment variables");
    return;
  }

  // Check if file exists
  if (!fs.existsSync(pathContent)) {
    console.error(`❌ File not found: ${pathContent}`);
    return;
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.DB_SUPABASE_URL,
    process.env.DB_SUPABASE_TOKEN
  );

  const bucketName = process.env.DB_SUPABASE_BUCKET_NAME;

  try {
    console.log(`📤 Uploading ${pathContent} to ${bucketName}/${fileName}`);

    const fileContent = fs.readFileSync(pathContent);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileContent, {
        contentType: "application/vnd.sqlite3",
        upsert: true,
      });

    if (error) {
      console.error("❌ Failed to upload DB to Supabase:", error);
      console.error("Error details:", error.message);
    } else {
      console.log(
        "✅ Database uploaded to Supabase successfully:",
        data,
        "Modified at: " + readableDate
      );
    }
  } catch (e) {
    console.error("❌ Unexpected error occurred:", e.message);
  }
}

const date = new Date(Date.now());
const readableDate = `${date.getFullYear()}-${(date.getMonth() + 1)
  .toString()
  .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
  .getHours()
  .toString()
  .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
  .getSeconds()
  .toString()
  .padStart(2, "0")}`;

uploadDB("lighthouse_performance.db", "./lighthouse_performance.db");
