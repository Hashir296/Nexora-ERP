const express = require('express');
const { Company, Branch, Office, Department, Designation, Team } = require('../models/Organization');
const { createCrudController, mountCrud } = require('../utils/crudFactory');
const { asyncHandler, sendSuccess } = require('../utils/api');
const { Employee } = require('../models/HR');

const router = express.Router();

const companies = express.Router();
mountCrud(companies, createCrudController(Company, { companyScoped: false, searchFields: ['name', 'code', 'email'] }));
router.use('/companies', companies);

const branches = express.Router();
mountCrud(branches, createCrudController(Branch, { populate: ['company', 'manager'], searchFields: ['name', 'code'] }));
router.use('/branches', branches);

const offices = express.Router();
mountCrud(offices, createCrudController(Office, { populate: ['branch'], searchFields: ['name'] }));
router.use('/offices', offices);

const departments = express.Router();
mountCrud(departments, createCrudController(Department, { populate: ['head', 'parent'], searchFields: ['name', 'code'] }));
router.use('/departments', departments);

const designations = express.Router();
mountCrud(designations, createCrudController(Designation, { searchFields: ['title'] }));
router.use('/designations', designations);

const teams = express.Router();
mountCrud(teams, createCrudController(Team, { populate: ['lead', 'members', 'department'], searchFields: ['name'] }));
router.use('/teams', teams);

router.get(
  '/chart',
  asyncHandler(async (req, res) => {
    const company = req.user.company;
    const [deps, teamsList, employees] = await Promise.all([
      Department.find({ company }).populate('head', 'name email'),
      Team.find({ company }).populate('lead', 'name').populate('members', 'name'),
      Employee.find({ company, status: 'active' })
        .populate('manager', 'firstName lastName')
        .populate('department', 'name')
        .populate('designation', 'title')
        .select('firstName lastName employeeCode manager department designation'),
    ]);
    sendSuccess(res, { departments: deps, teams: teamsList, hierarchy: employees });
  })
);

module.exports = router;
