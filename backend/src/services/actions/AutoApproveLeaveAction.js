const BaseAction = require('./BaseAction');

/**
 * AutoApproveLeaveAction — Command Pattern
 *
 * Automatically approves leave requests when conditions are met
 * (e.g., employee has enough leave balance, leave duration is within limits).
 */
class AutoApproveLeaveAction extends BaseAction {
  async execute(employee, rule, event) {
    const maxDays = rule.actionConfig?.maxDays || 3;
    const leaveType = event.payload?.leave_type || 'CASUAL';
    const days = event.payload?.days || 1;

    const autoApproved = days <= maxDays;
    const status = autoApproved ? 'AUTO_APPROVED' : 'REQUIRES_MANUAL_APPROVAL';

    console.log(`📋 LEAVE ${status} → ${employee?.name}: ${days} day(s) ${leaveType}`);

    return {
      action: 'AutoApproveLeave',
      employeeId: employee?.id,
      employeeName: employee?.name,
      leaveType,
      requestedDays: days,
      maxAutoApproveDays: maxDays,
      status,
      autoApproved,
      reason: autoApproved
        ? `Leave auto-approved: ${days} day(s) within ${maxDays}-day limit`
        : `Leave requires manual approval: ${days} day(s) exceeds ${maxDays}-day limit`,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = AutoApproveLeaveAction;
