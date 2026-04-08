/**
 * BaseAction — Command Pattern
 * Abstract base class. All concrete actions extend this.
 * SOLID: Liskov Substitution — any subclass can replace BaseAction
 * SOLID: Interface Segregation — minimal interface (execute only)
 */
class BaseAction {
  /**
   * @param {Object} employee - Employee Prisma record
   * @param {Object} rule     - Rule that triggered this action
   * @param {Object} event    - HREvent being processed
   * @returns {Promise<Object>} result object logged to ActionLog
   */
  async execute(employee, rule, event) {
    throw new Error(`execute() must be implemented by ${this.constructor.name}`);
  }
}

module.exports = BaseAction;
