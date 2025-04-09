import React from "react";
import MetricChartTemplate from "./MetricChartTemplate";

const BestPracticeChart = ({ data, allData, theme }) => (
  <MetricChartTemplate
    data={data}
    allData={allData}
    theme={theme}
    title="Best Practices for Last 3 Runs"
    metricKey="best_practice"
    valueLabel="Filter by Best Practice:"
  />
);

export default BestPracticeChart;
