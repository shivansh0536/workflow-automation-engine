/**
 * RuleEngine — Core Event → Condition → Action Processor
 *
 * Enhanced rule engine that integrates all design patterns:
 *   - Singleton: single shared engine instance
 *   - Observer: subscribes to EventBus for event-driven processing
 *   - Strategy: uses RuleEvaluator for condition evaluation
 *   - Repository: uses RuleRepository for data access
 *   - Factory: uses ActionFactory for action instantiation
 *   - Command: actions implement execute() via BaseAction
 *   - Chain of Responsibility: validation pipeline before processing
 *
 * SOLID Principles:
 *   - Single Responsibility: orchestrates the Event→Condition→Action flow
 *   - Open/Closed: new rules, conditions, actions added without modification
 *   - Liskov Substitution: any action subclass works via BaseAction interface
 *   - Interface Segregation: minimal interfaces (evaluate, execute)
 *   - Dependency Inversion: depends on abstractions (evaluator, repository, factory)
 */
const prisma         = require('../database/prisma');
const RuleEvaluator  = require('./RuleEvaluator');
const RuleRepository = require('./RuleRepository');
const ActionFactory  = require('../services/actions/ActionFactory');
const eventBus       = require('./EventBus');
const { createLogger } = require('../utils/logger');
const { Handler, Pipeline } = require('../patterns/ChainOfResponsibility');

const logger = createLogger('RuleEngine');

// ─── Validation Pipeline Handlers (Chain of Responsibility) ─────────────

/**
 * Validates that the event has a valid type.
 */
class EventTypeValidator extends Handler {
  async handle(request) {
    if (!request.event || !request.event.type) {
      throw new Error('Event must have a type');
    }
    logger.debug(`Event type validated: ${request.event.type}`);
    return this.passToNext(request);
  }
}

/**
 * Loads matching rules from the repository.
 */
class RuleLoader extends Handler {
  async handle(request) {
    const rules = await RuleRepository.findActiveByEventType(request.event.type);
    request.rules = rules;
    logger.debug(`Loaded ${rules.length} rule(s) for ${request.event.type}`);
    return this.passToNext(request);
  }
}

/**
 * Loads employee data if employeeId is present.
 */
class EmployeeLoader extends Handler {
  async handle(request) {
    if (request.event.employeeId) {
      request.employee = await prisma.employee.findUnique({
        where: { id: request.event.employeeId },
      });
      logger.debug(`Employee loaded: ${request.employee?.name || 'not found'}`);
    }
    return this.passToNext(request);
  }
}

// ─── RuleEngine Class ───────────────────────────────────────────────────

class RuleEngine {
  constructor() {
    this.evaluator = new RuleEvaluator();
    this._processingCount = 0;
    this._totalProcessed = 0;

    // Build the validation pipeline (Chain of Responsibility)
    this._pipeline = new Pipeline()
      .use(new EventTypeValidator('EventTypeValidator'))
      .use(new RuleLoader('RuleLoader'))
      .use(new EmployeeLoader('EmployeeLoader'));

    // Subscribe to all events via EventBus (Observer Pattern)
    eventBus.subscribe('*', async (_eventType, eventData) => {
      await this.processEvent(eventData);
    });

    logger.info('RuleEngine initialized — subscribed to EventBus');
  }

  /**
   * Process an event through the rule engine pipeline.
   * @param {Object} event - HREvent record
   * @returns {Promise<Object>} processing result
   */
  async processEvent(event) {
    this._processingCount++;
    logger.info(`Processing event: ${event.type} | id: ${event.id}`);

    try {
      // Run the validation and loading pipeline
      const context = await this._pipeline.execute({ event, rules: [], employee: null });

      if (!context.rules.length) {
        logger.info(`No active rules for event type: ${event.type}`);
        await this._markEvent(event.id, 'PROCESSED');
        return { status: 'PROCESSED', rulesMatched: 0, actions: [] };
      }

      // Evaluate and execute each rule
      const results = await this._evaluateRules(context);

      const hasFailure = results.some((r) => r.status === 'FAILED');
      await this._markEvent(event.id, hasFailure ? 'FAILED' : 'PROCESSED');

      this._totalProcessed++;
      return {
        status:       hasFailure ? 'FAILED' : 'PROCESSED',
        rulesMatched: context.rules.length,
        actions:      results,
      };
    } catch (err) {
      logger.error(`Event processing failed: ${err.message}`);
      await this._markEvent(event.id, 'FAILED').catch(() => {});
      throw err;
    } finally {
      this._processingCount--;
    }
  }

