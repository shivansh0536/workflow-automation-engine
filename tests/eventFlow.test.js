/**
 * Event Flow Integration Tests
 *
 * Tests the end-to-end event flow via the API (requires running backend).
 * Run: node tests/eventFlow.test.js
 * Prerequisite: Backend running on http://localhost:4000
 */

const BASE = 'http://localhost:4000';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n🧪 Event Flow Integration Tests\n');

(async () => {
  // ─── 1. Health Check ───────────────────────────────────────────────────
  console.log('── Health ──');

  await test('Health endpoint returns ok', async () => {
    const { status, data } = await api('GET', '/health');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'ok', 'Expected status ok');
  });

  // ─── 2. Dashboard ─────────────────────────────────────────────────────
  console.log('\n── Dashboard ──');

  await test('Dashboard stats returns data', async () => {
    const { status, data } = await api('GET', '/api/dashboard/stats');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.employees !== undefined, 'Missing employees field');
    assert(data.rules !== undefined, 'Missing rules field');
    assert(data.events !== undefined, 'Missing events field');
  });

  // ─── 3. Employee CRUD ─────────────────────────────────────────────────
  console.log('\n── Employee CRUD ──');

  let employeeId;

  await test('Create employee', async () => {
    const { status, data } = await api('POST', '/api/employees', {
      name: 'Test User',
      email: `test_${Date.now()}@company.com`,
      department: 'Engineering',
      role: 'Developer',
      baseSalary: 50000,
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(data.id, 'Missing employee id');
    employeeId = data.id;
  });

  await test('List employees', async () => {
    const { status, data } = await api('GET', '/api/employees');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(data), 'Expected array');
  });

  await test('Get employee by id', async () => {
    const { status, data } = await api('GET', `/api/employees/${employeeId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.name === 'Test User', 'Wrong employee name');
  });

  // ─── 4. Rule CRUD ─────────────────────────────────────────────────────
  console.log('\n── Rule CRUD ──');

  let ruleId;

  await test('Create rule', async () => {
    const { status, data } = await api('POST', '/api/rules', {
      name: 'Test Overtime Bonus',
      eventType: 'AttendanceMarked',
      conditionField: 'overtime_hours',
      conditionOperator: 'gte',
      conditionValue: 2,
      actionType: 'AddBonus',
      actionConfig: { percentage: 3 },
      priority: 1,
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(data.id, 'Missing rule id');
    ruleId = data.id;
  });

  await test('Get rule by id', async () => {
    const { status, data } = await api('GET', `/api/rules/${ruleId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.name === 'Test Overtime Bonus', 'Wrong rule name');
  });

  await test('List rules', async () => {
    const { status, data } = await api('GET', '/api/rules');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(data), 'Expected array');
  });

  await test('Get available actions', async () => {
    const { status, data } = await api('GET', '/api/rules/actions');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.actions.includes('AddBonus'), 'Missing AddBonus');
    assert(data.actions.includes('AutoApproveLeave'), 'Missing AutoApproveLeave');
    assert(data.actions.includes('Escalate'), 'Missing Escalate');
  });

  // ─── 5. Dry-Run Rule Test ─────────────────────────────────────────────
  console.log('\n── Dry-Run Rule Test ──');

  await test('Dry-run: condition met', async () => {
    const { status, data } = await api('POST', '/api/rules/test', {
      conditionField: 'overtime_hours',
      conditionOperator: 'gte',
      conditionValue: 2,
      actionType: 'AddBonus',
      payload: { overtime_hours: 5 },
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.conditionMet === true, 'Expected condition to be met');
    assert(data.wouldExecute === true, 'Expected wouldExecute true');
  });

  await test('Dry-run: condition NOT met', async () => {
    const { status, data } = await api('POST', '/api/rules/test', {
      conditionField: 'overtime_hours',
      conditionOperator: 'gte',
      conditionValue: 10,
      actionType: 'AddBonus',
      payload: { overtime_hours: 5 },
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.conditionMet === false, 'Expected condition NOT met');
  });

  // ─── 6. Event Flow ────────────────────────────────────────────────────
  console.log('\n── Event Flow ──');

  await test('Mark attendance triggers event', async () => {
    const { status, data } = await api('POST', '/api/attendance', {
      employeeId,
      date: new Date().toISOString().split('T')[0],
      checkIn: new Date().toISOString(),
      status: 'PRESENT',
      overtime: 3,
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(data.eventId, 'Missing eventId from attendance marking');
  });

  // Wait for async processing
  await new Promise((r) => setTimeout(r, 1000));

  await test('Event was processed', async () => {
    const { status, data } = await api('GET', '/api/events?type=AttendanceMarked');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.length > 0, 'Expected at least one event');
    const latest = data[0];
    assert(
      latest.status === 'PROCESSED' || latest.status === 'FAILED',
      `Expected PROCESSED or FAILED, got ${latest.status}`
    );
  });

  await test('Action log created for rule', async () => {
    const { status, data } = await api('GET', `/api/action-logs?employeeId=${employeeId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.length > 0, 'Expected at least one action log');
  });

  // ─── 7. Event Types ──────────────────────────────────────────────────
  console.log('\n── Event Types ──');

  await test('Get event types', async () => {
    const { status, data } = await api('GET', '/api/events/types');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.eventTypes.includes('AttendanceMarked'), 'Missing AttendanceMarked');
    assert(data.eventTypes.length === 9, `Expected 9 types, got ${data.eventTypes.length}`);
  });

  // ─── 8. Cleanup ──────────────────────────────────────────────────────
  console.log('\n── Cleanup ──');

  await test('Delete rule', async () => {
    const { status } = await api('DELETE', `/api/rules/${ruleId}`);
    assert(status === 204, `Expected 204, got ${status}`);
  });

  await test('Delete employee', async () => {
    const { status } = await api('DELETE', `/api/employees/${employeeId}`);
    assert(status === 204, `Expected 204, got ${status}`);
  });

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
