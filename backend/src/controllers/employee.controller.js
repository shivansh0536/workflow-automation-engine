const prisma = require('../database/prisma');

const listEmployees = async (req, res, next) => {
  try {
    const { department, status } = req.query;
    const employees = await prisma.employee.findMany({
      where: {
        ...(department && { department }),
        ...(status     && { status }),
      },
      include: { _count: { select: { attendances: true, leaves: true, actionLogs: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(employees);
  } catch (err) { next(err); }
};

const getEmployee = async (req, res, next) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        leaves:      { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) { next(err); }
};

const createEmployee = async (req, res, next) => {
  try {
    const { name, email, department, role, baseSalary, joiningDate } = req.body;
    if (!name || !email || !department || !role || !baseSalary)
      return res.status(400).json({ error: 'name, email, department, role, baseSalary are required' });
    const emp = await prisma.employee.create({
      data: {
        name, email, department, role,
        baseSalary:  Number(baseSalary),
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      },
    });
    res.status(201).json(emp);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Email already exists' });
    next(err);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const emp = await prisma.employee.update({ where: { id: req.params.id }, data: req.body });
    res.json(emp);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Employee not found' });
    next(err);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Employee not found' });
    next(err);
  }
};

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
