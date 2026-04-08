/**
 * Rule Engine Unit Tests
 *
 * Tests the core rule engine components:
 *   - ConditionEvaluator / RuleEvaluator
 *   - ActionFactory
 *   - Observer / EventBus patterns
 *   - Domain Models
 */

const assert = require('assert');

// ─── Test Helper ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function summary() {
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n🧪 Rule Engine Tests\n');

// ─── 1. ConditionEvaluator Tests ─────────────────────────────────────────
console.log('── ConditionEvaluator ──');

const ConditionEvaluator = require('../backend/src/services/conditions/ConditionEvaluator');
const evaluator = new ConditionEvaluator();

test('lt: 5 < 10 should be true', () => {
  assert.strictEqual(evaluator.evaluate('lt', 5, 10), true);
});

test('lt: 10 < 5 should be false', () => {
  assert.strictEqual(evaluator.evaluate('lt', 10, 5), false);
});

test('gt: 10 > 5 should be true', () => {
  assert.strictEqual(evaluator.evaluate('gt', 10, 5), true);
});

test('gte: 10 >= 10 should be true', () => {
  assert.strictEqual(evaluator.evaluate('gte', 10, 10), true);
});

test('eq: 5 === 5 should be true', () => {
  assert.strictEqual(evaluator.evaluate('eq', 5, 5), true);
});

test('neq: 5 !== 10 should be true', () => {
  assert.strictEqual(evaluator.evaluate('neq', 5, 10), true);
});

test('null value should return false', () => {
  assert.strictEqual(evaluator.evaluate('gt', null, 5), false);
});

test('undefined value should return false', () => {
  assert.strictEqual(evaluator.evaluate('gt', undefined, 5), false);
});

test('unknown operator should throw', () => {
  assert.throws(() => evaluator.evaluate('unknown', 5, 5), /Unknown operator/);
});

test('getOperators returns all operators', () => {
  const ops = evaluator.getOperators();
  assert.ok(ops.includes('lt'));
  assert.ok(ops.includes('gt'));
  assert.ok(ops.includes('eq'));
  assert.strictEqual(ops.length, 6);
});

// ─── 2. RuleEvaluator Tests (Extended Strategy) ─────────────────────────
console.log('\n── RuleEvaluator (Extended) ──');

const RuleEvaluator = require('../backend/src/ruleEngine/RuleEvaluator');
const ruleEvaluator = new RuleEvaluator();

test('contains: "hello world" contains "world" should be true', () => {
  assert.strictEqual(ruleEvaluator.evaluate('contains', 'hello world', 'world'), true);
});

test('startsWith: "hello" starts with "hel" should be true', () => {
  assert.strictEqual(ruleEvaluator.evaluate('startsWith', 'hello', 'hel'), true);
});

test('in: "CASUAL" in ["CASUAL","SICK"] should be true', () => {
  assert.strictEqual(ruleEvaluator.evaluate('in', 'CASUAL', ['CASUAL', 'SICK']), true);
});

test('evaluateAll: AND conditions all true', () => {
  const conditions = [
    { field: 'hours', operator: 'gt', value: 8 },
    { field: 'days', operator: 'gte', value: 20 },
  ];
  assert.strictEqual(ruleEvaluator.evaluateAll(conditions, { hours: 10, days: 22 }), true);
});

test('evaluateAll: AND conditions one false', () => {
  const conditions = [
    { field: 'hours', operator: 'gt', value: 8 },
    { field: 'days', operator: 'gte', value: 20 },
  ];
  assert.strictEqual(ruleEvaluator.evaluateAll(conditions, { hours: 10, days: 15 }), false);
});

test('evaluateAny: OR conditions one true', () => {
  const conditions = [
    { field: 'hours', operator: 'gt', value: 20 },
    { field: 'days', operator: 'gte', value: 20 },
  ];
  assert.strictEqual(ruleEvaluator.evaluateAny(conditions, { hours: 5, days: 22 }), true);
});

test('registerOperator: custom operator works', () => {
  ruleEvaluator.registerOperator('mod', (a, b) => Number(a) % Number(b) === 0);
  assert.strictEqual(ruleEvaluator.evaluate('mod', 10, 5), true);
  assert.strictEqual(ruleEvaluator.evaluate('mod', 10, 3), false);
});

// ─── 3. ActionFactory Tests ──────────────────────────────────────────────
console.log('\n── ActionFactory ──');

const ActionFactory = require('../backend/src/services/actions/ActionFactory');

test('create DeductSalary action', () => {
  const action = ActionFactory.create('DeductSalary');
  assert.ok(action);
  assert.strictEqual(typeof action.execute, 'function');
});

test('create AddBonus action', () => {
  const action = ActionFactory.create('AddBonus');
  assert.ok(action);
});

test('create SendNotification action', () => {
  const action = ActionFactory.create('SendNotification');
  assert.ok(action);
});

test('create AutoApproveLeave action', () => {
  const action = ActionFactory.create('AutoApproveLeave');
  assert.ok(action);
});

test('create Escalate action', () => {
  const action = ActionFactory.create('Escalate');
  assert.ok(action);
});

test('unknown action type throws', () => {
  assert.throws(() => ActionFactory.create('NonExistent'), /Unknown action type/);
});

test('getAvailableActions returns all 7 types', () => {
  const actions = ActionFactory.getAvailableActions();
  assert.strictEqual(actions.length, 7);
  assert.ok(actions.includes('DeductSalary'));
  assert.ok(actions.includes('AutoApproveLeave'));
  assert.ok(actions.includes('Escalate'));
});

