/**
 * Dashboard Controller
 *
 * Aggregates statistics from multiple models for the dashboard overview.
 */
const prisma = require('../database/prisma');

const getDashboardStats = async (_req, res, next) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      totalRules,
      activeRules,
      totalEvents,
      pendingEvents,
      processedEvents,
      failedEvents,
      totalActionLogs,
      successfulActions,
      failedActions,
      skippedActions,
      pendingLeaves,
      totalWorkflows,
      activeWorkflows,
      totalRuns,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.rule.count(),
      prisma.rule.count({ where: { isActive: true } }),
      prisma.hREvent.count(),
      prisma.hREvent.count({ where: { status: 'PENDING' } }),
      prisma.hREvent.count({ where: { status: 'PROCESSED' } }),
      prisma.hREvent.count({ where: { status: 'FAILED' } }),
      prisma.actionLog.count(),
      prisma.actionLog.count({ where: { status: 'SUCCESS' } }),
      prisma.actionLog.count({ where: { status: 'FAILED' } }),
      prisma.actionLog.count({ where: { status: 'SKIPPED' } }),
      prisma.leave.count({ where: { status: 'PENDING' } }),
      prisma.workflow.count(),
      prisma.workflow.count({ where: { status: 'ACTIVE' } }),
      prisma.workflowRun.count(),
    ]);

    // Action breakdown by type
    const actionsByType = await prisma.actionLog.groupBy({
      by: ['actionType'],
      _count: { id: true },
      where: { status: 'SUCCESS' },
    });

    // Recent events
    const recentEvents = await prisma.hREvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        employee: { select: { name: true } },
      },
    });

    res.json({
      employees: { total: totalEmployees, active: activeEmployees },
      rules:     { total: totalRules, active: activeRules },
      events:    { total: totalEvents, pending: pendingEvents, processed: processedEvents, failed: failedEvents },
      actions:   { total: totalActionLogs, successful: successfulActions, failed: failedActions, skipped: skippedActions, byType: actionsByType },
      leaves:    { pending: pendingLeaves },
      workflows: { total: totalWorkflows, active: activeWorkflows },
      runs:      { total: totalRuns },
      recentEvents,
    });
  } catch (err) { next(err); }
};

module.exports = { getDashboardStats };
