const prisma              = require('../database/prisma');
const ConditionEvaluator  = require('./conditions/ConditionEvaluator');
const ActionFactory       = require('./actions/ActionFactory');

/**
 * Rule Engine — Observer / Event-Driven Pattern, Singleton
 *
 * Responsibilities (Single Responsibility):
 *   1. Fetch matching rules for an event type
 *   2. Evaluate each rule's condition (Strategy Pattern via ConditionEvaluator)
 *   3. Execute the matching action (Command via ActionFactory)
 *   4. Persist ActionLog entries
 *
 * Dependency Inversion: depends on ConditionEvaluator & ActionFactory abstractions.
 */
class RuleEngine {
  constructor() {
    this.conditionEvaluator = new ConditionEvaluator();
  }

  async processEvent(event) {
    console.log(`\n🔄 [RuleEngine] Processing event: ${event.type} | id: ${event.id}`);

    const rules = await prisma.rule.findMany({
      where: { eventType: event.type, isActive: true },
      orderBy: { priority: 'asc' },
    });

    if (!rules.length) {
      console.log(`  ℹ️  No active rules for event type: ${event.type}`);
      await this._markEvent(event.id, 'PROCESSED');
      return;
    }

    const payload = event.payload || {};
    let hasFailure = false;

    for (const rule of rules) {
      try {
        const fieldValue = payload[rule.conditionField];
        const conditionMet = this.conditionEvaluator.evaluate(
          rule.conditionOperator, fieldValue, rule.conditionValue
        );

        if (!conditionMet) {
          console.log(`  ⏭  Rule "${rule.name}" skipped (${fieldValue} ${rule.conditionOperator} ${rule.conditionValue} = false)`);
          await this._log(event, rule, 'SKIPPED', {
            reason: `Condition not met: ${fieldValue} ${rule.conditionOperator} ${rule.conditionValue}`,
          });
          continue;
        }

        const employee = event.employeeId
          ? await prisma.employee.findUnique({ where: { id: event.employeeId } })
          : null;

        const action = ActionFactory.create(rule.actionType);
        const result = await action.execute(employee, rule, event);

        console.log(`  ✅ Rule "${rule.name}" → ${rule.actionType} executed`);
        await this._log(event, rule, 'SUCCESS', result);
      } catch (err) {
        hasFailure = true;
        console.error(`  ❌ Rule "${rule.name}" failed:`, err.message);
        await this._log(event, rule, 'FAILED', null, err.message);
      }
    }

    await this._markEvent(event.id, hasFailure ? 'FAILED' : 'PROCESSED');
  }

  async _log(event, rule, status, result = null, error = null) {
    await prisma.actionLog.create({
      data: {
        eventId:    event.id,
        ruleId:     rule.id,
        employeeId: event.employeeId || null,
        actionType: rule.actionType,
        status,
        result:     result || undefined,
        error:      error  || undefined,
      },
    });
  }

  async _markEvent(id, status) {
    await prisma.hREvent.update({
      where: { id },
      data:  { status, processedAt: new Date() },
    });
  }
}

module.exports = new RuleEngine(); // Singleton — shared engine instance
