const { asyncHandler, sendSuccess, ApiError } = require('../utils/api');

/**
 * Generic CRUD factory for plugin resources.
 * company-scoped by default when model has company field.
 */
function createCrudController(Model, options = {}) {
  const {
    populate = [],
    searchFields = ['name', 'title', 'email'],
    companyScoped = true,
    beforeCreate,
    afterCreate,
  } = options;

  const list = asyncHandler(async (req, res) => {
    const filter = {};
    if (companyScoped && req.user.company) filter.company = req.user.company;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) {
      filter.$or = searchFields.map((f) => ({
        [f]: { $regex: req.query.q, $options: 'i' },
      }));
    }
    Object.keys(req.query).forEach((key) => {
      if (['page', 'limit', 'q', 'sort', 'status'].includes(key)) return;
      if (req.query[key]) filter[key] = req.query[key];
    });

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const sort = req.query.sort || '-createdAt';

    let query = Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);
    populate.forEach((p) => {
      query = query.populate(p);
    });

    const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
    sendSuccess(res, { items, total, page, limit, pages: Math.ceil(total / limit) });
  });

  const getOne = asyncHandler(async (req, res) => {
    let query = Model.findById(req.params.id);
    populate.forEach((p) => {
      query = query.populate(p);
    });
    const item = await query;
    if (!item) throw new ApiError(404, 'Not found');
    if (companyScoped && req.user.company && item.company?.toString() !== req.user.company.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    sendSuccess(res, { item });
  });

  const create = asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    if (companyScoped && req.user.company) payload.company = req.user.company;
    if (beforeCreate) await beforeCreate(payload, req);
    const item = await Model.create(payload);
    if (afterCreate) await afterCreate(item, req);
    sendSuccess(res, { item }, 'Created', 201);
  });

  const update = asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) throw new ApiError(404, 'Not found');
    if (companyScoped && req.user.company && item.company?.toString() !== req.user.company.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    Object.assign(item, req.body);
    await item.save();
    sendSuccess(res, { item }, 'Updated');
  });

  const remove = asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) throw new ApiError(404, 'Not found');
    if (companyScoped && req.user.company && item.company?.toString() !== req.user.company.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    await item.deleteOne();
    sendSuccess(res, null, 'Deleted');
  });

  return { list, getOne, create, update, remove };
}

function mountCrud(router, controller) {
  router.get('/', controller.list);
  router.get('/:id', controller.getOne);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

module.exports = { createCrudController, mountCrud };
