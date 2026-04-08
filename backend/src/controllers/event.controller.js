const prisma     = require('../database/prisma');
const ruleEngine = require('../services/ruleEngine.service');

const EVENT_TYPES = [
  'AttendanceMarked', 'LeaveApproved', 'LeaveRejected',
  'OvertimeRecorded', 'ShiftCompleted', 'TaskOverdue',
  'TaskCompleted',    'SalaryCalculated', 'LateEntry',
];

const listEvents = async (req, res, next) => {
  try {
    const { type, status, employeeId } = req.query;
    const events = await prisma.hREvent.findMany({
      where: {
        ...(type       && { type }),
        ...(status     && { status }),
        ...(employeeId && { employeeId }),
      },
      include: {
        employee:   { select: { id: true, name: true } },
        actionLogs: { include: { rule: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(events);
  } catch (err) { next(err); }
};

const triggerEvent = async (req, res, next) => {
  try {
    const { type, employeeId, payload } = req.body;
    if (!type) return res.status(400).json({ error: 'type is required' });
    const event = await prisma.hREvent.create({
      data: { type, employeeId: employeeId || null, payload: payload || {} },
    });
    ruleEngine.processEvent(event).catch(e => console.error('[RuleEngine]', e));
    res.status(202).json({ message: 'Event triggered', eventId: event.id });
  } catch (err) { next(err); }
};

const getEventTypes = (_req, res) => res.json({ eventTypes: EVENT_TYPES });

module.exports = { listEvents, triggerEvent, getEventTypes };
