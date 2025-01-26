import fs from "fs";
import * as path from "path";

export async function attachToAllure(
  testInfo,
  filePath: string,
  name: string,
  contentType: string
) {
  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Attach the file using testInfo.attach
    testInfo.attach(name, {
      path: filePath,
      contentType: contentType,
    });
    console.log(`Attached ${name} to the report.`);
  } else {
    console.error(`File not found: ${filePath}`);
  }
}

async function removeHtmlComments(filePath: string) {
  try {
    // Check if the HTML file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }

    // Read the HTML file content
    const htmlContent = fs.readFileSync(filePath, "utf-8");

    // Regular expression to match HTML comments
    const commentRegex = /<!--[\s\S]*?-->/g;

    // Remove comments from the HTML content
    const cleanedHtmlContent = htmlContent.replace(commentRegex, "");

    // Write the cleaned content back to the file
    fs.writeFileSync(filePath, cleanedHtmlContent, "utf-8");

    console.log(`Comments removed successfully from ${filePath}`);
  } catch (error) {
    console.error(`Error removing comments from ${filePath}:`, error);
  }
}

export async function attachHtmlToAllureReport(
  htmlFilePath: string,
  folderPath: string,
  testInfo: any
) {
  try {
    const htmlPath = path.join(folderPath, `${htmlFilePath}.html`);

    // Read the html file
    await removeHtmlComments(htmlPath);

    // Attach the HTML file to Allure
    testInfo.attach("HAR Visualization", {
      path: htmlPath,
      contentType: "text/html",
    });
  } catch (error) {
    console.error("Error generating HAR visualization:", error);
  }
}
