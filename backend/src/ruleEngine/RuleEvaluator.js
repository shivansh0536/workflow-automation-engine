/**
 * RuleEvaluator — Enhanced Strategy Pattern
 *
 * Extended condition evaluator supporting:
 *   - Numeric comparisons (lt, gt, lte, gte, eq, neq)
 *   - String operations (contains, startsWith, in)
 *   - Compound conditions (AND, OR)
 *
 * Design Patterns: Strategy (each operator is a strategy)
 * SOLID: Open/Closed — register new operators without modifying existing code
 */
const { StrategyContext } = require('../patterns/Strategy');
const { createLogger }    = require('../utils/logger');

const logger = createLogger('RuleEvaluator');

class RuleEvaluator {
  constructor() {
    this._context = new StrategyContext();
    this._registerDefaults();
  }

  /**
   * Register all built-in comparison strategies.
   * @private
   */
  _registerDefaults() {
    // ─── Numeric Comparisons ────────────────────────────────────
    this._context.register('lt',  (a, b) => Number(a) < Number(b));
    this._context.register('gt',  (a, b) => Number(a) > Number(b));
    this._context.register('lte', (a, b) => Number(a) <= Number(b));
    this._context.register('gte', (a, b) => Number(a) >= Number(b));
    this._context.register('eq',  (a, b) => Number(a) === Number(b));
    this._context.register('neq', (a, b) => Number(a) !== Number(b));

    // ─── String Comparisons ─────────────────────────────────────
    this._context.register('contains',   (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()));
    this._context.register('startsWith', (a, b) => String(a).toLowerCase().startsWith(String(b).toLowerCase()));
    this._context.register('in',         (a, b) => {
      const list = Array.isArray(b) ? b : String(b).split(',').map(s => s.trim());
      return list.includes(String(a));
    });
  }

  /**
   * Evaluate a single condition.
   * @param {string} operator - comparison operator name
   * @param {*} fieldValue - the actual field value from event payload
   * @param {*} conditionValue - the expected value from the rule
   * @returns {boolean}
   */
  evaluate(operator, fieldValue, conditionValue) {
    if (fieldValue === undefined || fieldValue === null) {
      logger.debug(`Field value is null/undefined — condition not met`);
      return false;
    }

    if (!this._context.has(operator)) {
      throw new Error(`Unknown operator: "${operator}". Available: ${this.getOperators().join(', ')}`);
    }

    const result = this._context.execute(operator, fieldValue, conditionValue);
    logger.debug(`Evaluate: ${fieldValue} ${operator} ${conditionValue} = ${result}`);
    return result;
  }

  /**
   * Evaluate compound conditions (AND).
   * All conditions must be true.
   * @param {Array<{field: string, operator: string, value: *}>} conditions
   * @param {Object} payload - event payload
   * @returns {boolean}
   */
  evaluateAll(conditions, payload) {
    return conditions.every(({ field, operator, value }) =>
      this.evaluate(operator, payload[field], value)
    );
  }

  /**
   * Evaluate compound conditions (OR).
   * At least one condition must be true.
   * @param {Array<{field: string, operator: string, value: *}>} conditions
   * @param {Object} payload - event payload
   * @returns {boolean}
   */
  evaluateAny(conditions, payload) {
    return conditions.some(({ field, operator, value }) =>
      this.evaluate(operator, payload[field], value)
    );
  }

  /**
   * Register a custom operator (strategy).
   * @param {string} name
   * @param {Function} fn - (fieldValue, conditionValue) => boolean
   */
  registerOperator(name, fn) {
    this._context.register(name, fn);
    logger.info(`Registered custom operator: ${name}`);
  }

  /**
   * List all available operators.
   * @returns {string[]}
   */
  getOperators() {
    return this._context.list();
  }
}

module.exports = RuleEvaluator;
