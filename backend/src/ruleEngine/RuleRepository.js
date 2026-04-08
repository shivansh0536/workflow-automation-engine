/**
 * RuleRepository — Repository Pattern
 *
 * Abstracts data access for rules. Separates database queries from
 * business logic, making the rule engine testable and DB-agnostic.
 *
 * Design Pattern: Repository
 * SOLID: Single Responsibility — data access only
 *        Dependency Inversion — engine depends on repository abstraction
 */
const prisma = require('../database/prisma');
const RuleModel = require('../models/Rule');
const { createLogger } = require('../utils/logger');

const logger = createLogger('RuleRepository');

class RuleRepository {
  /**
   * Find all active rules for a given event type, ordered by priority.
   * @param {string} eventType
   * @returns {Promise<RuleModel[]>}
   */
  async findActiveByEventType(eventType) {
    logger.debug(`Fetching active rules for event type: ${eventType}`);
    const records = await prisma.rule.findMany({
      where: { eventType, isActive: true },
      orderBy: { priority: 'asc' },
    });
    return records.map(RuleModel.fromPrisma);
  }

  /**
   * Find a rule by its ID.
   * @param {string} id
   * @returns {Promise<RuleModel|null>}
   */
  async findById(id) {
    const record = await prisma.rule.findUnique({ where: { id } });
    return record ? RuleModel.fromPrisma(record) : null;
  }

  /**
   * Fetch all rules.
   * @returns {Promise<RuleModel[]>}
   */
  async findAll() {
    const records = await prisma.rule.findMany({
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
    return records.map(RuleModel.fromPrisma);
  }

  /**
   * Create a new rule.
   * @param {Object} data
   * @returns {Promise<RuleModel>}
   */
  async create(data) {
    const record = await prisma.rule.create({ data });
    logger.info(`Rule created: ${record.name} (${record.id})`);
    return RuleModel.fromPrisma(record);
  }

  /**
   * Update a rule.
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<RuleModel>}
   */
  async update(id, data) {
    const record = await prisma.rule.update({ where: { id }, data });
    logger.info(`Rule updated: ${record.name} (${record.id})`);
    return RuleModel.fromPrisma(record);
  }

  /**
   * Delete a rule.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await prisma.rule.delete({ where: { id } });
    logger.info(`Rule deleted: ${id}`);
  }

  /**
   * Toggle a rule's active status.
   * @param {string} id
   * @returns {Promise<RuleModel>}
   */
  async toggle(id) {
    const existing = await prisma.rule.findUnique({ where: { id } });
    if (!existing) throw new Error(`Rule not found: ${id}`);
    const record = await prisma.rule.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    logger.info(`Rule toggled: ${record.name} → ${record.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    return RuleModel.fromPrisma(record);
  }

  /**
   * Count rules by event type.
   * @returns {Promise<Object[]>}
   */
  async countByEventType() {
    return prisma.rule.groupBy({
      by: ['eventType'],
      _count: { id: true },
      where: { isActive: true },
    });
  }
}

module.exports = new RuleRepository();
