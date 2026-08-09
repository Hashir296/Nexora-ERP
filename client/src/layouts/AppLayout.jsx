import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import { Icon } from '../components/Icon';
import { logout } from '../redux/authSlice';
import api from '../services/api';

const ROUTES = [
  { path: '/app', label: 'Dashboard' },
  { path: '/app/ai', label: 'AI Assistant' },
  { path: '/app/analytics', label: 'Analytics' },
  { path: '/app/organization', label: 'Organization' },
  { path: '/app/hr', label: 'HR' },
  { path: '/app/recruitment', label: 'Recruitment' },
  { path: '/app/crm', label: 'CRM' },
  { path: '/app/sales', label: 'Sales' },
  { path: '/app/inventory', label: 'Inventory' },
  { path: '/app/finance', label: 'Finance' },
  { path: '/app/projects', label: 'Projects' },
  { path: '/app/documents', label: 'Documents' },
  { path: '/app/helpdesk', label: 'Help Desk' },
  { path: '/app/chat', label: 'Chat' },
  { path: '/app/notifications', label: 'Notifications' },
  { path: '/app/security', label: 'Security' },
  { path: '/app/admin', label: 'Admin' },
];

export default function AppLayout() {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [q, setQ] = useState('');

  const crumb = useMemo(() => {
    const match = [...ROUTES].reverse().find((r) => location.pathname.startsWith(r.path));
    return match?.label || 'App';
  }, [location.pathname]);

  const filtered = ROUTES.filter((r) => r.label.toLowerCase().includes(q.toLowerCase()));

  const onLogout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken: localStorage.getItem('eps_refresh') });
    } catch {
      /* ignore */
    }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <div className="breadcrumb">Workspace / <strong>{crumb}</strong></div>
          <button className="search-btn" onClick={() => setPaletteOpen(true)}>
            <Icon name="search" size={16} />
            <span>Search modules…</span>
            <span style={{ marginLeft: 'auto', fontSize: 12 }}>Ctrl K</span>
          </button>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/notifications')}>
              <Icon name="bell" size={16} />
            </button>
            <div className="avatar">{(user?.name || 'U').slice(0, 1)}</div>
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>Logout</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>

      {paletteOpen ? (
        <div className="command-palette" onClick={() => setPaletteOpen(false)}>
          <div className="command-panel" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              placeholder="Go to module…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setPaletteOpen(false);
                if (e.key === 'Enter' && filtered[0]) {
                  navigate(filtered[0].path);
                  setPaletteOpen(false);
                }
              }}
            />
            <div className="command-list">
              {filtered.map((r) => (
                <button
                  key={r.path}
                  className="command-item"
                  onClick={() => {
                    navigate(r.path);
                    setPaletteOpen(false);
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function useCommandPaletteHotkey(setOpen) {
  return setOpen;
}
