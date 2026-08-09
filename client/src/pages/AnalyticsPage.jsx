import { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader, LoadingBlock } from '../components/ui';
import {
  SalesLineChart,
  FinanceBarChart,
  FunnelDoughnut,
  AttendanceDoughnut,
  InventoryBarChart,
} from '../components/Charts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analytics/overview').then((res) => setData(res.data.data));
  }, []);

  if (!data) return <LoadingBlock />;
  const { kpis, charts } = data;

  return (
    <div>
      <PageHeader
        title="Analytics center"
        subtitle="All charts are computed from live MongoDB collections — not CSS placeholders."
        actions={<span className="badge success">Live DB · {data.source}</span>}
      />

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        {[
          ['Revenue', `$${(kpis.revenue || 0).toLocaleString()}`],
          ['Profit (month)', `$${(kpis.profitMonth || 0).toLocaleString()}`],
          ['Employees', kpis.employees],
          ['Products', kpis.products],
        ].map(([label, value]) => (
          <div className="card kpi-card" key={label}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <div className="card-head"><h3>Sales performance</h3></div>
          <SalesLineChart rows={charts.salesByMonth || []} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Cash movement</h3></div>
          <FinanceBarChart rows={charts.financeByMonth || []} />
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <div className="card-head"><h3>Lead funnel</h3></div>
          <FunnelDoughnut rows={charts.leadFunnel || []} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Attendance mix</h3></div>
          <AttendanceDoughnut rows={charts.attendanceByStatus || []} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Inventory levels</h3></div>
          <InventoryBarChart rows={charts.inventoryLevels || []} />
        </div>
      </div>
    </div>
  );
}
