// js/security-dashboard.js

// --- GLOBAL STATE ---
let allAlerts = [];
let rawParsedAlerts = []; // For accurate charting
let filteredAlerts = [];
let filters = { risk: "", report: "", searchTerm: "" };
let selectedAlertIndex = 0;
let reportFiles = []; // Will be populated dynamically
let expandedInstances = new Set(); // Track which instances have expanded request/response

// --- DATA FETCHING & PARSING ---
async function fetchReportFiles() {
  try {
    // using a static server with dynamic directory listing enabled
    const response = await fetch("reports/");
    const text = await response.text();

    // Parse the directory listing HTML to extract .html files
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const links = doc.querySelectorAll("a");

    const htmlFiles = [];
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.endsWith(".html")) {
        htmlFiles.push(href);
      }
    });

    if (htmlFiles.length === 0) {
      // Method 3: If directory listing is not available, try a manifest file
      try {
        const manifestResponse = await fetch("reports/manifest.json");
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          return manifest.files;
        }
      } catch (manifestError) {
        console.warn("No manifest.json found, using fallback method");
      }

      // Method 4: Fallback - try to fetch files with a pattern
      // This requires you to know the naming convention
      const possibleFiles = [];
      let fileIndex = 1;
      let consecutiveFailures = 0;

      while (consecutiveFailures < 3) {
        try {
          const testFile = `security-report-${fileIndex}.html`;
          const testResponse = await fetch(`reports/${testFile}`, {
            method: "HEAD",
          });
          if (testResponse.ok) {
            possibleFiles.push(`reports/${testFile}`);
            consecutiveFailures = 0;
          } else {
            consecutiveFailures++;
          }
          fileIndex++;
        } catch {
          consecutiveFailures++;
        }
      }

      return possibleFiles;
    }

    return htmlFiles;
  } catch (error) {
    console.error("Failed to fetch report files:", error);

    // Method 5: If all else fails, check for a predefined list of common report names
    const commonReportNames = [
      "security-report.html",
      "index.html",
      "report.html",
      "security-scan.html",
    ];

    const availableFiles = [];
    for (const fileName of commonReportNames) {
      try {
        const response = await fetch(`reports/${fileName}`, { method: "HEAD" });
        if (response.ok) {
          availableFiles.push(`reports/${fileName}`);
        }
      } catch {
        // File doesn't exist, continue
      }
    }

    return availableFiles;
  }
}

