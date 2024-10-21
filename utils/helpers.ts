import { playAudit } from "playwright-lighthouse";
import { thresholds } from "../lighthouse/base";

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
    thresholds: thresholds,
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