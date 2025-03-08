export const thresholds = {
  performance: 80,
  accessibility: 50,
  "best-practices": 50,
  seo: 50,
};

// Lighthouse configuration for mobile devices
export const mobileConfig = {
  extends: "lighthouse:default",
  settings: {
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      deviceScaleFactor: 2,
      disabled: false,
    },
    // throttling: {
    //   rttMs: 40,
    //   throughputKbps: 1024,
    //   requestLatencyMs: 0,
    //   downloadThroughputKbps: 0,
    //   uploadThroughputKbps: 0,
    //   cpuSlowdownMultiplier: 1,
    // },
  },
};

// Lighthouse configuration for desktop devices
export const desktopConfig = {
  extends: "lighthouse:default",
  settings: {
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1980,
      height: 1080,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

// Lighthouse configuration for tablet devices (customized)
// Note: Lighthouse doesn’t provide a default "tablet" preset, so we define typical tablet dimensions.
export const tabletConfig = {
  extends: "lighthouse:default",
  settings: {
    // Although tablets are often treated like mobile devices, you can adjust the parameters as needed.
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
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
