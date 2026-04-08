const BaseAction = require('./BaseAction');

class DeductSalaryAction extends BaseAction {
  async execute(employee, rule, event) {
    if (!employee) throw new Error('Employee required for DeductSalary');
    const pct = rule.actionConfig?.percentage || 10;
    const amount = (employee.baseSalary * pct) / 100;
    return {
      action: 'DeductSalary',
      employeeId: employee.id,
      employeeName: employee.name,
      baseSalary: employee.baseSalary,
      deductionPercent: pct,
      deductionAmount: amount,
      netSalary: employee.baseSalary - amount,
      reason: rule.name,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = DeductSalaryAction;
