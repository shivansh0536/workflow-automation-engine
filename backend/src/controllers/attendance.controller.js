const prisma      = require('../database/prisma');
const ruleEngine  = require('../services/ruleEngine.service');

const listAttendance = async (req, res, next) => {
  try {
    const { employeeId, date } = req.query;
    const records = await prisma.attendance.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(date       && { date: new Date(date) }),
      },
      include: { employee: { select: { id: true, name: true, department: true } } },
      orderBy: { date: 'desc' },
      take: 200,
    });
    res.json(records);
  } catch (err) { next(err); }
};

const markAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, overtime } = req.body;
    if (!employeeId || !date)
      return res.status(400).json({ error: 'employeeId and date are required' });

    const checkInTime  = checkIn  ? new Date(checkIn)  : null;
    const checkOutTime = checkOut ? new Date(checkOut) : null;
    const hoursWorked  = checkInTime && checkOutTime
      ? (checkOutTime - checkInTime) / 3600000 : null;

    const attendance = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      create: { employeeId, date: new Date(date), checkIn: checkInTime, checkOut: checkOutTime, hoursWorked, overtime: overtime || 0, status: status || 'PRESENT' },
      update: { checkIn: checkInTime, checkOut: checkOutTime, hoursWorked, overtime: overtime || 0, status: status || 'PRESENT' },
    });

    // Compute monthly present days for rule evaluation
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthlyDays = await prisma.attendance.count({
      where: { employeeId, date: { gte: start, lte: end }, status: { in: ['PRESENT', 'HALF_DAY'] } },
    });

    const isLate = checkInTime && (checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 30));

    // Fire event — processed asynchronously
    const event = await prisma.hREvent.create({
      data: {
        type: 'AttendanceMarked',
        employeeId,
        payload: {
          attendance_days:  monthlyDays,
          overtime_hours:   attendance.overtime || 0,
          hours_worked:     hoursWorked || 0,
          is_late:          isLate ? 1 : 0,
          status:           attendance.status,
        },
      },
    });
    ruleEngine.processEvent(event).catch(e => console.error('[RuleEngine]', e));

    res.status(201).json({ attendance, eventId: event.id });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Attendance already marked for this date' });
    next(err);
  }
};

const getAttendanceSummary = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const now = new Date();
    const m = req.query.month ? parseInt(req.query.month) - 1 : now.getMonth();
    const y = req.query.year  ? parseInt(req.query.year)      : now.getFullYear();
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0);
    const records = await prisma.attendance.findMany({
      where: { employeeId, date: { gte: start, lte: end } },
    });
    res.json({
      summary: {
        present:      records.filter(r => r.status === 'PRESENT').length,
        absent:       records.filter(r => r.status === 'ABSENT').length,
        late:         records.filter(r => r.status === 'LATE').length,
        halfDay:      records.filter(r => r.status === 'HALF_DAY').length,
        totalOvertime: records.reduce((s, r) => s + (r.overtime || 0), 0),
        totalHours:   records.reduce((s, r) => s + (r.hoursWorked || 0), 0),
      },
      records,
    });
  } catch (err) { next(err); }
};

module.exports = { listAttendance, markAttendance, getAttendanceSummary };
