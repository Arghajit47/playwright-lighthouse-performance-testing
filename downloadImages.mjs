import fs from "fs-extra";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config(); // Load Supabase API Key from .env

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_BUCKET = "images"; // Change to your bucket
const SUPABASE_API_KEY = process.env.SUPABASE_TOKEN;

// Function to download images from Supabase Storage
async function downloadImages() {
  const supabase = await createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_TOKEN
  );
  // List files in the bucket
  const { data: files, error: listError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .list();

  if (listError) {
    console.error("Error listing files:", listError);
    return;
  }

  if (!files || files.length === 0) {
    console.log("No images found in storage.");
    return;
  }
  // Ensure folder exists
  const folderPath = "./downloaded-images";
  fs.ensureDirSync(folderPath);

  // Download each file
  for (const file of files) {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(file.name);

    if (downloadError) {
      console.error(`Error downloading ${file.name}:`, downloadError);
      continue;
    }

    const filePath = `${folderPath}/${file.name}`;
    fs.writeFileSync(filePath, Buffer.from(await fileData.arrayBuffer()));
    console.log(`Downloaded: ${file.name}`);
  }
}

// Run function before tests
downloadImages();
