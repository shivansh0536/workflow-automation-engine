/**
 * Observer Pattern (Publish-Subscribe)
 *
 * Defines a one-to-many dependency so that when one object (subject)
 * changes state, all dependents (observers) are notified automatically.
 *
 * Used by: EventBus — decouples event producers from rule processing.
 *
 * SOLID Principle:
 *   - Open/Closed: new observers added without modifying the subject.
 *   - Dependency Inversion: subject depends on observer abstraction, not concretes.
 */
class Observer {
  constructor() {
    /** @type {Map<string, Function[]>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} eventName
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Observer callback must be a function');
    }
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, []);
    }
    this._listeners.get(eventName).push(callback);

    // Return an unsubscribe function for convenience
    return () => this.off(eventName, callback);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} eventName
   * @param {Function} callback
   */
  off(eventName, callback) {
    const listeners = this._listeners.get(eventName);
    if (!listeners) return;
    this._listeners.set(
      eventName,
      listeners.filter((fn) => fn !== callback)
    );
  }

  /**
   * Emit an event to all registered listeners.
   * @param {string} eventName
   * @param  {...any} args
   * @returns {Promise<any[]>} results from all listeners
   */
  async emit(eventName, ...args) {
    const listeners = this._listeners.get(eventName) || [];
    const wildcardListeners = this._listeners.get('*') || [];
    const all = [...listeners, ...wildcardListeners];

    const results = [];
    for (const fn of all) {
      results.push(await fn(eventName, ...args));
    }
    return results;
  }

  /**
   * List all registered event names.
   * @returns {string[]}
   */
  eventNames() {
    return [...this._listeners.keys()];
  }

  /**
   * Count listeners for a specific event.
   * @param {string} eventName
   * @returns {number}
   */
  listenerCount(eventName) {
    return (this._listeners.get(eventName) || []).length;
  }

  /**
   * Remove all listeners (optionally for a specific event).
   * @param {string} [eventName]
   */
  removeAll(eventName) {
    if (eventName) {
      this._listeners.delete(eventName);
    } else {
      this._listeners.clear();
    }
  }
}

module.exports = Observer;
