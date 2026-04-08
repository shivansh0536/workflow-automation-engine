const DeductSalaryAction = require('./DeductSalaryAction');
const AddBonusAction = require('./AddBonusAction');
const SendNotificationAction = require('./SendNotificationAction');
const WarnEmployeeAction = require('./WarnEmployeeAction');
const GenerateCouponAction = require('./GenerateCouponAction');
const AutoApproveLeaveAction = require('./AutoApproveLeaveAction');
const EscalateAction = require('./EscalateAction');

/**
 * Factory Pattern — creates the correct Action object by type.
 * Open/Closed Principle: extend with register() without modifying existing code.
 * Dependency Inversion: callers depend on BaseAction abstraction, not concretes.
 */
class ActionFactory {
  static _registry = {
    DeductSalary: DeductSalaryAction,
    AddBonus: AddBonusAction,
    SendNotification: SendNotificationAction,
    WarnEmployee: WarnEmployeeAction,
    GenerateCoupon: GenerateCouponAction,
    AutoApproveLeave: AutoApproveLeaveAction,
    Escalate: EscalateAction,
  };

  static create(actionType) {
    const Cls = this._registry[actionType];
    if (!Cls) throw new Error(`Unknown action type: "${actionType}". Available: ${Object.keys(this._registry).join(', ')}`);
    return new Cls();
  }

  /** Register new action types at runtime — Open/Closed Principle */
  static register(type, ActionClass) {
    this._registry[type] = ActionClass;
  }

  static getAvailableActions() {
    return Object.keys(this._registry);
  }
}

module.exports = ActionFactory;
