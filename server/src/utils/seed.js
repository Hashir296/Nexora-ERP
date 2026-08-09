require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const { Company, Branch, Department, Designation, Team } = require('../models/Organization');
const { Employee, LeaveBalance, Shift, Attendance, Payroll } = require('../models/HR');
const { JobPosting, Candidate } = require('../models/Recruitment');
const { Lead, Customer, CrmActivity } = require('../models/CRM');
const { Quotation, Invoice, Order, Payment } = require('../models/Sales');
const { Warehouse, Product, Stock } = require('../models/Inventory');
const { Account, Transaction, Budget } = require('../models/Finance');
const { Project, Sprint, Task } = require('../models/Project');
const { Ticket, Notification, Announcement, Setting } = require('../models/Platform');
const { scoreLead } = require('../services/aiService');

async function seed() {
  await connectDB();
  console.log('Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Branch.deleteMany({}),
    Department.deleteMany({}),
    Designation.deleteMany({}),
    Team.deleteMany({}),
    Employee.deleteMany({}),
    LeaveBalance.deleteMany({}),
    Shift.deleteMany({}),
    Attendance.deleteMany({}),
    Payroll.deleteMany({}),
    JobPosting.deleteMany({}),
    Candidate.deleteMany({}),
    Lead.deleteMany({}),
    Customer.deleteMany({}),
    CrmActivity.deleteMany({}),
    Quotation.deleteMany({}),
    Invoice.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Warehouse.deleteMany({}),
    Product.deleteMany({}),
    Stock.deleteMany({}),
    Account.deleteMany({}),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
    Project.deleteMany({}),
    Sprint.deleteMany({}),
    Task.deleteMany({}),
    Ticket.deleteMany({}),
    Notification.deleteMany({}),
    Announcement.deleteMany({}),
    Setting.deleteMany({}),
  ]);

  const company = await Company.create({
    name: 'Nexora ERP',
    legalName: 'Nexora Technologies Pvt Ltd',
    code: 'NEXORA',
    email: 'hello@nexora.local',
    phone: '+1-555-0100',
    currency: 'USD',
    address: { city: 'Austin', state: 'TX', country: 'USA' },
  });

  const branch = await Branch.create({
    company: company._id,
    name: 'HQ Austin',
    code: 'HQ',
    address: { city: 'Austin', country: 'USA' },
  });

  const deptEng = await Department.create({ company: company._id, name: 'Engineering', code: 'ENG' });
  const deptSales = await Department.create({ company: company._id, name: 'Sales', code: 'SAL' });
  const desigMgr = await Designation.create({ company: company._id, title: 'Manager', level: 3 });
  const desigDev = await Designation.create({ company: company._id, title: 'Software Engineer', level: 2 });

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@nexora.local',
    password: 'Admin@123',
    role: 'admin',
    company: company._id,
    branch: branch._id,
    isEmailVerified: true,
  });

  const managerUser = await User.create({
    name: 'Sara Manager',
    email: 'manager@nexora.local',
    password: 'Manager@123',
    role: 'manager',
    company: company._id,
    isEmailVerified: true,
  });

  const empUser = await User.create({
    name: 'Ali Employee',
    email: 'employee@nexora.local',
    password: 'Employee@123',
    role: 'employee',
    company: company._id,
    isEmailVerified: true,
  });

  const adminEmp = await Employee.create({
    user: admin._id,
    company: company._id,
    branch: branch._id,
    department: deptEng._id,
    designation: desigMgr._id,
    employeeCode: 'EMP-001',
    firstName: 'Admin',
    lastName: 'User',
    email: admin.email,
    salary: { basic: 9000, allowances: 1000 },
    skills: ['Leadership', 'ERP', 'Finance'],
  });
  admin.employee = adminEmp._id;
  await admin.save();

  const managerEmp = await Employee.create({
    user: managerUser._id,
    company: company._id,
    branch: branch._id,
    department: deptSales._id,
    designation: desigMgr._id,
    employeeCode: 'EMP-002',
    firstName: 'Sara',
    lastName: 'Manager',
    email: managerUser.email,
    salary: { basic: 7000, allowances: 800 },
    skills: ['Sales', 'CRM'],
  });
  managerUser.employee = managerEmp._id;
  await managerUser.save();

  const employee = await Employee.create({
    user: empUser._id,
    company: company._id,
    branch: branch._id,
    department: deptEng._id,
    designation: desigDev._id,
    manager: managerEmp._id,
    employeeCode: 'EMP-003',
    firstName: 'Ali',
    lastName: 'Employee',
    email: empUser.email,
    salary: { basic: 4500, allowances: 400 },
    skills: ['React', 'Node', 'MongoDB'],
  });
  empUser.employee = employee._id;
  await empUser.save();

  await Team.create({
    company: company._id,
    name: 'Platform Team',
    lead: managerUser._id,
    members: [admin._id, empUser._id],
    department: deptEng._id,
  });

  const year = new Date().getFullYear();
  await LeaveBalance.insertMany([
    { employee: adminEmp._id, company: company._id, year, annual: 24, sick: 10, casual: 6 },
    { employee: managerEmp._id, company: company._id, year, annual: 20, sick: 10, casual: 5 },
    { employee: employee._id, company: company._id, year, annual: 18, sick: 10, casual: 5, usedAnnual: 2 },
  ]);

  const shift = await Shift.create({
    company: company._id,
    name: 'General',
    startTime: '09:00',
    endTime: '18:00',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await Attendance.create({
    employee: employee._id,
    company: company._id,
    date: today,
    checkIn: new Date(),
    method: 'manual',
    status: 'present',
    shift: shift._id,
  });

  await Payroll.create({
    employee: employee._id,
    company: company._id,
    month: today.getMonth() + 1,
    year,
    basic: 4500,
    allowances: 400,
    bonus: 200,
    tax: 490,
    deductions: 50,
    netPay: 4560,
    status: 'paid',
  });

  const job = await JobPosting.create({
    company: company._id,
    title: 'Full Stack Engineer',
    department: deptEng._id,
    location: 'Austin / Remote',
    description: 'Build ERP modules on MERN stack.',
    requirements: ['React', 'Node', 'MongoDB', 'REST'],
    status: 'open',
    publishedAt: new Date(),
    salaryRange: { min: 70000, max: 110000 },
  });

  await Candidate.create({
    company: company._id,
    job: job._id,
    name: 'Jamie Candidate',
    email: 'jamie@example.com',
    resumeText: 'Experienced with React Node MongoDB REST APIs and ERP systems.',
    stage: 'applied',
    aiScore: 80,
  });

  const lead = await Lead.create({
    company: company._id,
    name: 'Acme Manufacturing',
    email: 'ops@acme.example',
    phone: '+1-555-2222',
    source: 'referral',
    status: 'qualified',
    value: 25000,
    owner: managerUser._id,
  });
  lead.aiScore = scoreLead(lead);
  await lead.save();

  const customer = await Customer.create({
    company: company._id,
    name: 'Bright Retail Co',
    email: 'buy@bright.example',
    type: 'business',
    owner: managerUser._id,
  });

  await CrmActivity.create({
    company: company._id,
    type: 'meeting',
    subject: 'Discovery call',
    relatedTo: { model: 'Lead', id: lead._id },
    scheduledAt: new Date(),
    owner: managerUser._id,
    status: 'planned',
  });

  const warehouse = await Warehouse.create({
    company: company._id,
    name: 'Main Warehouse',
    code: 'WH-1',
  });

  const product = await Product.create({
    company: company._id,
    name: 'ERP License Seat',
    sku: 'ERP-SEAT',
    barcode: '8901001',
    price: 99,
    cost: 20,
    lowStockThreshold: 25,
    category: 'Software',
  });

  await Stock.create({
    company: company._id,
    product: product._id,
    warehouse: warehouse._id,
    quantity: 40,
  });

  const order = await Order.create({
    company: company._id,
    customer: customer._id,
    number: 'ORD-1001',
    items: [{ product: product._id, name: product.name, qty: 10, price: 99, tax: 50 }],
    subtotal: 990,
    taxTotal: 50,
    total: 1040,
    status: 'completed',
  });

  const invoice = await Invoice.create({
    company: company._id,
    customer: customer._id,
    order: order._id,
    number: 'INV-1001',
    items: order.items,
    subtotal: 990,
    taxTotal: 50,
    total: 1040,
    paid: 1040,
    status: 'paid',
  });

  await Payment.create({
    company: company._id,
    invoice: invoice._id,
    amount: 1040,
    method: 'bank',
    status: 'completed',
  });

  await Quotation.create({
    company: company._id,
    customer: customer._id,
    number: 'QT-1001',
    items: [{ name: 'Implementation', qty: 1, price: 5000 }],
    subtotal: 5000,
    total: 5000,
    status: 'sent',
  });

  await Account.insertMany([
    { company: company._id, name: 'Cash', code: '1000', type: 'asset', balance: 50000 },
    { company: company._id, name: 'Revenue', code: '4000', type: 'income', balance: 25000 },
    { company: company._id, name: 'Operating Expenses', code: '5000', type: 'expense', balance: 8000 },
  ]);

  await Transaction.insertMany([
    { company: company._id, type: 'income', category: 'Sales', amount: 1040, description: 'INV-1001', createdBy: admin._id },
    { company: company._id, type: 'expense', category: 'Payroll', amount: 4560, description: 'March payroll', createdBy: admin._id },
    { company: company._id, type: 'income', category: 'Services', amount: 3200, description: 'Consulting', createdBy: admin._id },
  ]);

  await Budget.create({
    company: company._id,
    name: 'Q3 Ops',
    year,
    category: 'Operations',
    amount: 20000,
    spent: 4560,
  });

  const project = await Project.create({
    company: company._id,
    name: 'ERP Rollout',
    method: 'kanban',
    status: 'active',
    owner: admin._id,
    members: [admin._id, managerUser._id, empUser._id],
  });

  const sprint = await Sprint.create({
    project: project._id,
    name: 'Sprint 1',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 86400000),
  });

  await Task.insertMany([
    { project: project._id, sprint: sprint._id, title: 'Design auth flows', status: 'done', priority: 'high', assignees: [empUser._id], order: 1 },
    { project: project._id, sprint: sprint._id, title: 'Build HR attendance', status: 'in-progress', priority: 'high', assignees: [empUser._id], order: 2 },
    { project: project._id, sprint: sprint._id, title: 'AI assistant polish', status: 'todo', priority: 'medium', assignees: [admin._id], order: 3 },
  ]);

  await Ticket.create({
    company: company._id,
    subject: 'Cannot download payslip',
    description: 'Employee portal PDF button fails',
    priority: 'medium',
    requester: empUser._id,
    assignee: admin._id,
    status: 'open',
  });

  await Announcement.create({
    company: company._id,
    title: 'Welcome to Nexora ERP',
    body: 'Core platform is live. Enable only the plugins your industry needs.',
    createdBy: admin._id,
    pinned: true,
  });

  await Notification.create({
    company: company._id,
    user: admin._id,
    title: 'Seed complete',
    body: 'Demo data loaded. Login with admin@nexora.local / Admin@123',
    channel: 'in-app',
  });

  await Setting.create({
    company: company._id,
    key: 'theme',
    value: { mode: 'light', primary: '#0F766E' },
  });

  console.log('Seed complete.');
  console.log('Login: admin@nexora.local / Admin@123');
  console.log('Also: manager@nexora.local / Manager@123 , employee@nexora.local / Employee@123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
