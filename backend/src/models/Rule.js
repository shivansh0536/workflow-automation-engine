/**
 * Rule Domain Model
 *
 * Encapsulates rule business logic, validation, and serialization.
 * Separates domain concerns from database/Prisma concerns.
 *
 * OOP Principles:
 *   - Encapsulation: internal state managed via methods
 *   - Single Responsibility: handles only rule domain logic
 */
class RuleModel {
  /**
   * @param {Object} data - raw rule data (from Prisma or API)
   */
  constructor(data = {}) {
    this.id                = data.id || null;
    this.name              = data.name || '';
    this.description       = data.description || '';
    this.eventType         = data.eventType || '';
    this.conditionField    = data.conditionField || '';
    this.conditionOperator = data.conditionOperator || '';
    this.conditionValue    = data.conditionValue ?? 0;
    this.actionType        = data.actionType || '';
    this.actionConfig      = data.actionConfig || {};
    this.isActive          = data.isActive !== undefined ? data.isActive : true;
    this.priority          = data.priority || 1;
    this.createdAt         = data.createdAt ? new Date(data.createdAt) : null;
    this.updatedAt         = data.updatedAt ? new Date(data.updatedAt) : null;
  }

  /**
   * Check if this rule matches a given event type.
   * @param {string} eventType
   * @returns {boolean}
   */
  matchesEventType(eventType) {
    return this.isActive && this.eventType === eventType;
  }

  /**
   * Get a human-readable description of the condition.
   * @returns {string}
   */
  describeCondition() {
    return `${this.conditionField} ${this.conditionOperator} ${this.conditionValue}`;
  }

  /**
   * Get a human-readable summary of the rule.
   * @returns {string}
   */
  summarize() {
    const status = this.isActive ? 'ACTIVE' : 'INACTIVE';
    return `[${status}] "${this.name}" — When ${this.eventType}: if ${this.describeCondition()} → ${this.actionType}`;
  }

  /**
   * Validate the rule for completeness.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];
    if (!this.name) errors.push('Rule name is required');
    if (!this.eventType) errors.push('Event type is required');
    if (!this.conditionField) errors.push('Condition field is required');
    if (!this.conditionOperator) errors.push('Condition operator is required');
    if (this.conditionValue === undefined) errors.push('Condition value is required');
    if (!this.actionType) errors.push('Action type is required');
    return { valid: errors.length === 0, errors };
  }

  /**
   * Serialize to a plain object for API responses.
   * @returns {Object}
   */
  toJSON() {
    return {
      id:                this.id,
      name:              this.name,
      description:       this.description,
      eventType:         this.eventType,
      conditionField:    this.conditionField,
      conditionOperator: this.conditionOperator,
      conditionValue:    this.conditionValue,
      actionType:        this.actionType,
      actionConfig:      this.actionConfig,
      isActive:          this.isActive,
      priority:          this.priority,
      createdAt:         this.createdAt,
      updatedAt:         this.updatedAt,
    };
  }

  /**
   * Create a RuleModel from a Prisma record.
   * @param {Object} prismaRecord
   * @returns {RuleModel}
   */
  static fromPrisma(prismaRecord) {
    return new RuleModel(prismaRecord);
  }
}

module.exports = RuleModel;