async function fetchAndParseData() {
  console.log("Starting fetchAndParseData...");
  try {
    // First, dynamically fetch the list of report files
    reportFiles = await fetchReportFiles();

    // Check if we already have parsed data (from preprocessed JSON)
    if (reportFiles.length === 0 && rawParsedAlerts.length > 0) {
      console.log(`Using preprocessed data: ${rawParsedAlerts.length} alerts`);
      // Skip HTML parsing, go directly to processing
    } else {
      // Original HTML file loading
      if (reportFiles.length === 0) {
        throw new Error("No report files found in the reports directory.");
      }

      //   console.log(`Found ${reportFiles.length} report files:`, reportFiles);

      const responses = await Promise.all(
        reportFiles.map((file) =>
          fetch(file).catch((err) => {
            console.error(`Failed to fetch ${file}:`, err);
            return null;
          })
        )
      );

      // Filter out failed requests
      const validResponses = responses.filter((res) => res && res.ok);

      if (validResponses.length === 0) {
        throw new Error("Could not load any report files.");
      }

      console.log(`Successfully loaded ${validResponses.length} files`);

      const htmlTexts = await Promise.all(
        validResponses.map((res, index) =>
          res.text().then((text) => ({
            text,
            fileName: reportFiles[responses.indexOf(res)],
          }))
        )
      );

      rawParsedAlerts = htmlTexts.flatMap(({ text, fileName }) =>
        parseReport(text, fileName)
      );

      console.log(`Parsed ${rawParsedAlerts.length} raw alerts`);
    }

    // Deduplicate and aggregate alerts
    const uniqueAlerts = Object.values(
      rawParsedAlerts.reduce((acc, alert) => {
        if (!acc[alert.name]) {
          acc[alert.name] = {
            ...alert,
            reports: [],
            totalInstances: 0,
            vulnerableUrls: [],
          };
        }
        acc[alert.name].reports.push(alert.report);
        acc[alert.name].totalInstances += alert.instances;
        // The vulnerableUrls array now contains objects that already know their source report
        acc[alert.name].vulnerableUrls.push(...alert.vulnerableUrls);

        // Prioritize keeping the most complete data
        if (!acc[alert.name].description.includes("<"))
          acc[alert.name].description = alert.description;
        if (!acc[alert.name].solution.includes("<"))
          acc[alert.name].solution = alert.solution;
        if (!acc[alert.name].reference.includes("<"))
          acc[alert.name].reference = alert.reference;
        if (acc[alert.name].cweId === "N/A")
          acc[alert.name].cweId = alert.cweId;
        if (acc[alert.name].wascId === "N/A")
          acc[alert.name].wascId = alert.wascId;
        if (acc[alert.name].pluginId === "N/A")
          acc[alert.name].pluginId = alert.pluginId;
        return acc;
      }, {})
    );

    allAlerts = uniqueAlerts
      .filter((alert) => alert.totalInstances > 0)
      .sort((a, b) => b.riskLevel - a.riskLevel);
    console.log(`Total unique alerts: ${allAlerts.length}`);
    applyFiltersAndRender();
  } catch (error) {
    console.error("Failed to process security reports:", error);
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.innerHTML = `<p class="error-message">Failed to load and parse security data. ${error.message}</p>`;
    } else {
      console.error("main-content element not found!");
      // Try to find any container to show the error
      document.body.innerHTML += `<div style="color: red; padding: 20px;">Error: Failed to load security data. Check console for details.</div>`;
    }
  } finally {
    hideLoading();
  }
}

function parseReport(htmlText, fileName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  // Extract just the filename without path for display
  const fileNameOnly = fileName.split("/").pop();

  const reportName =
    doc
      .querySelector("title")
      ?.textContent.match(/-\s*(.*)$/)?.[1]
      .trim() || fileNameOnly;
  const executionDate = doc
    .querySelector("h3:first-of-type")
    ?.textContent.replace("Generated on ", "")
    .trim();
  const alerts = [];

  doc.querySelectorAll("table.results").forEach((table) => {
    const riskLevelText = table
      .querySelector('th[class^="risk-"]')
      ?.textContent.trim();
    const riskLevelMap = { High: 3, Medium: 2, Low: 1, Informational: 0 };
    const name = table.querySelectorAll("th")[1]?.textContent.trim();
    if (!name || !riskLevelText) return;

    let description = "N/A",
      solution = "N/A",
      reference = "N/A",
      cweId = "N/A",
      wascId = "N/A",
      pluginId = "N/A",
      instances = 0;
    const vulnerableUrls = [];
    let currentInstance = {};

    table.querySelectorAll("tr").forEach((row) => {
      const labelCell = row.querySelector("td:first-child");
      if (!labelCell) return;
      const label = labelCell.textContent.trim();
      const valueCell = labelCell.nextElementSibling;
      if (valueCell) {
        const valueHTML = valueCell.innerHTML;
        if (label === "Description") description = valueHTML;
        if (label === "Solution") solution = valueHTML;
        if (label === "Reference") reference = valueHTML;
        if (label === "CWE Id") cweId = valueHTML;
        if (label === "WASC Id") wascId = valueHTML;
        if (label === "Plugin Id") pluginId = valueHTML;
        if (label === "Instances")
          instances = parseInt(valueCell.textContent.trim(), 10) || 0;

        if (labelCell.classList.contains("indent1") && label === "URL") {
          if (Object.keys(currentInstance).length > 0)
            vulnerableUrls.push(currentInstance);
          // Add report context directly to each instance
          currentInstance = { url: valueHTML, report: reportName };
        } else if (
          labelCell.classList.contains("indent2") &&
          currentInstance.url
        ) {
          const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]/g, "");

          // Special handling for request/response data
          if (label.includes("Request Header")) {
            // Find the div with request header data
            const reqDiv = valueCell.querySelector('div[id*="reqh"]');
            if (reqDiv) {
              currentInstance.requestHeader = reqDiv.innerHTML;
            }
          } else if (label.includes("Request Body")) {
            const reqDiv = valueCell.querySelector('div[id*="reqb"]');
            if (reqDiv) {
              currentInstance.requestBody = reqDiv.innerHTML;
            }
          } else if (label.includes("Response Header")) {
            const respDiv = valueCell.querySelector('div[id*="resph"]');
            if (respDiv) {
              currentInstance.responseHeader = respDiv.innerHTML;
            }
          } else if (label.includes("Response Body")) {
            const respDiv = valueCell.querySelector('div[id*="respb"]');
            if (respDiv) {
              currentInstance.responseBody = respDiv.innerHTML;
            }
          } else {
            currentInstance[normalizedLabel] = valueHTML;
          }
        }
      }
    });
    if (Object.keys(currentInstance).length > 0)
      vulnerableUrls.push(currentInstance);

    alerts.push({
      name,
      risk: riskLevelText,
      riskLevel: riskLevelMap[riskLevelText],
      description,
      solution,
      reference,
      cweId,
      wascId,
      pluginId,
      instances,
      report: reportName,
      executionDate,
      vulnerableUrls,
    });
  });
  return alerts;
}

