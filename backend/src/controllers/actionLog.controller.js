const prisma = require('../database/prisma');

const listLogs = async (req, res, next) => {
  try {
    const { employeeId, actionType, status, ruleId } = req.query;
    const logs = await prisma.actionLog.findMany({
      where: {
        ...(employeeId  && { employeeId }),
        ...(actionType  && { actionType }),
        ...(status      && { status }),
        ...(ruleId      && { ruleId }),
      },
      include: {
        employee: { select: { id: true, name: true, department: true } },
        rule:     { select: { id: true, name: true, eventType: true } },
        event:    { select: { id: true, type: true, createdAt: true } },
      },
      orderBy: { executedAt: 'desc' },
      take: 200,
    });
    res.json(logs);
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const [total, successful, failed, skipped] = await Promise.all([
      prisma.actionLog.count(),
      prisma.actionLog.count({ where: { status: 'SUCCESS' } }),
      prisma.actionLog.count({ where: { status: 'FAILED'  } }),
      prisma.actionLog.count({ where: { status: 'SKIPPED' } }),
    ]);
    const byAction = await prisma.actionLog.groupBy({
      by: ['actionType'],
      _count: { id: true },
      where: { status: 'SUCCESS' },
    });
    res.json({ total, successful, failed, skipped, byAction });
  } catch (err) { next(err); }
};

module.exports = { listLogs, getStats };
