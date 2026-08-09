const express = require('express');
const {
  Employee,
  Attendance,
  Shift,
  Leave,
  LeaveBalance,
  Payroll,
} = require('../models/HR');
const { createCrudController, mountCrud } = require('../utils/crudFactory');
const { asyncHandler, sendSuccess, ApiError } = require('../utils/api');

const router = express.Router();

const employees = express.Router();
mountCrud(
  employees,
  createCrudController(Employee, {
    populate: ['department', 'designation', 'team', 'manager', 'user'],
    searchFields: ['firstName', 'lastName', 'email', 'employeeCode'],
  })
);
router.use('/employees', employees);

const shifts = express.Router();
mountCrud(shifts, createCrudController(Shift, { searchFields: ['name'] }));
router.use('/shifts', shifts);

const attendance = express.Router();
mountCrud(
  attendance,
  createCrudController(Attendance, {
    populate: ['employee', 'shift'],
    searchFields: ['notes', 'method', 'status'],
  })
);

attendance.post(
  '/check-in',
  asyncHandler(async (req, res) => {
    const { employeeId, method = 'manual', location } = req.body;
    const employee = await Employee.findById(employeeId || req.user.employee);
    if (!employee) throw new ApiError(404, 'Employee not found');
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    let record = await Attendance.findOne({ employee: employee._id, date: day });
    if (record?.checkIn) throw new ApiError(400, 'Already checked in');
    if (!record) {
      record = await Attendance.create({
        employee: employee._id,
        company: employee.company,
        date: day,
        checkIn: new Date(),
        method,
        location,
        status: 'present',
      });
    } else {
      record.checkIn = new Date();
      record.method = method;
      record.location = location;
      await record.save();
    }
    sendSuccess(res, { item: record }, 'Checked in');
  })
);

attendance.post(
  '/check-out',
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.body.employeeId || req.user.employee);
    if (!employee) throw new ApiError(404, 'Employee not found');
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const record = await Attendance.findOne({ employee: employee._id, date: day });
    if (!record?.checkIn) throw new ApiError(400, 'No check-in found');
    record.checkOut = new Date();
    const mins = Math.round((record.checkOut - record.checkIn) / 60000);
    record.overtimeMinutes = Math.max(0, mins - 8 * 60);
    await record.save();
    sendSuccess(res, { item: record }, 'Checked out');
  })
);
router.use('/attendance', attendance);

const leaves = express.Router();
mountCrud(leaves, createCrudController(Leave, { populate: ['employee', 'reviewedBy'], searchFields: ['type', 'reason', 'status'] }));
leaves.post(
  '/:id/review',
  asyncHandler(async (req, res) => {
    const leave = await Leave.findById(req.params.id);
    if (!leave) throw new ApiError(404, 'Leave not found');
    leave.status = req.body.status;
    leave.reviewNotes = req.body.notes;
    leave.reviewedBy = req.user._id;
    await leave.save();
    if (leave.status === 'approved') {
      const year = new Date(leave.from).getFullYear();
      const bal = await LeaveBalance.findOne({ employee: leave.employee, year });
      if (bal) {
        if (leave.type === 'annual') bal.usedAnnual += leave.days;
        if (leave.type === 'sick') bal.usedSick += leave.days;
        if (leave.type === 'casual') bal.usedCasual += leave.days;
        await bal.save();
      }
    }
    sendSuccess(res, { item: leave }, 'Leave reviewed');
  })
);
router.use('/leaves', leaves);

const balances = express.Router();
mountCrud(balances, createCrudController(LeaveBalance, { populate: ['employee'], searchFields: [] }));
router.use('/leave-balances', balances);

const payroll = express.Router();
mountCrud(payroll, createCrudController(Payroll, { populate: ['employee'], searchFields: ['status'] }));
payroll.post(
  '/generate',
  asyncHandler(async (req, res) => {
    const { employeeId, month, year } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new ApiError(404, 'Employee not found');
    const basic = employee.salary?.basic || 0;
    const allowances = employee.salary?.allowances || 0;
    const bonus = Number(req.body.bonus) || 0;
    const tax = Math.round((basic + allowances + bonus) * 0.1);
    const deductions = Number(req.body.deductions) || 0;
    const overtimePay = Number(req.body.overtimePay) || 0;
    const netPay = basic + allowances + bonus + overtimePay - tax - deductions;
    const item = await Payroll.findOneAndUpdate(
      { employee: employee._id, month, year },
      {
        company: employee.company,
        basic,
        allowances,
        bonus,
        tax,
        deductions,
        overtimePay,
        netPay,
        status: 'processed',
      },
      { upsert: true, new: true }
    );
    sendSuccess(res, { item }, 'Payroll generated');
  })
);
router.use('/payroll', payroll);

router.get(
  '/salary-prediction/:employeeId',
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) throw new ApiError(404, 'Employee not found');
    const basic = employee.salary?.basic || 0;
    sendSuccess(res, {
      current: basic,
      predicted: Math.round(basic * 1.08),
      scenario: '8% growth',
    });
  })
);

module.exports = router;
