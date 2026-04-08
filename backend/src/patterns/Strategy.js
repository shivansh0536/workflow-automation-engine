/**
 * Strategy Pattern
 *
 * Defines a family of algorithms, encapsulates each one, and makes them
 * interchangeable. Lets the algorithm vary independently from clients.
 *
 * Used by: ConditionEvaluator / RuleEvaluator — each comparison operator
 *          is a Strategy that can be swapped or extended at runtime.
 *
 * SOLID Principles:
 *   - Open/Closed: add new strategies without modifying existing code.
 *   - Single Responsibility: each strategy handles one algorithm.
 *   - Liskov Substitution: any strategy is interchangeable.
 */

/**
 * Abstract Strategy base class.
 * Concrete strategies must implement the execute() method.
 */
class Strategy {
  /**
   * @param {string} name - human-readable name of the strategy
   */
  constructor(name) {
    if (new.target === Strategy) {
      throw new Error('Strategy is abstract — instantiate a concrete subclass');
    }
    this.name = name;
  }

  /**
   * Execute the strategy algorithm.
   * @param  {...any} args
   * @returns {any}
   */
  execute(...args) {
    throw new Error(`execute() must be implemented by ${this.constructor.name}`);
  }
}

/**
 * StrategyContext holds a reference to a Strategy object and delegates work.
 */
class StrategyContext {
  constructor() {
    /** @type {Map<string, Strategy>} */
    this._strategies = new Map();
  }

  /**
   * Register a named strategy.
   * @param {string} name
   * @param {Strategy|Function} strategy
   */
  register(name, strategy) {
    this._strategies.set(name, strategy);
  }

  /**
   * Execute a named strategy.
   * @param {string} name
   * @param  {...any} args
   * @returns {any}
   */
  execute(name, ...args) {
    const strategy = this._strategies.get(name);
    if (!strategy) {
      throw new Error(`Unknown strategy: "${name}". Available: ${[...this._strategies.keys()].join(', ')}`);
    }
    // Support both class-based (execute method) and function-based strategies
    return typeof strategy === 'function' ? strategy(...args) : strategy.execute(...args);
  }

  /**
   * Check if a strategy is registered.
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._strategies.has(name);
  }

  /**
   * List all registered strategy names.
   * @returns {string[]}
   */
  list() {
    return [...this._strategies.keys()];
  }
}

module.exports = { Strategy, StrategyContext };
