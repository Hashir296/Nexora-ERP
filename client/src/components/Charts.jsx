import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const teal = '#0f766e';
const tealSoft = 'rgba(15, 118, 110, 0.18)';
const amber = '#c2410c';
const slate = '#64748b';
const colors = ['#0f766e', '#0ea5e9', '#c2410c', '#7c3aed', '#15803d', '#a16207', '#be123c', '#334155'];

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { boxWidth: 12, usePointStyle: true, font: { family: 'DM Sans', size: 12 } },
    },
    tooltip: {
      backgroundColor: '#0f1f1c',
      padding: 10,
      cornerRadius: 8,
    },
  },
};

export function SalesLineChart({ rows = [] }) {
  const data = {
    labels: rows.map((r) => r.label),
    datasets: [
      {
        label: 'Sales ($)',
        data: rows.map((r) => r.total),
        borderColor: teal,
        backgroundColor: tealSoft,
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: teal,
      },
    ],
  };
  return (
    <div className="chart-box">
      <Line
        data={data}
        options={{
          ...baseOptions,
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: 'rgba(15,31,28,0.06)' } },
          },
        }}
      />
    </div>
  );
}

export function FinanceBarChart({ rows = [] }) {
  const data = {
    labels: rows.map((r) => r.label),
    datasets: [
      {
        label: 'Income',
        data: rows.map((r) => r.income),
        backgroundColor: teal,
        borderRadius: 6,
      },
      {
        label: 'Expense',
        data: rows.map((r) => r.expense),
        backgroundColor: amber,
        borderRadius: 6,
      },
    ],
  };
  return (
    <div className="chart-box">
      <Bar
        data={data}
        options={{
          ...baseOptions,
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: 'rgba(15,31,28,0.06)' } },
          },
        }}
      />
    </div>
  );
}

export function FunnelDoughnut({ rows = [] }) {
  const data = {
    labels: rows.map((r) => r.status),
    datasets: [
      {
        data: rows.map((r) => r.count),
        backgroundColor: rows.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
      },
    ],
  };
  return (
    <div className="chart-box chart-box-sm">
      <Doughnut data={data} options={baseOptions} />
    </div>
  );
}

export function AttendanceDoughnut({ rows = [] }) {
  const data = {
    labels: rows.map((r) => r.status),
    datasets: [
      {
        data: rows.map((r) => r.count),
        backgroundColor: rows.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
      },
    ],
  };
  return (
    <div className="chart-box chart-box-sm">
      <Doughnut data={data} options={baseOptions} />
    </div>
  );
}

export function InventoryBarChart({ rows = [] }) {
  const data = {
    labels: rows.map((r) => r.name),
    datasets: [
      {
        label: 'Stock qty',
        data: rows.map((r) => r.quantity),
        backgroundColor: rows.map((r) => (r.quantity <= r.threshold ? amber : teal)),
        borderRadius: 6,
      },
    ],
  };
  return (
    <div className="chart-box">
      <Bar
        data={data}
        options={{
          ...baseOptions,
          indexAxis: 'y',
          scales: {
            x: { beginAtZero: true, grid: { color: 'rgba(15,31,28,0.06)' } },
            y: { grid: { display: false } },
          },
        }}
      />
    </div>
  );
}

export { slate };
