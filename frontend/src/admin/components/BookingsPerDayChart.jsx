import React from "react";
import { Line } from "react-chartjs-2";
import "./chartConfig.js";

const BookingsPerDayChart = ({ data = [], loading, rangeLabel }) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  const labels = data.map((item) =>
    formatter.format(new Date(item.date ?? item._id))
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Bookings",
        data: data.map((item) => item.totalBookings),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#1d4ed8",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `${tooltipItem.parsed.y} bookings`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="metrics-card">
      <div className="chart-header">
        <div>
          <p className="chart-label">Total bookings per day</p>
          <h3>Daily Booking Trend</h3>
        </div>
        {rangeLabel && <span className="chart-range">{rangeLabel}</span>}
      </div>

      {loading ? (
        <p className="chart-placeholder">Loading chart…</p>
      ) : data.length === 0 ? (
        <p className="chart-placeholder">No bookings in this range</p>
      ) : (
        <div className="chart-wrapper">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default BookingsPerDayChart;

