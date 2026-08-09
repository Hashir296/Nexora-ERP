import { useEffect, useState } from 'react';
import { PageHeader, LoadingBlock } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SecurityPage() {
  const [security, setSecurity] = useState(null);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]);

  const load = async () => {
    const [s, h, sess] = await Promise.all([
      api.get('/auth/security'),
      api.get('/auth/login-history'),
      api.get('/auth/sessions'),
    ]);
    setSecurity(s.data.data);
    setHistory(h.data.data.history || []);
    setSessions(sess.data.data.sessions || []);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const toggle2fa = async (enabled) => {
    await api.post('/auth/2fa', { enabled });
    toast.success(enabled ? '2FA enabled' : '2FA disabled');
    load();
  };

  const revoke = async (id) => {
    await api.delete(`/auth/sessions/${id}`);
    toast.success('Session revoked');
    load();
  };

  const enrollFace = async () => {
    const descriptor = Array.from({ length: 32 }, () => Math.random());
    await api.post('/auth/enroll/face', { descriptor });
    toast.success('Face enrolled (demo descriptor)');
    load();
  };

  const enrollFingerprint = async () => {
    await api.post('/auth/enroll/fingerprint', { fingerprintHash: 'demo-fingerprint-hash' });
    toast.success('Fingerprint enrolled');
    load();
  };

  if (!security) return <LoadingBlock />;

  return (
    <div>
      <PageHeader title="Security Center" subtitle="2FA, devices, login history, face & fingerprint enrollment." />
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <div className="kpi-label">Two-factor</div>
          <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{security.twoFactorEnabled ? 'On' : 'Off'}</div>
          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => toggle2fa(!security.twoFactorEnabled)}>
            {security.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
        <div className="card">
          <div className="kpi-label">Devices</div>
          <div className="kpi-value">{security.devices}</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={enrollFace}>Enroll face</button>
        </div>
        <div className="card">
          <div className="kpi-label">Biometrics</div>
          <div>Face: {security.hasFaceLogin ? 'Yes' : 'No'}</div>
          <div>Fingerprint: {security.hasFingerprint ? 'Yes' : 'No'}</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={enrollFingerprint}>Enroll fingerprint</button>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="card table-wrap">
          <h3>Active sessions</h3>
          <table>
            <thead><tr><th>Device</th><th>IP</th><th></th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.ip}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => revoke(s.id)}>Revoke</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card table-wrap">
          <h3>Login history</h3>
          <table>
            <thead><tr><th>When</th><th>IP</th><th>Result</th></tr></thead>
            <tbody>
              {history.slice(0, 12).map((h, idx) => (
                <tr key={idx}>
                  <td>{new Date(h.at).toLocaleString()}</td>
                  <td>{h.ip}</td>
                  <td>{h.success ? 'OK' : 'Failed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
