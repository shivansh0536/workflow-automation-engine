/**
 * EventBus — Observer Pattern Implementation
 *
 * Centralized publish-subscribe event bus that decouples event producers
 * (controllers) from event consumers (rule engine, logging, notifications).
 *
 * Design Patterns: Observer, Singleton
 * SOLID: Open/Closed — new subscribers added without modifying producers
 *        Dependency Inversion — controllers depend on EventBus abstraction
 */
const Observer  = require('../patterns/Observer');
const Singleton = require('../patterns/Singleton');
const { createLogger } = require('../utils/logger');

const logger = createLogger('EventBus');

class EventBus extends Singleton {
  constructor() {
    super();
    this._observer = new Observer();
    this._history = [];
    this._maxHistory = 100;
    logger.info('EventBus initialized');
  }

  /**
   * Subscribe to a specific event type.
   * @param {string} eventType - e.g. 'AttendanceMarked', 'LeaveApproved', '*'
   * @param {Function} handler - async function(eventType, eventData)
   * @returns {Function} unsubscribe function
   */
  subscribe(eventType, handler) {
    logger.info(`Subscriber registered for: ${eventType}`);
    return this._observer.on(eventType, handler);
  }

  /**
   * Publish an event to all subscribers.
   * @param {string} eventType
   * @param {Object} eventData
   * @returns {Promise<any[]>}
   */
  async publish(eventType, eventData) {
    logger.info(`Publishing event: ${eventType}`, { eventId: eventData?.id });

    // Record in history
    this._history.push({
      eventType,
      eventData,
      publishedAt: new Date().toISOString(),
    });
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    try {
      const results = await this._observer.emit(eventType, eventData);
      logger.info(`Event ${eventType} processed by ${results.length} subscriber(s)`);
      return results;
    } catch (err) {
      logger.error(`Error processing event ${eventType}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get recent event history.
   * @param {number} [limit=10]
   * @returns {Object[]}
   */
  getHistory(limit = 10) {
    return this._history.slice(-limit);
  }

  /**
   * Get the number of subscribers for an event type.
   * @param {string} eventType
   * @returns {number}
   */
  subscriberCount(eventType) {
    return this._observer.listenerCount(eventType);
  }

  /**
   * List all event types that have subscribers.
   * @returns {string[]}
   */
  getSubscribedEvents() {
    return this._observer.eventNames();
  }

  /**
   * Remove all subscribers (useful for testing).
   */
  reset() {
    this._observer.removeAll();
    this._history = [];
    logger.warn('EventBus reset — all subscribers removed');
  }
}

// Export as Singleton
module.exports = EventBus.getInstance();
