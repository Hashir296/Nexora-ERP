import { useState } from 'react';
import CrudModule from '../components/CrudModule';
import { PageHeader, StatusBadge } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SalesPage() {
  const [tab, setTab] = useState('invoices');

  const posSale = async () => {
    try {
      const { data } = await api.post('/sales/orders/pos', {
        items: [{ name: 'POS Item', qty: 1, price: 50, tax: 5 }],
      });
      toast.success(`POS ${data.data.item.number} completed`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'POS failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Quotations, invoices, orders, payments, and POS."
        actions={<button className="btn" onClick={posSale}>Quick POS sale</button>}
      />
      <div className="tabs">
        {['quotations', 'invoices', 'orders', 'payments'].map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'quotations' && (
        <CrudModule
          hideHeader
          title="Quotations"
          endpoint="/sales/quotations"
          columns={['Number', 'Total', 'Status']}
          fields={[
            { name: 'number', label: 'Number', required: true },
            { name: 'total', label: 'Total', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', defaultValue: 'draft', options: [
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' },
            ]},
          ]}
          mapRow={(i) => [i.number, i.total, <StatusBadge value={i.status} />]}
        />
      )}
      {tab === 'invoices' && (
        <CrudModule
          hideHeader
          title="Invoices"
          endpoint="/sales/invoices"
          columns={['Number', 'Total', 'Paid', 'Status']}
          fields={[
            { name: 'number', label: 'Number', required: true },
            { name: 'total', label: 'Total', type: 'number' },
            { name: 'paid', label: 'Paid', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', defaultValue: 'draft', options: [
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'paid', label: 'Paid' },
              { value: 'partial', label: 'Partial' },
              { value: 'overdue', label: 'Overdue' },
            ]},
          ]}
          mapRow={(i) => [i.number, i.total, i.paid, <StatusBadge value={i.status} />]}
        />
      )}
      {tab === 'orders' && (
        <CrudModule
          hideHeader
          title="Orders"
          endpoint="/sales/orders"
          columns={['Number', 'Channel', 'Total', 'Status']}
          fields={[
            { name: 'number', label: 'Number', required: true },
            { name: 'channel', label: 'Channel', type: 'select', defaultValue: 'sales', options: [
              { value: 'sales', label: 'Sales' },
              { value: 'pos', label: 'POS' },
              { value: 'online', label: 'Online' },
            ]},
            { name: 'total', label: 'Total', type: 'number' },
          ]}
          mapRow={(i) => [i.number, i.channel, i.total, <StatusBadge value={i.status} />]}
        />
      )}
      {tab === 'payments' && (
        <CrudModule
          hideHeader
          title="Payments"
          endpoint="/sales/payments"
          columns={['Amount', 'Method', 'Status']}
          fields={[
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'method', label: 'Method', type: 'select', defaultValue: 'cash', options: [
              { value: 'cash', label: 'Cash' },
              { value: 'card', label: 'Card' },
              { value: 'bank', label: 'Bank' },
              { value: 'wallet', label: 'Wallet' },
            ]},
          ]}
          mapRow={(i) => [i.amount, i.method, <StatusBadge value={i.status} />]}
        />
      )}
    </div>
  );
}
