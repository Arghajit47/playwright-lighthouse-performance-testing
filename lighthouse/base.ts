export const mobileConfig = {
  setView: "lighthouse:default",
  extends: "lighthouse:default",
  settings: {
    onlyCategories: ["performance"],
    emulatedFormFactor: "mobile",
    throttling: {
      rttMs: 40,
      throughputKbps: 1024,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
      cpuSlowdownMultiplier: 1,
    },
  },
};

export const thresholds = {
  performance: 80,
  accessibility: 50,
  "best-practices": 50,
  seo: 50,
};
