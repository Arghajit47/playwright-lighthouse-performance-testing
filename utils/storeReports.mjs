import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Get current readable date
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

// Single performance report upload function
export async function uploadReport(fileName, pathContent, subFolder = "") {
  // Validate environment variables
  if (
    !process.env.DB_SUPABASE_URL ||
    !process.env.REPORT_SUPABASE_TOKEN ||
    !process.env.REPORT_SUPABASE_BUCKET_NAME
  ) {
    console.error("❌ Missing required environment variables");
    return false;
  }

  // Check if file exists
  if (!fs.existsSync(pathContent)) {
    console.error(`❌ File not found: ${pathContent}`);
    return false;
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.DB_SUPABASE_URL,
    process.env.REPORT_SUPABASE_TOKEN
  );

  const bucketName = process.env.REPORT_SUPABASE_BUCKET_NAME;

  try {
    // Create the full path for Supabase storage including subfolder
    const storagePath = subFolder ? `${subFolder}/${fileName}` : fileName;

    console.log(`📤 Uploading ${pathContent} to ${bucketName}/${storagePath}`);

    const fileContent = fs.readFileSync(pathContent);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileContent, {
        contentType: "text/html",
        upsert: true,
      });

    if (error) {
      console.error("❌ Failed to upload report to Supabase:", error);
      console.error("Error details:", error.message);
      return false;
    } else {
      console.log(
        "✅ Report uploaded to Supabase successfully:",
        data,
        "Modified at: " + readableDate
      );
      return true;
    }
  } catch (e) {
    console.error("❌ Unexpected error occurred:", e.message);
    return false;
  }
}

// Find all HTML files in a directory recursively
export function findReportFiles(directory, baseDirectory = "") {
  const files = [];

  try {
    if (!fs.existsSync(directory)) {
      console.log(`⚠️  Directory does not exist: ${directory}`);
      return [];
    }

    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively search subdirectories
        const subFolder = baseDirectory ? `${baseDirectory}/${item}` : item;
        files.push(...findReportFiles(fullPath, subFolder));
      } else if (item.endsWith(".html")) {
        files.push({
          fileName: item,
          filePath: fullPath,
          subFolder: baseDirectory,
        });
      }
    }

    console.log(`📂 Found ${files.length} HTML report files in ${directory}`);

    return files;
  } catch (error) {
    console.error(`❌ Error reading directory ${directory}:`, error.message);
    return [];
  }
}

// Upload all performance reports from the main directories
export async function uploadAllPerformanceReports(
  performanceReportDir = "./performance-report"
) {
  const directories = [
    "Authorized-performance-reports",
    "Unauthorized-performance-reports",
    "cpu",
  ];

  const allUploads = [];

  for (const dir of directories) {
    const fullDirPath = path.join(performanceReportDir, dir);
    console.log(`\n🔍 Searching for reports in: ${fullDirPath}`);

    const reportFiles = findReportFiles(fullDirPath, dir);

    for (const report of reportFiles) {
      console.log(`   - ${report.fileName} (${report.subFolder})`);
      const uploadPromise = uploadReport(
        report.fileName,
        report.filePath,
        report.subFolder
      );
      allUploads.push(uploadPromise);
    }
  }

  if (allUploads.length === 0) {
    console.log("📝 No performance reports found to upload.");
    return true;
  }

  console.log(`\n🚀 Starting upload of ${allUploads.length} files...`);

  try {
    const results = await Promise.all(allUploads);
    const successCount = results.filter((result) => result === true).length;
    const failureCount = results.length - successCount;

    console.log(`\n📊 Upload Summary:`);
    console.log(`   ✅ Successful uploads: ${successCount}`);
    console.log(`   ❌ Failed uploads: ${failureCount}`);
    console.log(`   📅 Completed at: ${readableDate}`);

    return failureCount === 0;
  } catch (error) {
    console.error("❌ Error during batch upload:", error.message);
    return false;
  }
}

// Main execution function
export async function main() {
  console.log("🎯 Starting Performance Reports Upload to Supabase...");
  console.log(`📅 Started at: ${readableDate}\n`);

  const success = await uploadAllPerformanceReports();

  if (success) {
    console.log("\n🎉 All performance reports uploaded successfully!");
    console.log(
      `🔗 Supabase Bucket URL: https://supabase.com/dashboard/project/ocpaxmghzmfbuhxzxzae/storage/files/buckets/performance-report`
    );
  } else {
    console.log("\n⚠️  Some uploads failed. Check the logs above for details.");
    process.exit(1);
  }
}

// Execute main function if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
