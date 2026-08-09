const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    location: String,
    type: { type: String, enum: ['full-time', 'part-time', 'contract', 'intern'], default: 'full-time' },
    description: String,
    requirements: [String],
    salaryRange: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
    status: { type: String, enum: ['draft', 'open', 'closed'], default: 'open' },
    publishedAt: Date,
  },
  { timestamps: true }
);

const candidateSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    resumeUrl: String,
    resumeText: String,
    parsedResume: mongoose.Schema.Types.Mixed,
    aiScore: { type: Number, default: 0 },
    aiNotes: String,
    rating: { type: Number, min: 0, max: 5 },
    stage: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied',
    },
    interviews: [
      {
        scheduledAt: Date,
        mode: { type: String, enum: ['onsite', 'video', 'phone'], default: 'video' },
        interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        notes: String,
        rating: Number,
        status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
      },
    ],
    offer: {
      salary: Number,
      joiningDate: Date,
      letterUrl: String,
      status: { type: String, enum: ['none', 'sent', 'accepted', 'declined'], default: 'none' },
    },
  },
  { timestamps: true }
);

module.exports = {
  JobPosting: mongoose.model('JobPosting', jobPostingSchema),
  Candidate: mongoose.model('Candidate', candidateSchema),
};
