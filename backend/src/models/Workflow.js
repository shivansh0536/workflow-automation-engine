/**
 * Workflow Domain Model
 *
 * Encapsulates workflow business logic, step management, and status transitions.
 *
 * OOP Principles:
 *   - Encapsulation: step ordering and status transitions are internal
 *   - Single Responsibility: workflow domain logic only
 */

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
const VALID_STEP_TYPES = ['delay', 'http_request', 'email', 'condition', 'transform', 'webhook'];

class WorkflowModel {
  /**
   * @param {Object} data - raw workflow data
   */
  constructor(data = {}) {
    this.id          = data.id || null;
    this.name        = data.name || '';
    this.description = data.description || '';
    this.status      = data.status || 'INACTIVE';
    this.trigger     = data.trigger || '';
    this.steps       = (data.steps || []).map((s, i) => ({
      id:     s.id || null,
      name:   s.name || `Step ${i + 1}`,
      type:   s.type || 'delay',
      config: s.config || {},
      order:  s.order || i + 1,
    }));
    this.createdAt = data.createdAt ? new Date(data.createdAt) : null;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
  }

  /**
   * Check if the workflow is active.
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'ACTIVE';
  }

  /**
   * Activate the workflow (state transition).
   * @throws {Error} if workflow has no steps
   */
  activate() {
    if (this.steps.length === 0) {
      throw new Error('Cannot activate a workflow with no steps');
    }
    this.status = 'ACTIVE';
  }

  /**
   * Deactivate the workflow.
   */
  deactivate() {
    this.status = 'INACTIVE';
  }

  /**
   * Archive the workflow.
   */
  archive() {
    this.status = 'ARCHIVED';
  }

  /**
   * Get steps sorted by execution order.
   * @returns {Object[]}
   */
  getOrderedSteps() {
    return [...this.steps].sort((a, b) => a.order - b.order);
  }

  /**
   * Get the total number of steps.
   * @returns {number}
   */
  getStepCount() {
    return this.steps.length;
  }

  /**
   * Add a step to the workflow.
   * @param {Object} step
   */
  addStep(step) {
    const order = this.steps.length + 1;
    this.steps.push({
      id:     step.id || null,
      name:   step.name || `Step ${order}`,
      type:   step.type || 'delay',
      config: step.config || {},
      order,
    });
  }

  /**
   * Validate the workflow for completeness.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];
    if (!this.name) errors.push('Workflow name is required');
    if (!this.trigger) errors.push('Trigger is required');
    if (!VALID_STATUSES.includes(this.status)) {
      errors.push(`Invalid status: ${this.status}`);
    }
    for (const step of this.steps) {
      if (!step.name) errors.push(`Step at order ${step.order} requires a name`);
      if (!VALID_STEP_TYPES.includes(step.type)) {
        errors.push(`Invalid step type: ${step.type}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Get a human-readable summary.
   * @returns {string}
   */
  summarize() {
    return `[${this.status}] "${this.name}" — ${this.steps.length} step(s), trigger: ${this.trigger}`;
  }

  /**
   * Serialize to plain object.
   * @returns {Object}
   */
  toJSON() {
    return {
      id:          this.id,
      name:        this.name,
      description: this.description,
      status:      this.status,
      trigger:     this.trigger,
      steps:       this.steps,
      createdAt:   this.createdAt,
      updatedAt:   this.updatedAt,
    };
  }

  /**
   * Create a WorkflowModel from a Prisma record.
   * @param {Object} prismaRecord
   * @returns {WorkflowModel}
   */
  static fromPrisma(prismaRecord) {
    return new WorkflowModel(prismaRecord);
  }
}

module.exports = WorkflowModel;