// --- ALTERNATIVE APPROACH: Using a simple file list ---
// If the above methods don't work in your environment, you can create a simple
// reports/manifest.json file that lists all report files:
/*
{
  "files": [
    "reports/security-report-discover-page.html",
    "reports/security-report-onboarding-flow-complete.html",
    "reports/security-report-contact-us-page.html",
    "reports/index.html"
  ]
}
*/

// --- FILTERING & RENDERING ---
function applyFiltersAndRender() {
  filteredAlerts = allAlerts.filter(
    (alert) =>
      (!filters.risk || alert.risk === filters.risk) &&
      (!filters.report || alert.reports.includes(filters.report)) &&
      (!filters.searchTerm ||
        alert.name.toLowerCase().includes(filters.searchTerm.toLowerCase()))
  );
  if (selectedAlertIndex >= filteredAlerts.length)
    selectedAlertIndex = filteredAlerts.length > 0 ? 0 : null;

  // Clear expanded instances when filters change
  expandedInstances.clear();

  renderAllComponents();
}

function renderAllComponents() {
  try {
    console.log("Rendering all components...");
    const highRiskAlerts = allAlerts.filter((a) => a.risk === "High");
    renderHeader(highRiskAlerts);
    renderKPICards();
    renderAlertsChart();
    renderFilters();
    renderAlertsList();
    renderAlertDetail();
    renderAlertInstances();
    console.log("All components rendered successfully");
  } catch (error) {
    console.error("Error rendering components:", error);
    throw error;
  }
}

function resetDashboardState() {
  filters = { risk: "", report: "", searchTerm: "" };
  selectedAlertIndex = 0;
  expandedInstances.clear();
  applyFiltersAndRender();
}

// --- UI RENDER FUNCTIONS ---
function renderHeader(highRiskAlerts) {
  const container = document.getElementById("notification-bell-container");
  if (!container) return;
  container.innerHTML = `
        <div class="notification-wrapper">
            <button class="notification-button" aria-label="High risk alerts">
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="24" width="24"><path d="M224 512c35.32 0 63.97-28.65 63.97-64H160.03c0 35.35 28.65 64 63.97 64zm215.39-149.71c-19.32-20.76-55.47-51.99-55.47-154.29 0-77.7-54.48-139.9-127.94-155.16V32c0-17.67-14.32-32-31.98-32s-31.98 14.33-31.98 32v20.84C118.56 68.1 64.08 130.3 64.08 208c0 102.3-36.15 133.53-55.47 154.29-6 6.45-8.66 14.16-8.61 21.71.11 16.4 12.98 32 32.1 32h383.8c19.12 0 32-15.6 32.1-32 .05-7.55-2.61-15.26-8.61-21.71z"></path></svg>
                ${
                  highRiskAlerts.length > 0
                    ? `<span class="notification-badge">${highRiskAlerts.length}</span>`
                    : ""
                }
            </button>
            <div class="notification-dropdown">
                ${
                  highRiskAlerts.length > 0
                    ? highRiskAlerts
                        .map(
                          (alert) =>
                            `<div class="notification-item" data-alert-name="${alert.name}">
                        <span class="notification-item-icon">🔥</span>
                        <span class="notification-item-text">${alert.name}</span>
                    </div>`
                        )
                        .join("")
                    : '<div class="notification-item empty">No high risk alerts found.</div>'
                }
            </div>
        </div>`;

  const bellButton = container.querySelector(".notification-button");
  const dropdown = container.querySelector(".notification-dropdown");
  bellButton.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });
  document.addEventListener("click", () => dropdown.classList.remove("show"));
  container
    .querySelector(".notification-dropdown")
    .addEventListener("click", (e) => e.stopPropagation());

  container
    .querySelectorAll(".notification-item[data-alert-name]")
    .forEach((item) => {
      item.addEventListener("click", () => {
        filters.risk = "High";
        filters.report = "";
        filters.searchTerm = item.dataset.alertName;
        dropdown.classList.remove("show");
        applyFiltersAndRender();
      });
    });
}

