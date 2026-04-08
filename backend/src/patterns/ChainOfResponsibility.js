/**
 * Chain of Responsibility Pattern
 *
 * Passes a request along a chain of handlers. Each handler decides
 * whether to process the request or pass it to the next handler.
 *
 * Used by: Rule validation pipeline, request processing middleware.
 *
 * SOLID Principles:
 *   - Single Responsibility: each handler handles one concern.
 *   - Open/Closed: new handlers added without modifying existing chain.
 */

/**
 * Abstract Handler — base class for the chain.
 */
class Handler {
  constructor(name) {
    /** @type {string} */
    this.name = name || this.constructor.name;
    /** @type {Handler|null} */
    this._next = null;
  }

  /**
   * Set the next handler in the chain.
   * @param {Handler} handler
   * @returns {Handler} the next handler (for fluent chaining)
   */
  setNext(handler) {
    this._next = handler;
    return handler;
  }

  /**
   * Process the request. Override in subclasses.
   * Call this.passToNext(request) to continue the chain.
   * @param {Object} request
   * @returns {Promise<Object>} processed request or result
   */
  async handle(request) {
    return this.passToNext(request);
  }

  /**
   * Pass the request to the next handler in the chain.
   * @param {Object} request
   * @returns {Promise<Object>}
   */
  async passToNext(request) {
    if (this._next) {
      return this._next.handle(request);
    }
    return request; // End of chain — return the request as-is
  }
}

/**
 * Pipeline — builds and executes a chain of handlers in sequence.
 * Convenience wrapper around Handler.setNext().
 */
class Pipeline {
  constructor() {
    /** @type {Handler[]} */
    this._handlers = [];
  }

  /**
   * Add a handler to the pipeline.
   * @param {Handler} handler
   * @returns {Pipeline} this (fluent)
   */
  use(handler) {
    this._handlers.push(handler);
    return this;
  }

  /**
   * Execute the pipeline on a request.
   * @param {Object} request
   * @returns {Promise<Object>}
   */
  async execute(request) {
    if (this._handlers.length === 0) return request;

    // Link handlers into a chain
    for (let i = 0; i < this._handlers.length - 1; i++) {
      this._handlers[i].setNext(this._handlers[i + 1]);
    }

    return this._handlers[0].handle(request);
  }
}

module.exports = { Handler, Pipeline };