test('register new action at runtime', () => {
  const BaseAction = require('../backend/src/services/actions/BaseAction');
  class TestAction extends BaseAction {
    async execute() { return { test: true }; }
  }
  ActionFactory.register('TestAction', TestAction);
  const action = ActionFactory.create('TestAction');
  assert.ok(action);
});

// ─── 4. Observer Pattern Tests ───────────────────────────────────────────
console.log('\n── Observer Pattern ──');

const Observer = require('../backend/src/patterns/Observer');

test('subscribe and emit event', async () => {
  const obs = new Observer();
  let received = false;
  obs.on('test', () => { received = true; });
  await obs.emit('test');
  assert.strictEqual(received, true);
});

test('unsubscribe works', async () => {
  const obs = new Observer();
  let count = 0;
  const unsub = obs.on('test', () => { count++; });
  await obs.emit('test');
  unsub();
  await obs.emit('test');
  assert.strictEqual(count, 1);
});

test('wildcard listener receives all events', async () => {
  const obs = new Observer();
  const events = [];
  obs.on('*', (name) => { events.push(name); });
  await obs.emit('alpha');
  await obs.emit('beta');
  assert.deepStrictEqual(events, ['alpha', 'beta']);
});

test('listenerCount returns correct count', () => {
  const obs = new Observer();
  obs.on('test', () => {});
  obs.on('test', () => {});
  assert.strictEqual(obs.listenerCount('test'), 2);
});

// ─── 5. Domain Model Tests ──────────────────────────────────────────────
console.log('\n── Domain Models ──');

const RuleModel = require('../backend/src/models/Rule');
const EventModel = require('../backend/src/models/Event');
const WorkflowModel = require('../backend/src/models/Workflow');

test('RuleModel validates correctly', () => {
  const rule = new RuleModel({ name: 'Test', eventType: 'AttendanceMarked', conditionField: 'days', conditionOperator: 'gt', conditionValue: 5, actionType: 'AddBonus' });
  const { valid } = rule.validate();
  assert.strictEqual(valid, true);
});

test('RuleModel reports errors for incomplete rule', () => {
  const rule = new RuleModel({});
  const { valid, errors } = rule.validate();
  assert.strictEqual(valid, false);
  assert.ok(errors.length > 0);
});

test('RuleModel matchesEventType works', () => {
  const rule = new RuleModel({ eventType: 'AttendanceMarked', isActive: true });
  assert.strictEqual(rule.matchesEventType('AttendanceMarked'), true);
  assert.strictEqual(rule.matchesEventType('LeaveApproved'), false);
});

test('EventModel validates correctly', () => {
  const event = new EventModel({ type: 'AttendanceMarked' });
  const { valid } = event.validate();
  assert.strictEqual(valid, true);
});

test('EventModel getPayloadField returns value', () => {
  const event = new EventModel({ payload: { days: 22 } });
  assert.strictEqual(event.getPayloadField('days'), 22);
  assert.strictEqual(event.getPayloadField('missing', 0), 0);
});

test('EventModel.getValidTypes returns all types', () => {
  const types = EventModel.getValidTypes();
  assert.ok(types.includes('AttendanceMarked'));
  assert.ok(types.includes('LeaveApproved'));
  assert.strictEqual(types.length, 9);
});

test('WorkflowModel activate fails with no steps', () => {
  const wf = new WorkflowModel({ name: 'Test', trigger: 'manual' });
  assert.throws(() => wf.activate(), /Cannot activate/);
});

test('WorkflowModel activate succeeds with steps', () => {
  const wf = new WorkflowModel({ name: 'Test', trigger: 'manual', steps: [{ name: 'Step 1', type: 'delay' }] });
  wf.activate();
  assert.strictEqual(wf.isActive(), true);
});

// ─── 6. Singleton Pattern Tests ──────────────────────────────────────────
console.log('\n── Singleton Pattern ──');

const Singleton = require('../backend/src/patterns/Singleton');

test('Singleton returns same instance', () => {
  class MyService extends Singleton {
    constructor() { super(); this.id = Math.random(); }
  }
  const a = MyService.getInstance();
  const b = MyService.getInstance();
  assert.strictEqual(a.id, b.id);
  MyService.resetInstance();
});

// ─── 7. Strategy Pattern Tests ───────────────────────────────────────────
console.log('\n── Strategy Pattern ──');

const { StrategyContext } = require('../backend/src/patterns/Strategy');

test('StrategyContext executes registered strategy', () => {
  const ctx = new StrategyContext();
  ctx.register('double', (x) => x * 2);
  assert.strictEqual(ctx.execute('double', 5), 10);
});

test('StrategyContext throws for unknown strategy', () => {
  const ctx = new StrategyContext();
  assert.throws(() => ctx.execute('unknown'), /Unknown strategy/);
});

// ─── 8. Chain of Responsibility Tests ────────────────────────────────────
console.log('\n── Chain of Responsibility ──');

const { Handler, Pipeline } = require('../backend/src/patterns/ChainOfResponsibility');

test('Pipeline executes handlers in order', async () => {
  class AddA extends Handler {
    async handle(req) { req.result = (req.result || '') + 'A'; return this.passToNext(req); }
  }
  class AddB extends Handler {
    async handle(req) { req.result = (req.result || '') + 'B'; return this.passToNext(req); }
  }
  const pipeline = new Pipeline().use(new AddA()).use(new AddB());
  const result = await pipeline.execute({});
  assert.strictEqual(result.result, 'AB');
});

// ═══════════════════════════════════════════════════════════════════════════
summary();
