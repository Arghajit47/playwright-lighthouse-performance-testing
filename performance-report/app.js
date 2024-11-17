"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Recursively reads a directory and returns its structure as an object.
 * @param {string} dirPath - The directory path to read.
 * @returns {object} - The folder structure as a JSON object.
 */
function getFolderStructure(dirPath) {
  const structure = {};

  fs.readdirSync(dirPath, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recursively get the structure of the subdirectory
      structure[entry.name] = getFolderStructure(entryPath);
    } else {
      // Add the file to the structure
      structure[entry.name] = "file";
    }
  });

  return structure;
}

// Usage
const rootPath = path.join(__dirname, ""); // Replace 'reports' with your directory
const folderStructure = getFolderStructure(rootPath);

// Output the structure as JSON
console.log(JSON.stringify(folderStructure, null, 2));

// Define file path
const outputFilePath = path.join(__dirname, "folderStructure.json");

// Write JSON data to the file
fs.writeFile(
  outputFilePath,
  JSON.stringify(folderStructure, null, 2),
  "utf8",
  (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("File successfully written to", outputFilePath);
    }
  }
);
