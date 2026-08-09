import { useEffect, useState } from 'react';
import CrudModule from '../components/CrudModule';
import { PageHeader, StatusBadge } from '../components/ui';
import api from '../services/api';

export default function CrmPage() {
  const [tab, setTab] = useState('leads');
  const [funnel, setFunnel] = useState([]);

  useEffect(() => {
    api.get('/crm/funnel').then((res) => setFunnel(res.data.data.funnel || []));
  }, []);

  return (
    <div>
      <PageHeader title="CRM" subtitle="Leads, customers, activities, and AI lead scoring." />
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        {funnel.map((f) => (
          <div className="card" key={f.status}>
            <div className="kpi-label">{f.status}</div>
            <div className="kpi-value">{f.count}</div>
            <div className="kpi-label">Value ${f.value}</div>
          </div>
        ))}
      </div>
      <div className="tabs">
        {['leads', 'customers', 'activities'].map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'leads' && (
        <CrudModule
          hideHeader
          title="Leads"
          endpoint="/crm/leads"
          columns={['Name', 'Email', 'Status', 'AI Score', 'Value']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'email', label: 'Email' },
            { name: 'phone', label: 'Phone' },
            { name: 'source', label: 'Source', defaultValue: 'website' },
            { name: 'value', label: 'Value', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', defaultValue: 'new', options: [
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'proposal', label: 'Proposal' },
              { value: 'won', label: 'Won' },
              { value: 'lost', label: 'Lost' },
            ]},
          ]}
          mapRow={(i) => [i.name, i.email, <StatusBadge value={i.status} />, i.aiScore, i.value]}
        />
      )}
      {tab === 'customers' && (
        <CrudModule
          hideHeader
          title="Customers"
          endpoint="/crm/customers"
          columns={['Name', 'Email', 'Type']}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'email', label: 'Email' },
            { name: 'phone', label: 'Phone' },
            { name: 'type', label: 'Type', type: 'select', defaultValue: 'business', options: [
              { value: 'business', label: 'Business' },
              { value: 'individual', label: 'Individual' },
            ]},
          ]}
          mapRow={(i) => [i.name, i.email, i.type]}
        />
      )}
      {tab === 'activities' && (
        <CrudModule
          hideHeader
          title="Activities"
          endpoint="/crm/activities"
          columns={['Type', 'Subject', 'Status']}
          fields={[
            { name: 'type', label: 'Type', type: 'select', defaultValue: 'call', options: [
              { value: 'meeting', label: 'Meeting' },
              { value: 'call', label: 'Call' },
              { value: 'email', label: 'Email' },
              { value: 'whatsapp', label: 'WhatsApp' },
            ]},
            { name: 'subject', label: 'Subject', required: true },
            { name: 'body', label: 'Notes', type: 'textarea' },
          ]}
          mapRow={(i) => [i.type, i.subject, <StatusBadge value={i.status} />]}
        />
      )}
    </div>
  );
}
