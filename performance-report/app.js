"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Recursively reads a directory and returns its structure as an object.
 * Filters out unwanted files and folders.
 * @param {string} dirPath - The directory path to read.
 * @returns {object} - The folder structure as a JSON object.
 */
function readFolderStructure(folderPath) {
  const excludedFiles = [
    "app.js",
    "folderStructure.json",
    "index.html",
    "script.js",
    "style.css",
  ]; // Files to exclude
  const stats = fs.statSync(folderPath);

  if (stats.isDirectory()) {
    const content = fs.readdirSync(folderPath);
    return content
      .filter((item) => {
        const fullPath = path.join(folderPath, item);
        const isExcluded = excludedFiles.includes(item); // Check if the item is in the exclusion list
        const isHiddenFile = item.startsWith("."); // Exclude hidden files like .DS_Store
        const isDirectory = fs.statSync(fullPath).isDirectory(); // Check if it’s a directory

        // Include only non-excluded files and directories
        return (
          !isExcluded &&
          !isHiddenFile &&
          (isDirectory || item.endsWith(".html"))
        );
      })
      .reduce((acc, item) => {
        const fullPath = path.join(folderPath, item);
        acc[item] = readFolderStructure(fullPath);
        return acc;
      }, {});
  } else {
    return "file"; // Mark as file
  }
}

// Generate folder structure
const folderStructure = readFolderStructure(__dirname);

// Write folder structure to a JSON file
fs.writeFileSync(
  "folderStructure.json",
  JSON.stringify(folderStructure, null, 2)
);

console.log("Folder structure written to folderStructure.json");
