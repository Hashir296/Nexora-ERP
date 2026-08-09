const express = require('express');
const { Lead, Customer, CrmActivity } = require('../models/CRM');
const { createCrudController, mountCrud } = require('../utils/crudFactory');
const { asyncHandler, sendSuccess } = require('../utils/api');
const { scoreLead } = require('../services/aiService');

const router = express.Router();

const leads = express.Router();
const leadCrud = createCrudController(Lead, {
  populate: ['owner'],
  searchFields: ['name', 'email', 'phone', 'status'],
  beforeCreate: async (payload) => {
    payload.aiScore = scoreLead(payload);
  },
});
mountCrud(leads, leadCrud);
leads.post(
  '/:id/rescore',
  asyncHandler(async (req, res) => {
    const item = await Lead.findById(req.params.id);
    item.aiScore = scoreLead(item);
    await item.save();
    sendSuccess(res, { item }, 'Lead rescored');
  })
);
router.use('/leads', leads);

const customers = express.Router();
mountCrud(customers, createCrudController(Customer, { populate: ['owner'], searchFields: ['name', 'email', 'phone'] }));
router.use('/customers', customers);

const activities = express.Router();
mountCrud(
  activities,
  createCrudController(CrmActivity, {
    populate: ['owner'],
    searchFields: ['subject', 'type', 'status'],
  })
);
router.use('/activities', activities);

router.get(
  '/funnel',
  asyncHandler(async (req, res) => {
    const company = req.user.company;
    const stages = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
    const counts = await Promise.all(
      stages.map(async (status) => ({
        status,
        count: await Lead.countDocuments({ company, status }),
        value: (
          await Lead.aggregate([
            { $match: { company, status } },
            { $group: { _id: null, total: { $sum: '$value' } } },
          ])
        )[0]?.total || 0,
      }))
    );
    sendSuccess(res, { funnel: counts });
  })
);

module.exports = router;
