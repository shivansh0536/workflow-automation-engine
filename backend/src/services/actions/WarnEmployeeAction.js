const BaseAction = require('./BaseAction');

class WarnEmployeeAction extends BaseAction {
  async execute(employee, rule, event) {
    const reason = rule.actionConfig?.reason || `Policy violation: ${rule.name}`;
    const warningType = rule.actionConfig?.warningType || 'WRITTEN';
    console.log(`⚠️  WARNING [${warningType}] → ${employee?.name}: ${reason}`);
    return {
      action: 'WarnEmployee',
      employeeId: employee?.id,
      employeeName: employee?.name,
      warningType,
      reason,
      message: `Warning issued to ${employee?.name || 'Employee'}: ${reason}`,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = WarnEmployeeAction;
