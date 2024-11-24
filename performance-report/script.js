// Function to toggle the folder structure section
function toggleReports(category, data) {
  const folderStructure = document.getElementById("folder-structure");
  const reportContainer = document.getElementById("report-container");

  // Check if the reports section is already visible and contains the current category
  if (
    folderStructure.style.display === "block" &&
    reportContainer.dataset.category === category
  ) {
    folderStructure.style.display = "none"; // Hide the section
    reportContainer.dataset.category = ""; // Reset the category
  } else {
    // Render the reports and show the section
    renderReports(category, data);
    folderStructure.style.display = "block";
    reportContainer.dataset.category = category; // Store the current category
  }
}

// Function to render folder categories dynamically
function renderCategories(folderStructure) {
  const categoriesContainer = document.getElementById("categories");
  categoriesContainer.innerHTML = ""; // Clear existing content

  Object.keys(folderStructure).forEach((category) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${category.replace(/-/g, " ")}</h3>
      <p>Explore detailed performance reports.</p>
      <a href="javascript:void(0);" data-category="${category}">View Reports</a>
    `;

    card.querySelector("a").addEventListener("click", () => {
      toggleReports(category, folderStructure[category]); // Toggle the visibility of the reports
    });

    categoriesContainer.appendChild(card);
  });
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
}

// Initialize the app
async function setupReportViewer() {
  const folderStructure = await fetchFolderStructure();
  if (!folderStructure) return;

  renderCategories(folderStructure);
}
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

setupReportViewer();