  /**
   * Dry-run: test a rule against sample data without persisting.
   * @param {Object} rule - rule object with conditionField, conditionOperator, conditionValue, actionType
   * @param {Object} payload - sample event payload
   * @returns {Object} test result
   */
  dryRun(rule, payload) {
    const fieldValue = payload[rule.conditionField];
    const conditionMet = this.evaluator.evaluate(
      rule.conditionOperator, fieldValue, rule.conditionValue
    );
    return {
      conditionMet,
      fieldValue,
      conditionField:    rule.conditionField,
      conditionOperator: rule.conditionOperator,
      conditionValue:    rule.conditionValue,
      actionType:        rule.actionType,
      wouldExecute:      conditionMet,
      message:           conditionMet
        ? `Condition met: ${fieldValue} ${rule.conditionOperator} ${rule.conditionValue} → ${rule.actionType} would execute`
        : `Condition NOT met: ${fieldValue} ${rule.conditionOperator} ${rule.conditionValue}`,
    };
  }

  /**
   * Evaluate all rules in the context and execute matching actions.
   * @private
   */
  async _evaluateRules(context) {
    const { event, rules, employee } = context;
    const payload = event.payload || {};
    const results = [];

    for (const rule of rules) {
      try {
        const fieldValue = payload[rule.conditionField];
        const conditionMet = this.evaluator.evaluate(
          rule.conditionOperator, fieldValue, rule.conditionValue
        );

        if (!conditionMet) {
          logger.info(`Rule "${rule.name}" skipped — ${fieldValue} ${rule.conditionOperator} ${rule.conditionValue} = false`);
          await this._log(event, rule, 'SKIPPED', {
            reason: `Condition not met: ${fieldValue} ${rule.conditionOperator} ${rule.conditionValue}`,
          });
          results.push({ rule: rule.name, status: 'SKIPPED' });
          continue;
        }

        // Factory + Command pattern: create and execute the action
        const action = ActionFactory.create(rule.actionType);
        const result = await action.execute(employee, rule, event);

        logger.info(`Rule "${rule.name}" → ${rule.actionType} executed successfully`);
        await this._log(event, rule, 'SUCCESS', result);
        results.push({ rule: rule.name, status: 'SUCCESS', result });
      } catch (err) {
        logger.error(`Rule "${rule.name}" failed: ${err.message}`);
        await this._log(event, rule, 'FAILED', null, err.message);
        results.push({ rule: rule.name, status: 'FAILED', error: err.message });
      }
    }

    return results;
  }

  /**
   * Create an ActionLog record.
   * @private
   */
  async _log(event, rule, status, result = null, error = null) {
    await prisma.actionLog.create({
      data: {
        eventId:    event.id,
        ruleId:     rule.id,
        employeeId: event.employeeId || null,
        actionType: rule.actionType,
        status,
        result:     result || undefined,
        error:      error || undefined,
      },
    });
  }

  /**
   * Update event status.
   * @private
   */
  async _markEvent(id, status) {
    await prisma.hREvent.update({
      where: { id },
      data:  { status, processedAt: new Date() },
    });
  }

  /**
   * Get engine statistics.
   * @returns {Object}
   */
  getStats() {
    return {
      currentlyProcessing: this._processingCount,
      totalProcessed:      this._totalProcessed,
      availableActions:    ActionFactory.getAvailableActions(),
      availableOperators:  this.evaluator.getOperators(),
    };
  }
}

// Export as Singleton
const engineInstance = new RuleEngine();
module.exports = engineInstance;
