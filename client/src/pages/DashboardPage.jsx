import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PageHeader, LoadingBlock } from '../components/ui';
import { SalesLineChart, FinanceBarChart, FunnelDoughnut } from '../components/Charts';

function money(n) {
  return `$${Number(n || 0).toLocaleString()}`;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/analytics/overview')
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  const k = data?.kpis || {};
  const charts = data?.charts || {};

  return (
    <div>
      <PageHeader
        title="Executive dashboard"
        subtitle="Live MongoDB metrics — sales, finance, CRM funnel, and workforce."
        actions={(
          <>
            <span className="badge success">Source: {data?.source || 'mongodb'}</span>
            <button className="btn" onClick={() => navigate('/app/ai')}>Ask Nexora AI</button>
          </>
        )}
      />

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        {[
          ['Active employees', k.employees, 'People currently active'],
          ['Invoice revenue', money(k.revenue), `Paid ${money(k.paid)}`],
          ['Orders', k.orders, 'All channels'],
          ['Pipeline leads', k.leads, 'CRM open pipeline'],
          ['Month income', money(k.incomeMonth), 'Finance ledger'],
          ['Month expenses', money(k.expenseMonth), 'Finance ledger'],
          ['Month profit', money(k.profitMonth), 'Income − expense'],
          ['Attendance', k.attendancePresent, 'Present this month'],
        ].map(([label, value, hint]) => (
          <div className="card kpi-card" key={label}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value ?? 0}</div>
            <div className="kpi-hint">{hint}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <div className="card-head">
            <h3>Sales trend (6 months)</h3>
            <span className="badge info">Orders collection</span>
          </div>
          <SalesLineChart rows={charts.salesByMonth || []} />
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Income vs expense</h3>
            <span className="badge info">Transactions</span>
          </div>
          <FinanceBarChart rows={charts.financeByMonth || []} />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h3>CRM funnel</h3>
            <span className="badge info">Leads by status</span>
          </div>
          <FunnelDoughnut rows={charts.leadFunnel || []} />
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Quick actions</h3>
          </div>
          <div className="action-grid">
            {[
              ['HR attendance', '/app/hr', 'Check-in / leave / payroll'],
              ['CRM leads', '/app/crm', 'Score & convert pipeline'],
              ['Create invoice', '/app/sales', 'Quotations & payments'],
              ['Stock alerts', '/app/inventory', 'Low stock & demand'],
              ['Finance P&L', '/app/finance', 'Cashflow & budgets'],
              ['Nexora AI', '/app/ai', 'Ask live ERP questions'],
            ].map(([label, path, desc]) => (
              <button key={path} className="action-tile" onClick={() => navigate(path)}>
                <strong>{label}</strong>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
