import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export async function downloadDB(fileName, localPath) {
  // Validate environment variables
  if (
    !process.env.DB_SUPABASE_URL ||
    !process.env.DB_SUPABASE_TOKEN ||
    !process.env.DB_SUPABASE_BUCKET_NAME
  ) {
    console.error("❌ Missing required environment variables");
    return;
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.DB_SUPABASE_URL,
    process.env.DB_SUPABASE_TOKEN
  );

  const bucketName = process.env.DB_SUPABASE_BUCKET_NAME;

  try {
    console.log(
      `📥 Downloading ${fileName} from ${bucketName} to ${localPath}`
    );

    // Download the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(fileName);

    if (error) {
      console.error("❌ Failed to download DB from Supabase:", error);
      console.error("Error details:", error.message);
      return;
    }

    if (!data) {
      console.error("❌ No data received from Supabase");
      return;
    }

    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure the directory exists
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }

    // Write the file to local filesystem
    fs.writeFileSync(localPath, buffer);

    console.log("✅ Database downloaded from Supabase successfully");
    console.log(`📁 File saved to: ${localPath}`);
  } catch (e) {
    console.error("❌ Unexpected error occurred:", e.message);
  }
}

// Example usage (commented out)
downloadDB("lighthouse_performance.db", "./lighthouse_performance.db");