function renderKPICards() {
  const container = document.getElementById("security-kpi-container");
  if (!container) return;
  const counts = allAlerts.reduce(
    (acc, alert) => {
      acc[alert.risk.toLowerCase()] =
        (acc[alert.risk.toLowerCase()] || 0) + alert.totalInstances;
      return acc;
    },
    { high: 0, medium: 0, low: 0, informational: 0 }
  );
  const cards = [
    {
      title: "High Risk",
      value: counts.high,
      icon: "🔥",
      color: "var(--error-color)",
    },
    {
      title: "Medium Risk",
      value: counts.medium,
      icon: "⚠️",
      color: "#f97316",
    },
    { title: "Low Risk", value: counts.low, icon: "💡", color: "#eab308" },
    {
      title: "Informational",
      value: counts.informational,
      icon: "ℹ️",
      color: "var(--primary-color)",
    },
  ];
  container.innerHTML = `<div class="cards-grid">${cards
    .map(
      (card) => `
    <div class="info-card">
        <div class="info-card-icon">${card.icon}</div>
        <div>
            <h3 class="info-card-title">${card.title}</h3>
            <p class="info-card-value" style="color: ${card.color};">${card.value}</p>
        </div>
    </div>`
    )
    .join("")}</div>`;
}

function renderAlertsChart() {
  const container = document.getElementById("alerts-chart-container");
  if (!container) return;
  const reportDataMap = rawParsedAlerts.reduce((acc, alert) => {
    if (!acc[alert.report]) {
      acc[alert.report] = {
        high: 0,
        medium: 0,
        low: 0,
        informational: 0,
        total: 0,
        date: alert.executionDate,
      };
    }
    acc[alert.report][alert.risk.toLowerCase()] += alert.instances;
    acc[alert.report].total += alert.instances;
    return acc;
  }, {});
  const colors = {
    High: "var(--error-color)",
    Medium: "#f97316",
    Low: "#eab308",
    Informational: "var(--primary-color)",
  };

  let chartOptions;
  if (filters.report && reportDataMap[filters.report]) {
    const reportData = reportDataMap[filters.report];
    const risks = ["High", "Medium", "Low", "Informational"];
    chartOptions = {
      chart: { type: "bar", backgroundColor: "transparent" },
      title: {
        text: `Alert Breakdown for ${filters.report}`,
        style: { color: "var(--text-primary)" },
      },
      xAxis: {
        categories: risks,
        labels: { style: { color: "var(--text-secondary)" } },
      },
      yAxis: {
        min: 0,
        title: { text: null },
        labels: { style: { color: "var(--text-secondary)" } },
      },
      legend: { enabled: false },
      tooltip: { pointFormat: "Instances: <b>{point.y}</b>" },
      series: [
        {
          name: "Instances",
          data: risks.map((r) => ({
            y: reportData[r.toLowerCase()],
            color: colors[r],
          })),
        },
      ],
    };
  } else {
    const reports = Object.keys(reportDataMap).sort();
    const risks = ["High", "Medium", "Low"];
    const series = risks.map((risk) => ({
      name: risk,
      color: colors[risk],
      data: reports.map((report) => reportDataMap[report][risk.toLowerCase()]),
      marker: { symbol: "circle" },
    }));
    chartOptions = {
      chart: { type: "line", backgroundColor: "transparent" },
      title: {
        text: "Alert Trend by Risk Level",
        style: { color: "var(--text-primary)" },
      },
      xAxis: {
        categories: reports,
        labels: { style: { color: "var(--text-secondary)" } },
      },
      yAxis: {
        title: { text: "Number of Instances" },
        labels: { style: { color: "var(--text-secondary)" } },
      },
      legend: { itemStyle: { color: "var(--text-secondary)" } },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
        style: { color: "var(--text-primary)" },
        formatter: function () {
          const reportName = this.points[0].key;
          const reportData = reportDataMap[reportName];
          if (!reportData) return "No data";

          let tooltipHtml = `<div class="chart-tooltip">
                        <div class="tooltip-header">${reportName}</div>
                        <div class="tooltip-date">Executed: ${reportData.date}</div>
                        <div class="tooltip-body">`;

          this.points.forEach((point) => {
            tooltipHtml += `<div class="tooltip-row"><span class="tooltip-color-dot" style="background-color:${point.series.color};"></span><span class="tooltip-series-name">${point.series.name}:</span><span class="tooltip-point-value">${point.y}</span></div>`;
          });

          tooltipHtml += `<div class="tooltip-row informational"><span class="tooltip-color-dot" style="background-color:${colors.Informational};"></span><span class="tooltip-series-name">Informational:</span><span class="tooltip-point-value">${reportData.informational}</span></div>`;
          tooltipHtml += `</div><div class="tooltip-footer">Total Instances: <b>${reportData.total}</b></div></div>`;
          return tooltipHtml;
        },
      },
      series: series,
    };
  }
  chartOptions.credits = { enabled: false };
  Highcharts.chart(container, chartOptions);
}

