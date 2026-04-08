const prisma     = require('../database/prisma');
const ruleEngine = require('../services/ruleEngine.service');

const listLeaves = async (req, res, next) => {
  try {
    const { employeeId, status } = req.query;
    const leaves = await prisma.leave.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(status     && { status }),
      },
      include: { employee: { select: { id: true, name: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(leaves);
  } catch (err) { next(err); }
};

const requestLeave = async (req, res, next) => {
  try {
    const { employeeId, type, fromDate, toDate, reason } = req.body;
    if (!employeeId || !type || !fromDate || !toDate)
      return res.status(400).json({ error: 'employeeId, type, fromDate, toDate are required' });
    const leave = await prisma.leave.create({
      data: { employeeId, type, fromDate: new Date(fromDate), toDate: new Date(toDate), reason },
    });
    res.status(201).json(leave);
  } catch (err) { next(err); }
};

const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status))
      return res.status(400).json({ error: 'status must be APPROVED or REJECTED' });

    const leave = await prisma.leave.update({
      where: { id: req.params.id },
      data:  { status },
      include: { employee: true },
    });

    const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / 86400000) + 1;
    const event = await prisma.hREvent.create({
      data: {
        type: status === 'APPROVED' ? 'LeaveApproved' : 'LeaveRejected',
        employeeId: leave.employeeId,
        payload: { leave_type: leave.type, days, from_date: leave.fromDate, to_date: leave.toDate },
      },
    });
    ruleEngine.processEvent(event).catch(e => console.error('[RuleEngine]', e));

    res.json(leave);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Leave not found' });
    next(err);
  }
};

module.exports = { listLeaves, requestLeave, updateLeaveStatus };
