import { useEffect, useState } from 'react';
import CrudModule from '../components/CrudModule';
import { PageHeader } from '../components/ui';
import api from '../services/api';

export default function FinancePage() {
  const [tab, setTab] = useState('transactions');
  const [pnl, setPnl] = useState(null);
  const [cashflow, setCashflow] = useState([]);
  const [sheet, setSheet] = useState(null);

  useEffect(() => {
    api.get('/finance/reports/pnl').then((res) => setPnl(res.data.data));
    api.get('/finance/reports/cashflow').then((res) => setCashflow(res.data.data.months || []));
    api.get('/finance/reports/balance-sheet').then((res) => setSheet(res.data.data));
  }, []);

  return (
    <div>
      <PageHeader title="Finance" subtitle="Accounts, cash flow, budgets, P&L, and balance sheet." />
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <div className="card"><div className="kpi-label">Income</div><div className="kpi-value">${pnl?.income || 0}</div></div>
        <div className="card"><div className="kpi-label">Expense</div><div className="kpi-value">${pnl?.expense || 0}</div></div>
        <div className="card"><div className="kpi-label">Profit</div><div className="kpi-value">${pnl?.profit || 0}</div></div>
      </div>
      <div className="tabs">
        {['transactions', 'accounts', 'budgets', 'reports'].map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'transactions' && (
        <CrudModule
          hideHeader
          title="Transactions"
          endpoint="/finance/transactions"
          columns={['Type', 'Category', 'Amount', 'Description']}
          fields={[
            { name: 'type', label: 'Type', type: 'select', defaultValue: 'expense', options: [
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]},
            { name: 'category', label: 'Category', required: true },
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'description', label: 'Description' },
          ]}
          mapRow={(i) => [i.type, i.category, i.amount, i.description]}
        />
      )}
      {tab === 'accounts' && (
        <CrudModule
          hideHeader
          title="Accounts"
          endpoint="/finance/accounts"
          columns={['Name', 'Code', 'Type', 'Balance']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'code', label: 'Code' },
            { name: 'type', label: 'Type', type: 'select', defaultValue: 'asset', options: [
              { value: 'asset', label: 'Asset' },
              { value: 'liability', label: 'Liability' },
              { value: 'equity', label: 'Equity' },
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]},
            { name: 'balance', label: 'Balance', type: 'number' },
          ]}
          mapRow={(i) => [i.name, i.code, i.type, i.balance]}
        />
      )}
      {tab === 'budgets' && (
        <CrudModule
          hideHeader
          title="Budgets"
          endpoint="/finance/budgets"
          columns={['Name', 'Year', 'Amount', 'Spent']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'year', label: 'Year', type: 'number', required: true },
            { name: 'category', label: 'Category' },
            { name: 'amount', label: 'Amount', type: 'number', required: true },
          ]}
          mapRow={(i) => [i.name, i.year, i.amount, i.spent]}
        />
      )}
      {tab === 'reports' && (
        <div className="grid grid-2">
          <div className="card">
            <h3>Cash flow</h3>
            <table>
              <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr></thead>
              <tbody>
                {cashflow.map((m) => (
                  <tr key={m.month}><td>{m.month}</td><td>{m.income}</td><td>{m.expense}</td><td>{m.net}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3>Balance sheet</h3>
            <table>
              <tbody>
                <tr><td>Assets</td><td>{sheet?.assets}</td></tr>
                <tr><td>Liabilities</td><td>{sheet?.liabilities}</td></tr>
                <tr><td>Equity</td><td>{sheet?.equity}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
