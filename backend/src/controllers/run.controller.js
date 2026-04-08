const prisma = require('../database/prisma');
const { executeWorkflow } = require('../services/executor.service');

// GET /api/runs
const listRuns = async (req, res, next) => {
  try {
    const { workflowId, status, limit = 20 } = req.query;
    const runs = await prisma.workflowRun.findMany({
      where: {
        ...(workflowId && { workflowId }),
        ...(status && { status }),
      },
      include: {
        workflow: { select: { id: true, name: true } },
        stepRuns: { include: { step: true }, orderBy: { executedAt: 'asc' } },
      },
      orderBy: { startedAt: 'desc' },
      take: Number(limit),
    });
    res.json(runs);
  } catch (err) {
    next(err);
  }
};

// GET /api/runs/:id
const getRun = async (req, res, next) => {
  try {
    const run = await prisma.workflowRun.findUnique({
      where: { id: req.params.id },
      include: {
        workflow: true,
        stepRuns: { include: { step: true }, orderBy: { executedAt: 'asc' } },
      },
    });
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json(run);
  } catch (err) {
    next(err);
  }
};

// POST /api/runs  (trigger a workflow manually)
const triggerRun = async (req, res, next) => {
  try {
    const { workflowId } = req.body;
    if (!workflowId) return res.status(400).json({ error: 'workflowId is required' });

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    if (workflow.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Workflow is not active' });
    }

    // Create run record
    const run = await prisma.workflowRun.create({
      data: { workflowId, status: 'PENDING' },
    });

    // Execute asynchronously
    executeWorkflow(workflow, run.id).catch((err) =>
      console.error('[Executor error]', err)
    );

    res.status(202).json({ message: 'Workflow run started', runId: run.id });
  } catch (err) {
    next(err);
  }
};

module.exports = { listRuns, getRun, triggerRun };
