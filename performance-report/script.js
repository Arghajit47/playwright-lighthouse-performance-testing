// Function to fetch folder structure JSON
async function fetchFolderStructure() {
  try {
    const response = await fetch("./folderStructure.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch folder structure:", error);
    return null;
  }
}

// Utility to create a list of files with nested paths
function createFileList(subfolderName, files) {
  const ul = document.createElement("ul");
  for (const fileName in files) {
    const li = document.createElement("li");
    const filePath = `${subfolderName}/${fileName}`;
    li.innerHTML = `<a href="./${filePath}" target="_blank">${fileName}</a>`;
    ul.appendChild(li);
  }
  return ul;
}

// Utility to create subfolder content
function createSubfolders(parentFolderName, subfolders) {
  const div = document.createElement("div");
  for (const folderName in subfolders) {
    const folderDiv = document.createElement("div");
    folderDiv.className = "subfolder";
    folderDiv.innerHTML = `<h4>${folderName}</h4>`;
    folderDiv.appendChild(
      createFileList(
        `${parentFolderName}/${folderName}`,
        subfolders[folderName]
      )
    );
    div.appendChild(folderDiv);
  }
  return div;
}

// Function to render reports dynamically
function renderReports(category, data) {
  const container = document.getElementById("report-container");
  container.innerHTML = `<h3>${category.replace(/-/g, " ")}</h3>`;
  container.appendChild(createSubfolders(category, data));
  document.getElementById("folder-structure").style.display = "block";
}

// Load folder structure and set up event listeners
async function setupReportViewer() {
  const folderStructure = await fetchFolderStructure();
  if (!folderStructure) return;

  document
    .getElementById("authorized-reports-btn")
    .addEventListener("click", () => {
      renderReports(
        "Authorized-performance-reports",
        folderStructure["Authorized-performance-reports"]
      );
    });

  document
    .getElementById("unauthorized-reports-btn")
    .addEventListener("click", () => {
      renderReports(
        "Unauthorized-performance-reports",
        folderStructure["Unauthorized-performance-reports"]
      );
    });
}

// Initialize the app
setupReportViewer();
