const BaseAction = require('./BaseAction');

class SendNotificationAction extends BaseAction {
  async execute(employee, rule, event) {
    const msg = rule.actionConfig?.message || `Automated alert from rule: "${rule.name}"`;
    const channel = rule.actionConfig?.channel || 'email';
    console.log(`📧 NOTIFICATION [${channel.toUpperCase()}] → ${employee?.name || 'System'}: ${msg}`);
    return {
      action: 'SendNotification',
      employeeId: employee?.id,
      employeeName: employee?.name,
      message: msg,
      channel,
      sent: true,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = SendNotificationAction;
