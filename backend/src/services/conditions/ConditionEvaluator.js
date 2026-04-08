/**
 * Strategy Pattern — Condition Evaluation
 * Each operator is a strategy. New operators added without modifying existing ones.
 * SOLID: Open/Closed Principle
 */
class ConditionEvaluator {
  constructor() {
    this.strategies = {
      lt:  (a, b) => Number(a) < Number(b),
      gt:  (a, b) => Number(a) > Number(b),
      lte: (a, b) => Number(a) <= Number(b),
      gte: (a, b) => Number(a) >= Number(b),
      eq:  (a, b) => Number(a) === Number(b),
      neq: (a, b) => Number(a) !== Number(b),
    };
  }

  evaluate(operator, fieldValue, conditionValue) {
    const strategy = this.strategies[operator];
    if (!strategy) throw new Error(`Unknown operator: ${operator}`);
    if (fieldValue === undefined || fieldValue === null) return false;
    return strategy(fieldValue, conditionValue);
  }

  getOperators() {
    return Object.keys(this.strategies);
  }
}

module.exports = ConditionEvaluator;
