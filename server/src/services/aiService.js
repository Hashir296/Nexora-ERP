const https = require('https');
const config = require('../config');
const { Employee, LeaveBalance, Attendance } = require('../models/HR');
const { Lead } = require('../models/CRM');
const { Order } = require('../models/Sales');
const { Product, Stock } = require('../models/Inventory');
const { Transaction } = require('../models/Finance');
const { Task } = require('../models/Project');
const { Ticket } = require('../models/Platform');

const PREFERRED_MODELS = [
  process.env.GOOGLE_AI_MODEL,
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-001',
  'gemini-1.5-flash-8b',
].filter(Boolean);

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
  return { start, end };
}

async function resolveEmployee(user) {
  if (user.employee) return Employee.findById(user.employee);
  return Employee.findOne({ user: user._id, company: user.company });
}

async function buildErpContext(user) {
  const company = user.company;
  const year = new Date().getFullYear();
  const curr = monthRange(0);
  const prev = monthRange(-1);
  const emp = await resolveEmployee(user);

  const [
    empCount,
    topEmployees,
    leaveBal,
    leads,
    ordersCurr,
    ordersPrev,
    incomeCurr,
    expenseCurr,
    products,
    stocks,
    openTasks,
    openTickets,
    attendancePresent,
  ] = await Promise.all([
    Employee.countDocuments({ company, status: 'active' }),
    Employee.find({ company, status: 'active' })
      .sort({ 'salary.basic': -1 })
      .limit(5)
      .select('firstName lastName employeeCode salary status'),
    emp ? LeaveBalance.findOne({ employee: emp._id, year }) : null,
    Lead.find({ company }).sort({ aiScore: -1 }).limit(5).select('name status aiScore value'),
    Order.aggregate([
      { $match: { company, createdAt: { $gte: curr.start, $lte: curr.end }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { company, createdAt: { $gte: prev.start, $lte: prev.end }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { company, type: 'income', date: { $gte: curr.start, $lte: curr.end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { company, type: 'expense', date: { $gte: curr.start, $lte: curr.end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Product.find({ company, isActive: true }).limit(20).select('name sku price lowStockThreshold'),
    Stock.find({ company }).populate('product', 'name'),
    Task.countDocuments({ status: { $in: ['todo', 'in-progress', 'review'] } }),
    Ticket.countDocuments({ company, status: { $in: ['open', 'in-progress'] } }),
    Attendance.countDocuments({ company, date: { $gte: curr.start, $lte: curr.end }, status: 'present' }),
  ]);

  const qtyMap = {};
  stocks.forEach((s) => {
    const id = s.product?._id?.toString() || s.product?.toString();
    if (!id) return;
    qtyMap[id] = (qtyMap[id] || 0) + s.quantity;
  });

  const income = incomeCurr[0]?.total || 0;
  const expense = expenseCurr[0]?.total || 0;
  const salesThis = ordersCurr[0] || { total: 0, count: 0 };
  const salesLast = ordersPrev[0] || { total: 0, count: 0 };

  return {
    user: { name: user.name, role: user.role, email: user.email },
    employee: emp
      ? {
          name: `${emp.firstName} ${emp.lastName}`,
          code: emp.employeeCode,
          salaryBasic: emp.salary?.basic || 0,
          leave: leaveBal
            ? {
                annualLeft: leaveBal.annual - leaveBal.usedAnnual,
                sickLeft: leaveBal.sick - leaveBal.usedSick,
                casualLeft: leaveBal.casual - leaveBal.usedCasual,
              }
            : null,
        }
      : null,
    companyPulse: {
      activeEmployees: empCount,
      attendancePresentThisMonth: attendancePresent,
      openTasks,
      openTickets,
      incomeThisMonth: income,
      expenseThisMonth: expense,
      estimatedProfitThisMonth: income + (salesThis.total || 0) - expense,
      salesThisMonth: salesThis,
      salesLastMonth: salesLast,
    },
    topEmployeesBySalary: topEmployees.map((e) => ({
      name: `${e.firstName} ${e.lastName}`,
      code: e.employeeCode,
      basic: e.salary?.basic || 0,
    })),
    topLeads: leads.map((l) => ({
      name: l.name,
      status: l.status,
      aiScore: l.aiScore,
      value: l.value,
    })),
    lowStock: products
      .map((p) => ({
        name: p.name,
        qty: qtyMap[p._id.toString()] || 0,
        threshold: p.lowStockThreshold,
      }))
      .filter((p) => p.qty <= p.threshold),
    inventorySample: products.slice(0, 8).map((p) => ({
      name: p.name,
      qty: qtyMap[p._id.toString()] || 0,
      suggestedReorder: Math.max(
        p.lowStockThreshold * 2,
        Math.ceil((qtyMap[p._id.toString()] || 0) * 1.25) || p.lowStockThreshold
      ),
    })),
  };
}

function httpRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      url,
      {
        method,
        headers: {
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
              }
            : {}),
          ...headers,
        },
        timeout: 45000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            json = { raw };
          }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini request timed out'));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function extractGeminiText(json) {
  const parts = json?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((p) => p.text || '')
    .join('\n')
    .trim();
}

function classifyGeminiError(message = '') {
  const m = String(message).toLowerCase();
  if (m.includes('quota') || m.includes('rate limit') || m.includes('resource_exhausted')) {
    return 'quota';
  }
  if (m.includes('not found') || m.includes('no longer available') || m.includes('not supported')) {
    return 'model';
  }
  if (m.includes('api key') || m.includes('permission') || m.includes('unauthenticated')) {
    return 'auth';
  }
  return 'unknown';
}

async function listUsableModels(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  try {
    const { status, json } = await httpRequest('GET', url);
    if (status < 200 || status >= 300) return [];
    return (json.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter(Boolean);
  } catch (err) {
    console.error('ListModels failed:', err.message);
    return [];
  }
}

async function callGeminiRest(model, prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.45,
      maxOutputTokens: 1024,
    },
  };

  const { status, json } = await httpRequest('POST', url, body);
  if (status >= 200 && status < 300) {
    const text = extractGeminiText(json);
    if (text) return { text, model };
    throw new Error(`Gemini returned empty content (${model})`);
  }

  const message = json?.error?.message || json?.raw || `Gemini HTTP ${status} for model ${model}`;
  const err = new Error(message);
  err.status = status;
  err.model = model;
  err.kind = classifyGeminiError(message);
  throw err;
}

async function askWithGemini(message, context) {
  const apiKey = config.googleApiKey;
  if (!apiKey) {
    return { ok: false, error: 'GOOGLE_API_KEY is missing in server/.env', kind: 'auth' };
  }

  const prompt = `You are Nexora, a professional enterprise ERP AI assistant.
Answer the user's question using ONLY the live ERP JSON context below for factual numbers.
Be specific and clear. Use short English bullet points when helpful.
If something is missing in the data, say exactly what is missing.
Do not invent employees, sales, or money amounts.

User: ${context.user.name} (${context.user.role})
Question: ${message}

LIVE ERP CONTEXT:
${JSON.stringify(context, null, 2)}`;

  const listed = await listUsableModels(apiKey);
  const models = [];
  const seen = new Set();
  for (const m of [...PREFERRED_MODELS, ...listed]) {
    if (!m || seen.has(m)) continue;
    if (listed.length && !listed.includes(m) && !PREFERRED_MODELS.includes(m)) continue;
    seen.add(m);
    models.push(m);
  }
  if (!models.length) models.push(...PREFERRED_MODELS);

  const errors = [];
  let kind = 'unknown';

  for (const model of models.slice(0, 8)) {
    try {
      const result = await callGeminiRest(model, prompt, apiKey);
      return {
        ok: true,
        answer: result.text,
        provider: 'google-gemini',
        model: result.model,
        data: context,
      };
    } catch (err) {
      kind = err.kind || classifyGeminiError(err.message);
      errors.push(`${model}: ${err.message}`);
      console.error('Gemini model failed:', model, err.message);
      // Quota usually applies across free-tier flash models — stop early.
      if (kind === 'quota') break;
    }
  }

  return {
    ok: false,
    error: errors[0] || 'All Gemini models failed',
    kind,
  };
}

function askSmartLocal(message, context) {
  const p = context.companyPulse;
  const leave = context.employee?.leave;
  const q = (message || '').toLowerCase();

  if (q.includes('leave')) {
    if (!leave) {
      return `I checked your profile, but no leave balance is linked yet.\n\nAsk HR to set up leave balances for ${context.user.name}.`;
    }
    return [
      `Here is your remaining leave balance, ${context.employee.name}:`,
      '',
      `• Annual leave: ${leave.annualLeft} days`,
      `• Sick leave: ${leave.sickLeft} days`,
      `• Casual leave: ${leave.casualLeft} days`,
      '',
      'These numbers are live from MongoDB leave balances.',
    ].join('\n');
  }

  if (q.includes('top') && q.includes('employee')) {
    const lines = context.topEmployeesBySalary.map(
      (e, i) => `${i + 1}. ${e.name} (${e.code}) — basic salary ${e.basic}`
    );
    return `Top employees by salary:\n\n${lines.join('\n') || 'No employees found.'}`;
  }

  if (q.includes('profit') || q.includes('income') || q.includes('expense')) {
    return [
      "This month's finance snapshot:",
      '',
      `• Income: ${p.incomeThisMonth}`,
      `• Expenses: ${p.expenseThisMonth}`,
      `• Estimated profit: ${p.estimatedProfitThisMonth}`,
      `• Sales included in estimate: ${p.salesThisMonth.total}`,
    ].join('\n');
  }

  if (q.includes('sales') || q.includes('compare')) {
    const diff = (p.salesThisMonth.total || 0) - (p.salesLastMonth.total || 0);
    const pct = p.salesLastMonth.total
      ? ((diff / p.salesLastMonth.total) * 100).toFixed(1)
      : 'n/a';
    return [
      'Sales comparison:',
      '',
      `• This month: ${p.salesThisMonth.total} (${p.salesThisMonth.count} orders)`,
      `• Last month: ${p.salesLastMonth.total} (${p.salesLastMonth.count} orders)`,
      `• Change: ${diff} (${pct}%)`,
    ].join('\n');
  }

  if (q.includes('stock') || q.includes('inventory') || q.includes('reorder')) {
    const low = context.lowStock.length
      ? context.lowStock.map((l) => `• ${l.name}: ${l.qty} (threshold ${l.threshold})`).join('\n')
      : '• No low-stock items right now';
    const reorder = context.inventorySample
      .map((i) => `• ${i.name}: current ${i.qty}, suggested reorder ${i.suggestedReorder}`)
      .join('\n');
    return `Low stock alerts:\n${low}\n\nReorder suggestions:\n${reorder || '• No products found'}`;
  }

  if (q.includes('summary') || q.includes('ceo')) {
    return [
      'CEO summary for this month:',
      '',
      `• Active employees: ${p.activeEmployees}`,
      `• Attendance (present): ${p.attendancePresentThisMonth}`,
      `• Sales: ${p.salesThisMonth.total} across ${p.salesThisMonth.count} orders`,
      `• Income: ${p.incomeThisMonth} | Expenses: ${p.expenseThisMonth}`,
      `• Estimated profit: ${p.estimatedProfitThisMonth}`,
      `• Open tasks: ${p.openTasks} | Open tickets: ${p.openTickets}`,
      `• Top lead: ${context.topLeads[0]?.name || 'n/a'} (score ${context.topLeads[0]?.aiScore ?? 'n/a'})`,
    ].join('\n');
  }

  return [
    `I can help with leave, employees, profit, sales comparison, inventory, and CEO summaries.`,
    '',
    `Live pulse: ${p.activeEmployees} employees, sales ${p.salesThisMonth.total}, profit ${p.estimatedProfitThisMonth}, open tasks ${p.openTasks}.`,
  ].join('\n');
}

function friendlyGeminiStatus(kind) {
  if (kind === 'quota') {
    return 'Google Gemini free-tier quota is exceeded. Enable billing or wait for reset. Showing live ERP answer meanwhile.';
  }
  if (kind === 'auth') {
    return 'Google API key is invalid or missing. Update GOOGLE_API_KEY in server/.env';
  }
  if (kind === 'model') {
    return 'Configured Gemini models are unavailable for this key. Showing live ERP answer meanwhile.';
  }
  return 'Google Gemini is temporarily unavailable. Showing live ERP answer meanwhile.';
}

async function askAi({ user, message }) {
  const context = await buildErpContext(user);
  const gemini = await askWithGemini(message, context);

  if (gemini.ok) {
    return {
      answer: gemini.answer,
      provider: 'google-gemini',
      model: gemini.model,
      data: context,
    };
  }

  return {
    answer: askSmartLocal(message, context),
    provider: 'nexora-data',
    model: null,
    warning: friendlyGeminiStatus(gemini.kind),
    geminiError: gemini.error,
    data: context,
  };
}

function scoreLead(lead) {
  let score = 20;
  if (lead.email) score += 15;
  if (lead.phone) score += 15;
  if (lead.value > 10000) score += 25;
  else if (lead.value > 1000) score += 15;
  if (['qualified', 'proposal'].includes(lead.status)) score += 20;
  if (lead.source === 'referral') score += 10;
  return Math.min(100, score);
}

function screenResume(text = '', requirements = []) {
  const lower = text.toLowerCase();
  const hits = requirements.filter((r) => lower.includes(String(r).toLowerCase()));
  const score = requirements.length ? Math.round((hits.length / requirements.length) * 100) : 50;
  return {
    score,
    matched: hits,
    notes: score >= 70 ? 'Strong match' : score >= 40 ? 'Partial match' : 'Weak match',
  };
}

module.exports = { askAi, scoreLead, screenResume, buildErpContext };
