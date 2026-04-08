const prisma = require('../database/prisma');

// GET /api/workflows
const listWorkflows = async (req, res, next) => {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { runs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(workflows);
  } catch (err) {
    next(err);
  }
};

// GET /api/workflows/:id
const getWorkflow = async (req, res, next) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id },
      include: {
        steps: { orderBy: { order: 'asc' } },
        runs: { orderBy: { startedAt: 'desc' }, take: 10 },
      },
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json(workflow);
  } catch (err) {
    next(err);
  }
};

// POST /api/workflows
const createWorkflow = async (req, res, next) => {
  try {
    const { name, description, trigger, steps = [] } = req.body;
    if (!name || !trigger) {
      return res.status(400).json({ error: 'name and trigger are required' });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        trigger,
        steps: {
          create: steps.map((s, i) => ({
            name: s.name,
            type: s.type,
            config: s.config || {},
            order: i + 1,
          })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    res.status(201).json(workflow);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/workflows/:id
const updateWorkflow = async (req, res, next) => {
  try {
    const { name, description, trigger, status } = req.body;
    const workflow = await prisma.workflow.update({
      where: { id: req.params.id },
      data: { name, description, trigger, status },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    res.json(workflow);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Workflow not found' });
    next(err);
  }
};

// DELETE /api/workflows/:id
const deleteWorkflow = async (req, res, next) => {
  try {
    await prisma.workflow.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Workflow not found' });
    next(err);
  }
};

// POST /api/workflows/:id/activate
const activateWorkflow = async (req, res, next) => {
  try {
    const workflow = await prisma.workflow.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    });
    res.json(workflow);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Workflow not found' });
    next(err);
  }
};

// POST /api/workflows/:id/deactivate
const deactivateWorkflow = async (req, res, next) => {
  try {
    const workflow = await prisma.workflow.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' },
    });
    res.json(workflow);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Workflow not found' });
    next(err);
  }
};

module.exports = {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  deactivateWorkflow,
};
