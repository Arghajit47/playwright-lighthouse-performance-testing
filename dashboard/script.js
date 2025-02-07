let allData = []; // Store all data for filtering
let horizontalBarChart; // Store the chart instance for updates

// Dark/Light Mode Toggle
function toggleTheme() {
  const body = document.body;
  body.classList.toggle("light-mode");
  const icon = document.querySelector(".theme-toggle i");
  if (body.classList.contains("light-mode")) {
    icon.classList.replace("fa-moon", "fa-sun");
    body.style.backgroundColor = "#f4f4f4";
    body.style.color = "#333";
  } else {
    icon.classList.replace("fa-sun", "fa-moon");
    body.style.backgroundColor = "#1e1e2e";
    body.style.color = "#fff";
  }
}

// Fetch Data and Update Dashboard
async function fetchData() {
  try {
    const creds = await fetch("./config.json");
    const config = await creds.json();

    const SUPABASE_URL = config.SUPABASE_URL;
    const SUPABASE_TABLE_NAME = config.SUPABASE_TABLE_NAME;
    const SUPABASE_TOKEN = config.SUPABASE_TOKEN;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}`,
      {
        headers: {
          apikey: `${SUPABASE_TOKEN}`,
        },
      }
    );
    allData = await response.json();
    updateDashboard(allData);
    populateDeviceFilter(allData);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    document.getElementById("loading").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
  }
}

// Populate Device Filter Options
function populateDeviceFilter(data) {
  const deviceTypes = [...new Set(data.map((d) => d.device_type))];
  const filter = document.getElementById("deviceFilter");
  deviceTypes.forEach((device) => {
    const option = document.createElement("option");
    option.value = device;
    option.textContent = device;
    filter.appendChild(option);
  });
}

// Apply Filters

function applyFilters() {
  const selectedDevice = document.getElementById("deviceFilter").value;
  const selectedPerformance =
    document.getElementById("performanceFilter").value;

  let filteredData = allData;

  // Filter by Device
  if (selectedDevice !== "All") {
    filteredData = filteredData.filter((d) => d.device_type === selectedDevice);
  }

  // Filter by Performance
  if (selectedPerformance !== "All") {
    let [min, max] = selectedPerformance.split("-").map(Number);

    // Swap min and max if the range is descending (e.g., 100-80)
    if (min > max) {
      [min, max] = [max, min]; // Swap values
    }

    console.log(`Filtering by performance: ${min} - ${max}`);
    filteredData = filteredData.filter((d) => {
      console.log(`Checking performance: ${d.performance}`);
      return d.performance >= min && d.performance <= max;
    });
  }

  console.log("Filtered Data:", filteredData);
  updateHorizontalBarChart(filteredData);
}

// Update Horizontal Bar Chart
function updateHorizontalBarChart(data) {
  const latestTests = {};
  data.forEach((d) => {
    if (!latestTests[d.test_name]) latestTests[d.test_name] = [];
    if (latestTests[d.test_name].length < 3) latestTests[d.test_name].push(d);
  });

  const testNames = Object.keys(latestTests);
  const barData = testNames.map(
    (test) => latestTests[test][latestTests[test].length - 1].performance
  );
  const tooltipData = testNames.map((test) =>
    latestTests[test].map((run) => run.performance)
  );

  // Dynamic Bar Colors
  const barColors = barData.map((score) => {
    if (score > 80) return "rgba(75, 192, 192, 0.8)"; // Green
    if (score >= 50 && score <= 80) return "rgba(255, 159, 64, 0.8)"; // Orange
    return "rgba(255, 99, 132, 0.8)"; // Red
  });

  if (horizontalBarChart) {
    horizontalBarChart.destroy(); // Destroy existing chart
  }

  horizontalBarChart = new Chart(
    document.getElementById("horizontalBarChart"),
    {
      type: "bar",
      data: {
        labels: testNames,
        datasets: [
          {
            label: "Latest Performance",
            data: barData,
            backgroundColor: barColors,
            borderColor: barColors.map((color) => color.replace("0.8", "1")),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const testName = testNames[context.dataIndex];
                const runs = tooltipData[context.dataIndex];
                return runs
                  .map((run, index) =>
                    run !== undefined ? `Run ${index + 1}: ${run}` : ""
                  )
                  .filter(Boolean)
                  .join(", ");
              },
            },
          },
          legend: { display: false },
          title: { display: true, text: "Performance for Last 3 Runs" },
        },
      },
    }
  );
}

// Update Dashboard
function updateDashboard(data) {
  const latestTests = {};
  data.forEach((d) => {
    if (!latestTests[d.test_name]) latestTests[d.test_name] = [];
    if (latestTests[d.test_name].length < 3) latestTests[d.test_name].push(d);
  });

  // Function to set the color based on the score
  function setScoreColor(element, score) {
    if (score > 80) {
      element.style.color = "#4CAF50"; // Green
    } else if (score >= 50 && score <= 80) {
      element.style.color = "#FFA500"; // Orange/Deep Yellow
    } else {
      element.style.color = "#FF5252"; // Red
    }
  }

  // Update the scores and set their colors
  const accessibilityScoreElement = document.getElementById(
    "accessibility-score"
  );
  const seoScoreElement = document.getElementById("seo-score");
  const bestPracticeScoreElement = document.getElementById(
    "best-practice-score"
  );

  const accessibilityScore = data[data.length - 1].accessibility;
  const seoScore = data[data.length - 1].seo;
  const bestPracticeScore = data[data.length - 1].best_practice;

  accessibilityScoreElement.innerText = accessibilityScore;
  seoScoreElement.innerText = seoScore;
  bestPracticeScoreElement.innerText = bestPracticeScore;

  // Set colors based on scores
  setScoreColor(accessibilityScoreElement, accessibilityScore);
  setScoreColor(seoScoreElement, seoScore);
  setScoreColor(bestPracticeScoreElement, bestPracticeScore);

  updateHorizontalBarChart(data);

  // Bar Chart for Device Comparison
  const devices = {};
  data.forEach((d) => {
    if (!devices[d.device_type])
      devices[d.device_type] = { count: 0, performance: 0 };
    devices[d.device_type].count++;
    devices[d.device_type].performance += d.performance;
  });
  const deviceLabels = Object.keys(devices);
  const deviceData = deviceLabels.map(
    (d) => devices[d].performance / devices[d].count
  );
  new Chart(document.getElementById("deviceChart"), {
    type: "bar",
    data: {
      labels: deviceLabels,
      datasets: [
        {
          label: "Avg Performance",
          data: deviceData,
          backgroundColor: "rgba(106, 17, 203, 0.8)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Device Performance Comparison" },
      },
    },
  });

  // Table for Latest Test Results
  const tableBody = document.getElementById("data-table");
  tableBody.innerHTML = ""; // Clear existing rows
  data
    .reverse()
    .slice(0, 10)
    .forEach((d) => {
      const row = `<tr><td>${d.test_name}</td><td>${d.device_type}</td><td>${d.performance}</td><td>${d.accessibility}</td><td>${d.seo}</td><td>${d.best_practice}</td><td>${d.created_at}</td></tr>`;
      tableBody.innerHTML += row;
    });
}

fetchData();
