import { playAudit } from "playwright-lighthouse";
import { thresholds } from "../lighthouse/base";
import pidusage from "pidusage";
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
import fs from "fs";
import * as path from "path";

export async function runPerformanceAuditInDesktop(
  page,
  reportName: string,
  config,
  directory: string
) {
  await playAudit({
    page: page,
    config: config,
    port: 9222,
    thresholds: thresholds,
    ignoreError: true,
    reports: {
      formats: {
        json: false,
        html: true,
        csv: false,
      },
      name: `${reportName}`,
      directory: directory,
    },
  });
}

export async function runPerformanceAuditInMobile(
  page,
  reportName: string,
  config,
  directory: string
) {
  await playAudit({
    page: page,
    config: config,
    port: 9222,
    thresholds: thresholds,
    ignoreError: true,
    reports: {
      formats: {
        json: false,
        html: true,
        csv: false,
      },
      name: `${reportName}`,
      directory: directory,
    },
  });
}

export async function runPerformanceAuditInTablet(
  page,
  reportName: string,
  config,
  directory: string
) {
  await playAudit({
    page: page,
    config: config,
    port: 9222,
    thresholds: thresholds,
    ignoreError: true,
    reports: {
      formats: {
        json: false,
        html: true,
        csv: false,
      },
      name: `${reportName}`,
      directory: directory,
    },
  });
}

interface Metric {
  time: number;
  cpu: number;
  memory: number;
}

export async function recordPerformanceMetrics(interval = 500) {
  const metrics: Metric[] = [];
  const startTime = Date.now();

  const intervalId = setInterval(async () => {
    const stats = await pidusage(process.pid);
    metrics.push({
      time: Date.now() - startTime,
      cpu: stats.cpu,
      memory: stats.memory / (1024 * 1024), // Convert bytes to MB
    });
  }, interval);

  return {
    stop: () => clearInterval(intervalId),
    getMetrics: () => metrics,
  };
}

export async function generateGraph(metrics: Metric[], filename: string) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });

  const labels = metrics.map((m) => (m.time / 1000).toFixed(1) + "s");
  const cpuData = metrics.map((m) => m.cpu);
  const memoryData = metrics.map((m) => m.memory);

  const configuration = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "CPU Usage (%)",
          data: cpuData,
          borderColor: "rgba(75, 192, 192, 1)",
          fill: false,
        },
        {
          label: "Memory Usage (MB)",
          data: memoryData,
          borderColor: "rgba(255, 99, 132, 1)",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: "Time (seconds)", color: "black" } },
        y: { title: { display: true, text: "Usage", color: "black" } },
      },
      plugins: {
        legend: {
          labels: {
            color: "black",
          },
        },
      },
    },
    plugins: [
      {
        id: "background_color",
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          ctx.save();
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        },
      },
    ],
  };
  const directory = path.dirname(filename);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync(filename, imageBuffer);
}

export async function attachGraph(
  metricsRecorder: { stop: () => void; getMetrics: () => Metric[] },
  testInfo: {
    title: string;
    attach: (
      name: string,
      options: { path: string; contentType: string }
    ) => void;
  },
  paths
) {
  metricsRecorder.stop();
  const metrics = metricsRecorder.getMetrics();

  // Generate graph
  const graphFilename = `performance-report/cpu/${testInfo.title}.png`;
  // const screenshots = `performance-report/screenshots/${testInfo.title}.png`;
  await generateGraph(metrics, graphFilename);
  await createHtmlScreenshot(paths, testInfo);

  // Attach graph to the report
  testInfo.attach("CPU and Memory Usage Graph", {
    path: graphFilename,
    contentType: "image/png",
  });
}

export async function createHtmlScreenshot(
  paths,
  testInfo: {
    title: string;
    attach: (
      name: string,
      options: { path: string; contentType: string }
    ) => void;
  },
  page = this.page
) {
  let folderPath;
  // Determine the correct folder path based on the test title

  if (testInfo.title.includes("Desktop")) {
    folderPath = paths.desktopPath.toString();
  } else if (testInfo.title.includes("Mobile")) {
    folderPath = paths.mobilePath.toString();
  } else if (testInfo.title.includes("Tablet")) {
    folderPath = paths.tabletPath.toString();
  }
  try {
    // Path to your HTML file
    const htmlPath = path.join(folderPath, `${testInfo.title}.html`);

    // Check if the HTML file exists
    if (!fs.existsSync(htmlPath)) {
      console.error(`File not found: ${htmlPath}`);
      return;
    }

    // Convert the HTML file to a file URL
    const htmlFileUrl = `file://${htmlPath}`;

    // Navigate to the HTML file URL
    await page.goto(htmlFileUrl, { waitUntil: "load" });

    // Generate the output image path
    const outputImagePath = path.join(folderPath, `${testInfo.title}.png`);

    // Take a full-page screenshot
    await page.screenshot({ path: outputImagePath, fullPage: true });

    console.log(`Image generated successfully at ${outputImagePath}`);

    // Attach the screenshot to the test report
    testInfo.attach("Lighthouse Report Image", {
      path: outputImagePath,
      contentType: "image/png",
    });
  } catch (error) {
    console.error("Error generating image:", error);
  }
}


