/**
 * Event Domain Model
 *
 * Wraps HREvent data with helper methods for payload access and lifecycle.
 *
 * OOP Principles:
 *   - Encapsulation: payload parsing is internal
 *   - Single Responsibility: event domain logic only
 */

const EVENT_TYPES = Object.freeze([
  'AttendanceMarked',
  'LeaveApproved',
  'LeaveRejected',
  'OvertimeRecorded',
  'ShiftCompleted',
  'TaskOverdue',
  'TaskCompleted',
  'SalaryCalculated',
  'LateEntry',
]);

class EventModel {
  /**
   * @param {Object} data - raw event data
   */
  constructor(data = {}) {
    this.id          = data.id || null;
    this.type        = data.type || '';
    this.employeeId  = data.employeeId || null;
    this.payload     = data.payload || {};
    this.status      = data.status || 'PENDING';
    this.processedAt = data.processedAt ? new Date(data.processedAt) : null;
    this.createdAt   = data.createdAt ? new Date(data.createdAt) : null;
  }

  /**
   * Check if the event type is valid.
   * @returns {boolean}
   */
  isValidType() {
    return EVENT_TYPES.includes(this.type);
  }

  /**
   * Retrieve a specific field from the payload.
   * @param {string} field
   * @param {*} defaultValue
   * @returns {*}
   */
  getPayloadField(field, defaultValue = null) {
    return this.payload[field] !== undefined ? this.payload[field] : defaultValue;
  }

  /**
   * Check if this event has been processed.
   * @returns {boolean}
   */
  isProcessed() {
    return this.status === 'PROCESSED';
  }

  /**
   * Check if this event failed processing.
   * @returns {boolean}
   */
  isFailed() {
    return this.status === 'FAILED';
  }

  /**
   * Check if this event is pending processing.
   * @returns {boolean}
   */
  isPending() {
    return this.status === 'PENDING';
  }

  /**
   * Get a human-readable summary.
   * @returns {string}
   */
  summarize() {
    const emp = this.employeeId ? ` (employee: ${this.employeeId})` : '';
    return `[${this.status}] ${this.type}${emp} — ${JSON.stringify(this.payload)}`;
  }

  /**
   * Validate the event for completeness.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];
    if (!this.type) errors.push('Event type is required');
    if (!this.isValidType()) errors.push(`Invalid event type: ${this.type}`);
    return { valid: errors.length === 0, errors };
  }

  /**
   * Serialize to plain object.
   * @returns {Object}
   */
  toJSON() {
    return {
      id:          this.id,
      type:        this.type,
      employeeId:  this.employeeId,
      payload:     this.payload,
      status:      this.status,
      processedAt: this.processedAt,
      createdAt:   this.createdAt,
    };
  }

  /**
   * Create an EventModel from a Prisma record.
   * @param {Object} prismaRecord
   * @returns {EventModel}
   */
  static fromPrisma(prismaRecord) {
    return new EventModel(prismaRecord);
  }

  /**
   * List all valid event types.
   * @returns {string[]}
   */
  static getValidTypes() {
    return [...EVENT_TYPES];
  }
}

module.exports = EventModel;