function renderFilters() {
  const container = document.getElementById("security-filters-container");
  if (!container) return;
  const risks = ["High", "Medium", "Low", "Informational"];
  const reports = [...new Set(allAlerts.flatMap((a) => a.reports))].sort();
  container.innerHTML = `
    <input type="text" id="alert-search" placeholder="Search alerts..." value="${
      filters.searchTerm
    }">
    <select id="risk-filter"><option value="">All Risks</option>${risks
      .map(
        (r) =>
          `<option value="${r}" ${
            filters.risk === r ? "selected" : ""
          }>${r}</option>`
      )
      .join("")}</select>
    <select id="report-filter"><option value="">All Reports</option>${reports
      .map(
        (r) =>
          `<option value="${r}" ${
            filters.report === r ? "selected" : ""
          }>${r}</option>`
      )
      .join("")}</select>
    <button id="reset-button" class="reset-button">Reset Filters</button>`;
  document.getElementById("alert-search").addEventListener("input", (e) => {
    filters.searchTerm = e.target.value;
    applyFiltersAndRender();
  });
  document.getElementById("risk-filter").addEventListener("change", (e) => {
    filters.risk = e.target.value;
    applyFiltersAndRender();
  });
  document.getElementById("report-filter").addEventListener("change", (e) => {
    filters.report = e.target.value;
    applyFiltersAndRender();
  });
  document
    .getElementById("reset-button")
    .addEventListener("click", resetDashboardState);
}

