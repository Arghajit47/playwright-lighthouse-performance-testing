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


export const tabletConfig = {
  setView: "lighthouse:default",
  extends: "lighthouse:default",
  settings: {
    onlyCategories: ["performance"],
    emulatedFormFactor: "tablet",
    screenEmulation: {
      mobile: true,
      width: 1024, // Typical tablet width in landscape mode
      height: 768, // Typical tablet height in landscape mode
      deviceScaleFactor: 2, // Simulate high-resolution tablet display
      disabled: false,
    },
    throttling: {
      rttMs: 50, // Slightly slower than mobile
      throughputKbps: 1500, // Adjusted for typical tablet network speeds
      requestLatencyMs: 0,
      downloadThroughputKbps: 1500,
      uploadThroughputKbps: 750,
      cpuSlowdownMultiplier: 1.5, // Slight CPU throttling to simulate tablet performance
    },
  },
};

