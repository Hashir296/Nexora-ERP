const registry = require('./registry');

function registerCorePlugins() {
  if (registry.list().length) return;

  registry.register({
    id: 'organization',
    name: 'Organization',
    description: 'Companies, branches, departments, teams, hierarchy',
    loadRoutes: () => require('../routes/organization.routes'),
    nav: [{ label: 'Organization', path: '/app/organization', icon: 'Building2' }],
    permissions: ['org.read', 'org.write'],
  });

  registry.register({
    id: 'hr',
    name: 'Human Resources',
    description: 'Employees, attendance, leave, payroll',
    loadRoutes: () => require('../routes/hr.routes'),
    nav: [{ label: 'HR', path: '/app/hr', icon: 'Users' }],
    permissions: ['hr.read', 'hr.write'],
  });

  registry.register({
    id: 'recruitment',
    name: 'Recruitment',
    description: 'Jobs, candidates, AI screening, offers',
    loadRoutes: () => require('../routes/recruitment.routes'),
    nav: [{ label: 'Recruitment', path: '/app/recruitment', icon: 'Briefcase' }],
    permissions: ['recruitment.read', 'recruitment.write'],
  });

  registry.register({
    id: 'crm',
    name: 'CRM',
    description: 'Leads, customers, activities, funnel',
    loadRoutes: () => require('../routes/crm.routes'),
    nav: [{ label: 'CRM', path: '/app/crm', icon: 'Contact' }],
    permissions: ['crm.read', 'crm.write'],
  });

  registry.register({
    id: 'sales',
    name: 'Sales',
    description: 'Quotations, invoices, orders, POS, payments',
    loadRoutes: () => require('../routes/sales.routes'),
    nav: [{ label: 'Sales', path: '/app/sales', icon: 'ShoppingCart' }],
    permissions: ['sales.read', 'sales.write'],
  });

  registry.register({
    id: 'inventory',
    name: 'Inventory',
    description: 'Warehouses, stock, transfers, adjustments',
    loadRoutes: () => require('../routes/inventory.routes'),
    nav: [{ label: 'Inventory', path: '/app/inventory', icon: 'Package' }],
    permissions: ['inventory.read', 'inventory.write'],
  });

  registry.register({
    id: 'finance',
    name: 'Finance',
    description: 'Accounts, journals, expenses, budgets',
    loadRoutes: () => require('../routes/finance.routes'),
    nav: [{ label: 'Finance', path: '/app/finance', icon: 'Wallet' }],
    permissions: ['finance.read', 'finance.write'],
  });

  registry.register({
    id: 'projects',
    name: 'Projects',
    description: 'Projects, tasks, timesheets',
    loadRoutes: () => require('../routes/project.routes'),
    nav: [{ label: 'Projects', path: '/app/projects', icon: 'FolderKanban' }],
    permissions: ['projects.read', 'projects.write'],
  });

  const loadPlatform = () => require('../routes/platform.routes');

  registry.register({
    id: 'platform',
    name: 'Platform Services',
    description: 'Documents, helpdesk, chat, notifications, admin',
    loadRoutes: () => loadPlatform().platformRoutes(),
    nav: [
      { label: 'Documents', path: '/app/documents', icon: 'FileText' },
      { label: 'Help Desk', path: '/app/helpdesk', icon: 'LifeBuoy' },
      { label: 'Chat', path: '/app/chat', icon: 'MessageSquare' },
      { label: 'Admin', path: '/app/admin', icon: 'Shield' },
    ],
    permissions: ['platform.read', 'platform.write'],
  });

  registry.register({
    id: 'ai',
    name: 'AI Assistant',
    description: 'Natural language ERP assistant powered by live data',
    loadRoutes: () => loadPlatform().aiRoutes(),
    nav: [{ label: 'AI Assistant', path: '/app/ai', icon: 'Bot' }],
    permissions: ['ai.ask'],
  });

  registry.register({
    id: 'analytics',
    name: 'Analytics',
    description: 'KPIs, charts, predictions',
    loadRoutes: () => loadPlatform().analyticsRoutes(),
    nav: [{ label: 'Analytics', path: '/app/analytics', icon: 'BarChart3' }],
    permissions: ['analytics.read'],
  });
}

module.exports = { registerCorePlugins };