function renderAlertsList() {
  const container = document.getElementById("alerts-list-container");
  if (!container) return;
  if (filteredAlerts.length === 0) {
    container.innerHTML = `<div class="placeholder-text">No alerts match filters.</div>`;
    return;
  }
  const riskColorMap = {
    High: "var(--error-color)",
    Medium: "#f97316",
    Low: "#eab308",
    Informational: "var(--primary-color)",
  };
  container.innerHTML = `<div class="alerts-list">${filteredAlerts
    .map(
      (alert, index) => `
        <div class="alert-item ${
          index === selectedAlertIndex ? "active" : ""
        }" data-index="${index}">
            <div class="alert-item-risk-indicator" style="background-color: ${
              riskColorMap[alert.risk]
            };"></div>
            <div class="alert-item-content">
                <div class="alert-item-name">${alert.name}</div>
                <div class="alert-item-meta">
                    <span style="color: ${
                      riskColorMap[alert.risk]
                    }; font-weight: bold;">${alert.risk}</span>
                    <span>•</span>
                    <span>${alert.totalInstances} instance(s)</span>
                </div>
            </div>
        </div>`
    )
    .join("")}</div>`;
  document.querySelectorAll(".alert-item").forEach((item) => {
    item.addEventListener("click", () => {
      selectedAlertIndex = parseInt(item.dataset.index, 10);
      expandedInstances.clear(); // Clear expanded instances when selecting new alert
      renderAlertsList();
      renderAlertDetail();
      renderAlertInstances();
    });
  });
}

function renderAlertDetail() {
  const container = document.getElementById("alert-detail-container");
  if (!container) return;
  const alert =
    selectedAlertIndex !== null ? filteredAlerts[selectedAlertIndex] : null;
  if (!alert) {
    container.innerHTML = `<div class="placeholder-text">Select an alert from the list to see its details.</div>`;
    return;
  }
  container.innerHTML = `
        <h2 class="detail-section-title">${alert.name}</h2>
        <div class="detail-scroll-area">
            <div class="detail-section"><h3>Description</h3><div class="detail-prose">${
              alert.description
            }</div></div>
            <div class="detail-section"><h3>Solution</h3><div class="detail-prose">${
              alert.solution
            }</div></div>
            <div class="detail-section">
                <h3>Metadata</h3>
                <div class="detail-metadata-grid">
                    <div>CWE ID</div><div class="metadata-value">${
                      alert.cweId
                    }</div>
                    <div>WASC ID</div><div class="metadata-value">${
                      alert.wascId
                    }</div>
                    <div>Plugin ID</div><div class="metadata-value">${
                      alert.pluginId
                    }</div>
                </div>
            </div>
            <div class="detail-section"><h3>Reference</h3><div class="reference-links">${
              alert.reference
            }</div></div>
            <div class="detail-section"><h3>Found In Reports</h3><div class="report-tags-container">${alert.reports
              .map((r) => `<span class="report-tag">${r}</span>`)
              .join("")}</div></div>
        </div>`;
}

function toggleRequestResponse(instanceId) {
  if (expandedInstances.has(instanceId)) {
    expandedInstances.delete(instanceId);
  } else {
    expandedInstances.add(instanceId);
  }
  renderAlertInstances();
}

