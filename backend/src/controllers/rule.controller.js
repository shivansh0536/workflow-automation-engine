const prisma         = require('../database/prisma');
const ActionFactory  = require('../services/actions/ActionFactory');

const listRules = async (req, res, next) => {
  try {
    const rules = await prisma.rule.findMany({
      include: { _count: { select: { actionLogs: true } } },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(rules);
  } catch (err) { next(err); }
};

const createRule = async (req, res, next) => {
  try {
    const { name, description, eventType, conditionField, conditionOperator,
            conditionValue, actionType, actionConfig, priority } = req.body;
    if (!name || !eventType || !conditionField || !conditionOperator
        || conditionValue === undefined || !actionType)
      return res.status(400).json({ error: 'name, eventType, conditionField, conditionOperator, conditionValue, actionType are required' });

    const rule = await prisma.rule.create({
      data: {
        name, description, eventType, conditionField, conditionOperator,
        conditionValue: Number(conditionValue),
        actionType, actionConfig: actionConfig || {},
        priority: priority || 1,
      },
    });
    res.status(201).json(rule);
  } catch (err) { next(err); }
};

const updateRule = async (req, res, next) => {
  try {
    const rule = await prisma.rule.update({ where: { id: req.params.id }, data: req.body });
    res.json(rule);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Rule not found' });
    next(err);
  }
};

const deleteRule = async (req, res, next) => {
  try {
    await prisma.rule.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Rule not found' });
    next(err);
  }
};

const toggleRule = async (req, res, next) => {
  try {
    const rule = await prisma.rule.findUnique({ where: { id: req.params.id } });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    const updated = await prisma.rule.update({
      where: { id: req.params.id },
      data:  { isActive: !rule.isActive },
    });
    res.json(updated);
  } catch (err) { next(err); }
};

const getAvailableActions = (_req, res) =>
  res.json({ actions: ActionFactory.getAvailableActions() });

module.exports = { listRules, createRule, updateRule, deleteRule, toggleRule, getAvailableActions };
