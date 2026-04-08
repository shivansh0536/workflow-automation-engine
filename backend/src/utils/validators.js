/**
 * Input Validation Helpers
 *
 * Centralized validation logic for rules, events, employees, etc.
 * Follows Single Responsibility — each validator handles one entity.
 */

/**
 * Validate rule creation/update payload.
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRule(data) {
  const errors = [];
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  }
  if (!data.eventType || typeof data.eventType !== 'string') {
    errors.push('eventType is required');
  }
  if (!data.conditionField || typeof data.conditionField !== 'string') {
    errors.push('conditionField is required');
  }
  if (!data.conditionOperator || typeof data.conditionOperator !== 'string') {
    errors.push('conditionOperator is required');
  }
  const validOperators = ['lt', 'gt', 'lte', 'gte', 'eq', 'neq', 'contains', 'startsWith', 'in'];
  if (data.conditionOperator && !validOperators.includes(data.conditionOperator)) {
    errors.push(`conditionOperator must be one of: ${validOperators.join(', ')}`);
  }
  if (data.conditionValue === undefined || data.conditionValue === null) {
    errors.push('conditionValue is required');
  }
  if (!data.actionType || typeof data.actionType !== 'string') {
    errors.push('actionType is required');
  }
  if (data.priority !== undefined && (typeof data.priority !== 'number' || data.priority < 1)) {
    errors.push('priority must be a positive number');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate event trigger payload.
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateEvent(data) {
  const errors = [];
  if (!data.type || typeof data.type !== 'string') {
    errors.push('type is required');
  }
  if (data.payload && typeof data.payload !== 'object') {
    errors.push('payload must be an object');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate employee creation payload.
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateEmployee(data) {
  const errors = [];
  if (!data.name || typeof data.name !== 'string') errors.push('name is required');
  if (!data.email || typeof data.email !== 'string') errors.push('email is required');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('email must be a valid email address');
  }
  if (!data.department) errors.push('department is required');
  if (!data.role) errors.push('role is required');
  if (!data.baseSalary || isNaN(Number(data.baseSalary)) || Number(data.baseSalary) <= 0) {
    errors.push('baseSalary must be a positive number');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate attendance payload.
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateAttendance(data) {
  const errors = [];
  if (!data.employeeId) errors.push('employeeId is required');
  if (!data.date) errors.push('date is required');
  if (data.date && isNaN(Date.parse(data.date))) errors.push('date must be a valid date');
  const validStatuses = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate leave request payload.
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLeave(data) {
  const errors = [];
  if (!data.employeeId) errors.push('employeeId is required');
  if (!data.type) errors.push('type is required');
  if (!data.fromDate) errors.push('fromDate is required');
  if (!data.toDate) errors.push('toDate is required');
  if (data.fromDate && data.toDate && new Date(data.fromDate) > new Date(data.toDate)) {
    errors.push('fromDate must be before toDate');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateRule,
  validateEvent,
  validateEmployee,
  validateAttendance,
  validateLeave,
};
