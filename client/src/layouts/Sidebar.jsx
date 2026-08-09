import { NavLink } from 'react-router-dom';
import { Icon } from '../components/Icon';

const NAV = [
  { section: 'Core', items: [
    { to: '/app', label: 'Dashboard', icon: 'home', end: true },
    { to: '/app/ai', label: 'AI Assistant', icon: 'bot' },
    { to: '/app/analytics', label: 'Analytics', icon: 'chart' },
  ]},
  { section: 'Business', items: [
    { to: '/app/organization', label: 'Organization', icon: 'building' },
    { to: '/app/hr', label: 'HR', icon: 'users' },
    { to: '/app/recruitment', label: 'Recruitment', icon: 'briefcase' },
    { to: '/app/crm', label: 'CRM', icon: 'contact' },
    { to: '/app/sales', label: 'Sales', icon: 'cart' },
    { to: '/app/inventory', label: 'Inventory', icon: 'package' },
    { to: '/app/finance', label: 'Finance', icon: 'wallet' },
  ]},
  { section: 'Workspace', items: [
    { to: '/app/projects', label: 'Projects', icon: 'kanban' },
    { to: '/app/documents', label: 'Documents', icon: 'file' },
    { to: '/app/helpdesk', label: 'Help Desk', icon: 'life' },
    { to: '/app/chat', label: 'Chat', icon: 'chat' },
    { to: '/app/notifications', label: 'Notifications', icon: 'bell' },
    { to: '/app/security', label: 'Security Center', icon: 'lock' },
    { to: '/app/admin', label: 'Admin', icon: 'shield' },
  ]},
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">NX</div>
        <div>
          <h1>Nexora</h1>
          <p>Enterprise ERP</p>
        </div>
      </div>
      {NAV.map((group) => (
        <div key={group.section}>
          <div className="nav-section">{group.section}</div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
