const BaseAction = require('./BaseAction');

class GenerateCouponAction extends BaseAction {
  async execute(employee, rule, event) {
    const code = `COUP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const couponType = rule.actionConfig?.couponType || 'FOOD';
    const value = rule.actionConfig?.value || 100;
    console.log(`🎫 COUPON [${couponType}] ₹${value} → ${employee?.name}: ${code}`);
    return {
      action: 'GenerateCoupon',
      employeeId: employee?.id,
      employeeName: employee?.name,
      couponCode: code,
      couponType,
      value,
      reason: rule.name,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = GenerateCouponAction;
