const registry = require('./registry');
const organizationRoutes = require('../routes/organization.routes');
const hrRoutes = require('../routes/hr.routes');
const recruitmentRoutes = require('../routes/recruitment.routes');
const crmRoutes = require('../routes/crm.routes');
const salesRoutes = require('../routes/sales.routes');
const inventoryRoutes = require('../routes/inventory.routes');
const financeRoutes = require('../routes/finance.routes');
const projectRoutes = require('../routes/project.routes');
const { platformRoutes, aiRoutes, analyticsRoutes } = require('../routes/platform.routes');

function registerCorePlugins() {
  registry.register({
    id: 'organization',
    name: 'Organization',
    description: 'Companies, branches, departments, teams, hierarchy',
    routes: organizationRoutes,
    nav: [{ label: 'Organization', path: '/app/organization', icon: 'Building2' }],
    permissions: ['org.read', 'org.write'],
  });

  registry.register({
    id: 'hr',
    name: 'Human Resources',
    description: 'Employees, attendance, leave, payroll',
    routes: hrRoutes,
    nav: [{ label: 'HR', path: '/app/hr', icon: 'Users' }],
    permissions: ['hr.read', 'hr.write'],
  });

  registry.register({
    id: 'recruitment',
    name: 'Recruitment',
    description: 'Jobs, candidates, AI screening, offers',
    routes: recruitmentRoutes,
    nav: [{ label: 'Recruitment', path: '/app/recruitment', icon: 'Briefcase' }],
    permissions: ['recruitment.read', 'recruitment.write'],
  });

  registry.register({
    id: 'crm',
    name: 'CRM',
    description: 'Leads, customers, activities, funnel',
    routes: crmRoutes,
    nav: [{ label: 'CRM', path: '/app/crm', icon: 'Contact' }],
    permissions: ['crm.read', 'crm.write'],
  });

  registry.register({
    id: 'sales',
    name: 'Sales',
    description: 'Quotations, invoices, orders, POS, payments',
    routes: salesRoutes,
    nav: [{ label: 'Sales', path: '/app/sales', icon: 'ShoppingCart' }],
    permissions: ['sales.read', 'sales.write'],
  });

  registry.register({
    id: 'inventory',
    name: 'Inventory',
    description: 'Warehouses, stock, barcodes, demand prediction',
    routes: inventoryRoutes,
    nav: [{ label: 'Inventory', path: '/app/inventory', icon: 'Package' }],
    permissions: ['inventory.read', 'inventory.write'],
  });

  registry.register({
    id: 'finance',
    name: 'Finance',
    description: 'Accounts, expenses, budgets, P&L, balance sheet',
    routes: financeRoutes,
    nav: [{ label: 'Finance', path: '/app/finance', icon: 'Wallet' }],
    permissions: ['finance.read', 'finance.write'],
  });

  registry.register({
    id: 'projects',
    name: 'Project Management',
    description: 'Kanban, scrum, sprints, time tracking',
    routes: projectRoutes,
    nav: [{ label: 'Projects', path: '/app/projects', icon: 'Kanban' }],
    permissions: ['projects.read', 'projects.write'],
  });

  registry.register({
    id: 'platform',
    name: 'Platform Services',
    description: 'Documents, helpdesk, chat, notifications, admin',
    routes: platformRoutes(),
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
    routes: aiRoutes(),
    nav: [{ label: 'AI Assistant', path: '/app/ai', icon: 'Bot' }],
    permissions: ['ai.ask'],
  });

  registry.register({
    id: 'analytics',
    name: 'Analytics',
    description: 'KPIs, charts, predictions',
    routes: analyticsRoutes(),
    nav: [{ label: 'Analytics', path: '/app/analytics', icon: 'BarChart3' }],
    permissions: ['analytics.read'],
  });

  return registry;
}

module.exports = { registerCorePlugins };
