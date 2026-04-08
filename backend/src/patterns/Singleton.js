/**
 * Singleton Pattern
 *
 * Ensures a class has only one instance and provides a global point of access.
 * Used by: RuleEngine, EventBus, Logger
 *
 * SOLID Principle: Single Responsibility — manages its own instantiation.
 */
class Singleton {
  /**
   * Returns the single instance of the derived class.
   * If no instance exists, one is created with the supplied arguments.
   * @param  {...any} args - constructor arguments (used only on first call)
   * @returns {Singleton}
   */
  static getInstance(...args) {
    if (!this._instance) {
      this._instance = new this(...args);
    }
    return this._instance;
  }

  /**
   * Reset the instance (useful for testing).
   */
  static resetInstance() {
    this._instance = null;
  }
}

module.exports = Singleton;
