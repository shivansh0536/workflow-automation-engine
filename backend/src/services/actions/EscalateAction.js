const BaseAction = require('./BaseAction');

/**
 * EscalateAction — Command Pattern
 *
 * Escalates an event to a manager or HR department for review.
 * Used for critical violations, excessive absences, or high-value actions.
 */
class EscalateAction extends BaseAction {
  async execute(employee, rule, event) {
    const escalateTo = rule.actionConfig?.escalateTo || 'HR_MANAGER';
    const urgency = rule.actionConfig?.urgency || 'MEDIUM';
    const notes = rule.actionConfig?.notes || `Automated escalation from rule: "${rule.name}"`;

    console.log(`🚨 ESCALATION [${urgency}] → ${escalateTo}: ${employee?.name || 'System'} — ${notes}`);

    return {
      action: 'Escalate',
      employeeId: employee?.id,
      employeeName: employee?.name,
      escalateTo,
      urgency,
      notes,
      eventType: event.type,
      triggerRule: rule.name,
      status: 'ESCALATED',
      message: `Escalated to ${escalateTo} (${urgency} priority): ${notes}`,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = EscalateAction;
