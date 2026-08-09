import { useEffect, useState } from 'react';
import { PageHeader, LoadingBlock } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [plugins, setPlugins] = useState([]);
  const [db, setDb] = useState(null);
  const [audit, setAudit] = useState([]);
  const [keys, setKeys] = useState([]);
  const [theme, setTheme] = useState('light');

  const load = async () => {
    const [p, d, a, k, s] = await Promise.all([
      api.get('/platform/plugins'),
      api.get('/platform/db-monitor'),
      api.get('/platform/audit-logs'),
      api.get('/platform/api-keys'),
      api.get('/platform/settings'),
    ]);
    setPlugins(p.data.data.plugins || []);
    setDb(d.data.data);
    setAudit(a.data.data.items || []);
    setKeys(k.data.data.items || []);
    const themeSetting = (s.data.data.items || []).find((i) => i.key === 'theme');
    if (themeSetting?.value?.mode) setTheme(themeSetting.value.mode);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const togglePlugin = async (id, enabled) => {
    await api.post(`/platform/plugins/${id}/toggle`, { enabled });
    toast.success('Plugin updated (restart routes on next boot for full effect)');
    load();
  };

  const createKey = async () => {
    const { data } = await api.post('/platform/api-keys', { name: 'Integration key' });
    toast.success(`Key created: ${data.data.item.key}`);
    load();
  };

  const saveTheme = async () => {
    await api.put('/platform/settings/theme', { value: { mode: theme, primary: '#0F766E' } });
    toast.success('Theme saved');
  };

  if (!db) return <LoadingBlock />;

  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Plugins, roles surface, settings, audit logs, API keys, DB monitor." />
      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <h3>Database monitor</h3>
          <p>State: <strong>{db.state}</strong></p>
          <p>Host: {db.host}</p>
          <p>DB: {db.name}</p>
          <p>Models: {db.models?.length}</p>
        </div>
        <div className="card">
          <h3>Theme</h3>
          <label>
            Mode
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark (stored preference)</option>
            </select>
          </label>
          <button className="btn" style={{ marginTop: 8 }} onClick={saveTheme}>Save settings</button>
          <p style={{ color: 'var(--text-muted)' }}>UI ships in light enterprise theme by default.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Plugins (core platform)</h3>
        </div>
        <table>
          <thead><tr><th>Plugin</th><th>Version</th><th>Enabled</th><th></th></tr></thead>
          <tbody>
            {plugins.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong><div style={{ color: 'var(--text-muted)' }}>{p.description}</div></td>
                <td>{p.version}</td>
                <td>{p.enabled ? 'Yes' : 'No'}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => togglePlugin(p.id, !p.enabled)}>
                    {p.enabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>API keys</h3>
            <button className="btn btn-sm" onClick={createKey}>Create</button>
          </div>
          <table>
            <thead><tr><th>Name</th><th>Prefix</th></tr></thead>
            <tbody>
              {keys.map((k) => <tr key={k._id}><td>{k.name}</td><td>{k.prefix}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="card table-wrap">
          <h3>Audit logs</h3>
          <table>
            <thead><tr><th>Action</th><th>User</th><th>When</th></tr></thead>
            <tbody>
              {audit.slice(0, 15).map((a) => (
                <tr key={a._id}>
                  <td>{a.action}</td>
                  <td>{a.user?.name || '-'}</td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
