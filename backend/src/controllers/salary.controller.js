const prisma = require('../database/prisma');

const getSalarySimulation = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const now = new Date();
    const m = req.query.month ? parseInt(req.query.month) - 1 : now.getMonth();
    const y = req.query.year  ? parseInt(req.query.year)      : now.getFullYear();
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0);

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const attendances = await prisma.attendance.findMany({
      where: { employeeId, date: { gte: start, lte: end } },
    });
    const salaryLogs = await prisma.actionLog.findMany({
      where: {
        employeeId, status: 'SUCCESS',
        actionType: { in: ['DeductSalary', 'AddBonus'] },
        executedAt: { gte: start, lte: end },
      },
      include: { rule: { select: { name: true } } },
    });

    let totalDeductions = 0, totalBonuses = 0;
    for (const log of salaryLogs) {
      const r = log.result || {};
      if (log.actionType === 'DeductSalary') totalDeductions += r.deductionAmount || 0;
      if (log.actionType === 'AddBonus')     totalBonuses    += r.bonusAmount     || 0;
    }

    res.json({
      employee:   { id: employee.id, name: employee.name, department: employee.department, role: employee.role },
      month: m + 1, year: y,
      attendance: {
        workingDays:    end.getDate(),
        presentDays:    attendances.filter(a => ['PRESENT','HALF_DAY'].includes(a.status)).length,
        absentDays:     attendances.filter(a => a.status === 'ABSENT').length,
        overtimeHours:  attendances.reduce((s, a) => s + (a.overtime || 0), 0),
      },
      salary: {
        baseSalary:      employee.baseSalary,
        totalDeductions, totalBonuses,
        netSalary:       employee.baseSalary - totalDeductions + totalBonuses,
      },
      modifications: salaryLogs.map(l => ({
        type:   l.actionType,
        rule:   l.rule?.name,
        amount: l.result?.deductionAmount || l.result?.bonusAmount || 0,
        date:   l.executedAt,
      })),
    });
  } catch (err) { next(err); }
};

const getAllSalaries = async (req, res, next) => {
  try {
    const now = new Date();
    const m = req.query.month ? parseInt(req.query.month) - 1 : now.getMonth();
    const y = req.query.year  ? parseInt(req.query.year)      : now.getFullYear();
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0);

    const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    const salaries  = await Promise.all(employees.map(async (emp) => {
      const logs = await prisma.actionLog.findMany({
        where: { employeeId: emp.id, status: 'SUCCESS', actionType: { in: ['DeductSalary','AddBonus'] }, executedAt: { gte: start, lte: end } },
      });
      let totalDeductions = 0, totalBonuses = 0;
      for (const l of logs) {
        const r = l.result || {};
        if (l.actionType === 'DeductSalary') totalDeductions += r.deductionAmount || 0;
        if (l.actionType === 'AddBonus')     totalBonuses    += r.bonusAmount     || 0;
      }
      return {
        id:         emp.id,
        name:       emp.name,
        department: emp.department,
        role:       emp.role,
        baseSalary: emp.baseSalary,
        totalDeductions, totalBonuses,
        netSalary:  emp.baseSalary - totalDeductions + totalBonuses,
      };
    }));
    res.json(salaries);
  } catch (err) { next(err); }
};

module.exports = { getSalarySimulation, getAllSalaries };
