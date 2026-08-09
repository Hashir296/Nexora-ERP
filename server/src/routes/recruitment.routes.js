const express = require('express');
const { JobPosting, Candidate } = require('../models/Recruitment');
const { createCrudController, mountCrud } = require('../utils/crudFactory');
const { asyncHandler, sendSuccess, ApiError } = require('../utils/api');
const { screenResume } = require('../services/aiService');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const jobs = express.Router();
mountCrud(jobs, createCrudController(JobPosting, { populate: ['department'], searchFields: ['title', 'location', 'status'] }));
router.use('/jobs', jobs);

const candidates = express.Router();
mountCrud(
  candidates,
  createCrudController(Candidate, {
    populate: ['job'],
    searchFields: ['name', 'email', 'stage'],
  })
);
candidates.post(
  '/:id/screen',
  asyncHandler(async (req, res) => {
    const candidate = await Candidate.findById(req.params.id).populate('job');
    if (!candidate) throw new ApiError(404, 'Candidate not found');
    const result = screenResume(candidate.resumeText || '', candidate.job?.requirements || []);
    candidate.aiScore = result.score;
    candidate.aiNotes = result.notes;
    candidate.stage = 'screening';
    await candidate.save();
    sendSuccess(res, { item: candidate, screening: result }, 'AI screening complete');
  })
);
candidates.post(
  '/:id/interview',
  asyncHandler(async (req, res) => {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) throw new ApiError(404, 'Candidate not found');
    candidate.interviews.push(req.body);
    candidate.stage = 'interview';
    await candidate.save();
    sendSuccess(res, { item: candidate }, 'Interview scheduled');
  })
);
candidates.post(
  '/:id/offer',
  asyncHandler(async (req, res) => {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) throw new ApiError(404, 'Candidate not found');
    candidate.offer = { ...candidate.offer?.toObject?.() || candidate.offer, ...req.body, status: 'sent' };
    candidate.stage = 'offer';
    await candidate.save();
    sendSuccess(res, { item: candidate }, 'Offer sent');
  })
);
router.use('/candidates', candidates);

// Public careers listing (mounted separately with optional auth in app)
router.get(
  '/careers',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const filter = { status: 'open' };
    if (req.query.company) filter.company = req.query.company;
    const items = await JobPosting.find(filter).sort('-publishedAt');
    sendSuccess(res, { items });
  })
);

module.exports = router;
