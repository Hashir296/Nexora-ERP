import CrudModule from '../components/CrudModule';
import { PageHeader, StatusBadge } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function HelpdeskPage() {
  const aiReply = async (id) => {
    try {
      await api.post(`/platform/tickets/${id}/reply`, { aiAuto: true, status: 'in-progress' });
      toast.success('AI auto-reply sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <PageHeader title="Help Desk" subtitle="Tickets, complaints, priority, SLA, and AI auto-reply." />
      <CrudModule
        title="Tickets"
        endpoint="/platform/tickets"
        columns={['Subject', 'Priority', 'Status', 'AI']}
        fields={[
          { name: 'subject', label: 'Subject', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'type', label: 'Type', type: 'select', defaultValue: 'ticket', options: [
            { value: 'ticket', label: 'Ticket' },
            { value: 'complaint', label: 'Complaint' },
          ]},
          { name: 'priority', label: 'Priority', type: 'select', defaultValue: 'medium', options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]},
        ]}
        mapRow={(i) => [
          i.subject,
          <StatusBadge value={i.priority} />,
          <StatusBadge value={i.status} />,
          <button key="ai" className="btn btn-ghost btn-sm" onClick={() => aiReply(i._id)}>AI reply</button>,
        ]}
      />
    </div>
  );
}
