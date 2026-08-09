import { useEffect, useState } from 'react';
import { PageHeader, EmptyState, LoadingBlock } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/platform/notifications/mine');
      setItems(data.data.items || []);
      setUnread(data.data.unread || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const readAll = async () => {
    await api.post('/platform/notifications/read-all');
    toast.success('Marked read');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Notification Center"
        subtitle={`In-app notifications · ${unread} unread. Email/SMS/WhatsApp channels are modeled for delivery adapters.`}
        actions={<button className="btn" onClick={readAll}>Mark all read</button>}
      />
      <div className="card">
        {loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No notifications" /> : (
          <table>
            <thead><tr><th>Title</th><th>Channel</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {items.map((n) => (
                <tr key={n._id}>
                  <td><strong>{n.title}</strong><div style={{ color: 'var(--text-muted)' }}>{n.body}</div></td>
                  <td>{n.channel}</td>
                  <td>{n.read ? 'Read' : 'Unread'}</td>
                  <td>{new Date(n.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
