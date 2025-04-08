import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

const DeviceChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const device_types = {};
    data.forEach((d) => {
      if (!device_types[d.device_type]) {
        device_types[d.device_type] = { count: 0, performance: 0 };
      }
      device_types[d.device_type].count++;
      device_types[d.device_type].performance += d.performance;
    });

    const device_typeLabels = Object.keys(device_types);
    const device_typeData = device_typeLabels.map((d) =>
      Math.round(device_types[d].performance / device_types[d].count)
    );

    const ctx = chartRef.current.getContext("2d");

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: device_typeLabels,
        datasets: [
          {
            label: "Avg Performance",
            data: device_typeData,
            backgroundColor: "rgb(88, 62, 37)",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            ticks: {
              font: {
                size: window.innerWidth < 480 ? 10 : 14,
              },
              maxRotation: 0,
              minRotation: 0,
            },
          },
          x: {
            ticks: {
              font: {
                size: window.innerWidth < 480 ? 10 : 14,
              },
            },
            beginAtZero: true,
          },
        },
        elements: {
          bar: {
            barThickness: window.innerWidth < 480 ? 10 : 20,
          },
        },
        plugins: {
          legend: { display: false },
          title: { display: true, text: "device_type Performance Comparison" },
          datalabels: {
            color: "#fff",
            font: { weight: "bold", size: 14 },
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => chart.destroy();
  }, [data]);

  return (
    <div className="chart-container">
      <h2>Average Performance by Device</h2>
      <canvas id="DeviceChart" ref={chartRef}></canvas>
    </div>
  );
};

export default DeviceChart;
