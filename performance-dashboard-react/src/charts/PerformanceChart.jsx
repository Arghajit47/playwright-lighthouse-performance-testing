import React from "react";
import MetricChartTemplate from "./MetricChartTemplate";

const PerformanceChart = ({ data, allData, theme }) => (
  <MetricChartTemplate
    data={data}
    allData={allData}
    theme={theme}
    title="Performance for Last 3 Runs"
    metricKey="performance"
    valueLabel="Filter by Performance:"
  />
);

export default PerformanceChart;
