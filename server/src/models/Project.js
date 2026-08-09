const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    description: String,
    method: { type: String, enum: ['kanban', 'scrum'], default: 'kanban' },
    status: { type: String, enum: ['planning', 'active', 'on-hold', 'done'], default: 'active' },
    startDate: Date,
    endDate: Date,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const sprintSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    goal: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dueDate: Date,
    estimateHours: Number,
    loggedHours: { type: Number, default: 0 },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        body: String,
        mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    aiBreakdown: [String],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const timeEntrySchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    minutes: { type: Number, required: true },
    note: String,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = {
  Project: mongoose.model('Project', projectSchema),
  Sprint: mongoose.model('Sprint', sprintSchema),
  Task: mongoose.model('Task', taskSchema),
  TimeEntry: mongoose.model('TimeEntry', timeEntrySchema),
};
