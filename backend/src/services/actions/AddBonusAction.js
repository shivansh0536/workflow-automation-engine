const BaseAction = require('./BaseAction');

class AddBonusAction extends BaseAction {
  async execute(employee, rule, event) {
    if (!employee) throw new Error('Employee required for AddBonus');
    const pct = rule.actionConfig?.percentage || 5;
    const amount = (employee.baseSalary * pct) / 100;
    return {
      action: 'AddBonus',
      employeeId: employee.id,
      employeeName: employee.name,
      baseSalary: employee.baseSalary,
      bonusPercent: pct,
      bonusAmount: amount,
      totalPay: employee.baseSalary + amount,
      reason: rule.name,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = AddBonusAction;
