const express = require('express');
const { Project, Sprint, Task, TimeEntry } = require('../models/Project');
const { createCrudController, mountCrud } = require('../utils/crudFactory');
const { asyncHandler, sendSuccess, ApiError } = require('../utils/api');

const router = express.Router();

const projects = express.Router();
mountCrud(
  projects,
  createCrudController(Project, {
    populate: ['members', 'owner'],
    searchFields: ['name', 'status', 'method'],
  })
);
router.use('/projects', projects);

const sprints = express.Router();
mountCrud(sprints, createCrudController(Sprint, { populate: ['project'], searchFields: ['name', 'status'], companyScoped: false }));
router.use('/sprints', sprints);

const tasks = express.Router();
mountCrud(
  tasks,
  createCrudController(Task, {
    populate: ['assignees', 'project', 'sprint'],
    searchFields: ['title', 'status', 'priority'],
    companyScoped: false,
  })
);
tasks.post(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError(404, 'Task not found');
    task.comments.push({
      user: req.user._id,
      body: req.body.body,
      mentions: req.body.mentions || [],
    });
    await task.save();
    sendSuccess(res, { item: task }, 'Comment added');
  })
);
tasks.post(
  '/:id/ai-breakdown',
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError(404, 'Task not found');
    task.aiBreakdown = [
      `Research scope: ${task.title}`,
      'Design approach and acceptance criteria',
      'Implement core logic',
      'Peer review and polish',
      'Ship and monitor',
    ];
    await task.save();
    sendSuccess(res, { item: task }, 'AI breakdown generated');
  })
);
router.use('/tasks', tasks);

const timeEntries = express.Router();
mountCrud(
  timeEntries,
  createCrudController(TimeEntry, {
    populate: ['task', 'user'],
    searchFields: ['note'],
    companyScoped: false,
    beforeCreate: async (payload, req) => {
      payload.user = req.user._id;
    },
    afterCreate: async (item) => {
      const task = await Task.findById(item.task);
      if (task) {
        task.loggedHours = (task.loggedHours || 0) + item.minutes / 60;
        await task.save();
      }
    },
  })
);
router.use('/time-entries', timeEntries);

router.get(
  '/board/:projectId',
  asyncHandler(async (req, res) => {
    const statuses = ['backlog', 'todo', 'in-progress', 'review', 'done'];
    const tasksList = await Task.find({ project: req.params.projectId }).populate('assignees', 'name');
    const columns = statuses.map((status) => ({
      status,
      tasks: tasksList.filter((t) => t.status === status).sort((a, b) => a.order - b.order),
    }));
    sendSuccess(res, { columns });
  })
);

module.exports = router;