function renderAlertInstances() {
  const container = document.getElementById("alert-instances-container");
  if (!container) return;
  const alert =
    selectedAlertIndex !== null ? filteredAlerts[selectedAlertIndex] : null;
  if (!alert || !alert.vulnerableUrls || alert.vulnerableUrls.length === 0) {
    container.innerHTML = `<div class="alert-detail-content full-width"><h2 class="detail-section-title">Vulnerable Instances</h2><div class="placeholder-text">No specific instances were recorded for this alert type.</div></div>`;
    return;
  }

  // Debug: Check if any instance has request/response data
  const hasAnyRequestResponse = alert.vulnerableUrls.some(
    (instance) =>
      instance.requestHeader ||
      instance.requestBody ||
      instance.responseHeader ||
      instance.responseBody
  );
  console.log(`Alert has request/response data: ${hasAnyRequestResponse}`);

  const instancesHtml = alert.vulnerableUrls
    .map((instance, index) => {
      const instanceId = `${selectedAlertIndex}-${index}`;
      const isExpanded = expandedInstances.has(instanceId);
      const hasRequestResponse =
        instance.requestHeader ||
        instance.requestBody ||
        instance.responseHeader ||
        instance.responseBody;

      // Debug: Log instances with request/response
      if (hasRequestResponse) {
        console.log(`Instance ${index} has request/response data`);
      }

      return `
      <tr class="instance-row">
        <td data-label="Source Report"><span class="report-tag">${
          instance.report || "N/A"
        }</span></td>
        <td data-label="URL">${instance.url || "N/A"}</td>
        <td data-label="Method">${instance.method || "N/A"}</td>
        <td data-label="Parameter">${instance.parameter || "N/A"}</td>
        <td data-label="Attack">${instance.attack || "N/A"}</td>
        <td data-label="Evidence">${instance.evidence || "N/A"}</td>
        <td data-label="Actions">
          ${
            hasRequestResponse
              ? `
            <button class="toggle-btn" onclick="toggleRequestResponse('${instanceId}')">
              ${isExpanded ? "Hide" : "Show"} Request/Response
            </button>
          `
              : '<span class="no-data">N/A</span>'
          }
        </td>
      </tr>
      ${
        hasRequestResponse && isExpanded
          ? `
        <tr class="request-response-row">
          <td colspan="7">
            <div class="request-response-container">
              ${
                instance.requestHeader || instance.requestBody
                  ? `
                <div class="request-section">
                  <h4>Request</h4>
                  ${
                    instance.requestHeader
                      ? `
                    <div class="req-resp-part">
                      <h5>Headers</h5>
                      <pre class="code-block">${instance.requestHeader}</pre>
                    </div>
                  `
                      : ""
                  }
                  ${
                    instance.requestBody
                      ? `
                    <div class="req-resp-part">
                      <h5>Body</h5>
                      <pre class="code-block">${
                        instance.requestBody || "(empty)"
                      }</pre>
                    </div>
                  `
                      : ""
                  }
                </div>
              `
                  : ""
              }
              ${
                instance.responseHeader || instance.responseBody
                  ? `
                <div class="response-section">
                  <h4>Response</h4>
                  ${
                    instance.responseHeader
                      ? `
                    <div class="req-resp-part">
                      <h5>Headers</h5>
                      <pre class="code-block">${instance.responseHeader}</pre>
                    </div>
                  `
                      : ""
                  }
                  ${
                    instance.responseBody
                      ? `
                    <div class="req-resp-part">
                      <h5>Body</h5>
                      <pre class="code-block">${instance.responseBody}</pre>
                    </div>
                  `
                      : ""
                  }
                </div>
              `
                  : ""
              }
            </div>
          </td>
        </tr>
      `
          : ""
      }
    `;
    })
    .join("");

  container.innerHTML = `
    <div class="alert-detail-content full-width">
      <h2 class="detail-section-title">Vulnerable Instances (${alert.vulnerableUrls.length})</h2>
      <div class="table-wrapper instances-table-wrapper">
        <table class="detail-instances-table">
          <thead>
            <tr>
              <th>Source Report</th>
              <th>URL</th>
              <th>Method</th>
              <th>Parameter</th>
              <th>Attack</th>
              <th>Evidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${instancesHtml}</tbody>
        </table>
      </div>
    </div>`;
}

// Add this helper function if hideLoading is not defined elsewhere
function hideLoading() {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = "none";
  }
  // Also check for other common loading element IDs
  const loaderElement = document.getElementById("loader");
  if (loaderElement) {
    loaderElement.style.display = "none";
  }
  // Check for loading overlay (as per your HTML)
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "none";
  }
  // Remove any loading classes from body
  document.body.classList.remove("loading");

  // IMPORTANT: Show the main content after loading
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.style.display = "block";
  }
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing security dashboard...");

  // Check if required container elements exist
  const requiredElements = [
    "notification-bell-container",
    "security-kpi-container",
    "alerts-chart-container",
    "security-filters-container",
    "alerts-list-container",
    "alert-detail-container",
    "alert-instances-container",
  ];

  const missingElements = requiredElements.filter(
    (id) => !document.getElementById(id)
  );

  if (missingElements.length > 0) {
    console.error("Missing required elements:", missingElements);
    document.body.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h2>Error: Missing required HTML elements</h2>
        <p>The following element IDs are required but not found:</p>
        <ul>${missingElements.map((id) => `<li>${id}</li>`).join("")}</ul>
        <p>Please ensure your HTML includes all required containers.</p>
      </div>
    `;
    return;
  }

  fetchAndParseData();
});

// Make toggleRequestResponse available globally
window.toggleRequestResponse = toggleRequestResponse;
