"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Recursively reads a directory and returns its structure as an object.
 * @param {string} dirPath - The directory path to read.
 * @returns {object} - The folder structure as a JSON object.
 */


// Usage
function readFolderStructure(folderPath) {
  const stats = fs.statSync(folderPath);

  if (stats.isDirectory()) {
    const content = fs.readdirSync(folderPath);
    return content
      .filter((item) => item !== ".DS_Store") // Filter out .DS_Store
      .reduce((acc, item) => {
        const fullPath = path.join(folderPath, item);
        acc[item] = readFolderStructure(fullPath);
        return acc;
      }, {});
  } else {
    return "file";
  }
}

const folderStructure = readFolderStructure(__dirname);
fs.writeFileSync(
  "folderStructure.json",
  JSON.stringify(folderStructure, null, 2)
);
  console.log("Folder structure written to folderStructure.json");
