import { playAudit } from "playwright-lighthouse";

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
    thresholds: {
      performance: 80,
      accessibility: 50,
      "best-practices": 50,
      seo: 50,
    },
    ignoreError: true,
    reports: {
      formats: {
        json: false,
        html: true,
        csv: false,
      },
      name: `${reportName}-${new Date().getMilliseconds()}`,
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
    thresholds: {
      performance: 80,
      accessibility: 50,
      "best-practices": 50,
      seo: 50,
    },
    ignoreError: true,
    reports: {
      formats: {
        json: false,
        html: true,
        csv: false,
      },
      name: `${reportName}-${new Date().getMilliseconds()}`,
      directory: directory,
    },
  });
}