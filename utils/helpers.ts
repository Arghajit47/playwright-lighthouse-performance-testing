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
  paths,
  page
) {
  metricsRecorder.stop();
  const metrics = metricsRecorder.getMetrics();

  // Generate graph
  const graphFilename = `performance-report/cpu/${testInfo.title}.png`;
  // const screenshots = `performance-report/screenshots/${testInfo.title}.png`;
  await generateGraph(metrics, graphFilename);
  // await createHtmlScreenshot(paths, testInfo, page);

  // Attach graph to the report
  testInfo.attach("CPU and Memory Usage Graph", {
    path: graphFilename,
    contentType: "image/png",
  });
}




