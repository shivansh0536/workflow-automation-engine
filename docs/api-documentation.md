# API Documentation

Base URL: `http://localhost:4000`

---

## Health Check

### `GET /health`

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "service": "Smart HR Automation System",
  "ts": "2026-04-08T14:00:00.000Z"
}
```

---

## Dashboard

### `GET /api/dashboard/stats`

Returns aggregated statistics for the dashboard.

**Response:**
```json
{
  "employees": { "total": 5, "active": 4 },
  "rules": { "total": 3, "active": 2 },
  "events": { "total": 15, "pending": 0, "processed": 14, "failed": 1 },
  "actions": { "total": 20, "successful": 18, "failed": 1, "skipped": 1, "byType": [...] },
  "leaves": { "pending": 2 },
  "workflows": { "total": 1, "active": 1 },
  "runs": { "total": 5 },
  "recentEvents": [...]
}
```

---

## Employees

### `GET /api/employees`

List all employees. Optional filters: `?department=IT&status=ACTIVE`

### `POST /api/employees`

Create an employee.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "department": "Engineering",
  "role": "Developer",
  "baseSalary": 50000,
  "joiningDate": "2024-01-15"
}
```

### `GET /api/employees/:id`

Get employee details with recent attendance and leaves.

### `PATCH /api/employees/:id`

Update employee fields.

### `DELETE /api/employees/:id`

Delete an employee.

---

## Attendance

### `GET /api/attendance`

List attendance records. Optional filters: `?employeeId=xxx&date=2024-01-15`

### `POST /api/attendance`

Mark attendance. **Automatically triggers an AttendanceMarked event** which is processed by the Rule Engine.

**Body:**
```json
{
  "employeeId": "clxyz...",
  "date": "2024-01-15",
  "checkIn": "2024-01-15T09:00:00Z",
  "checkOut": "2024-01-15T18:00:00Z",
  "status": "PRESENT",
  "overtime": 1
}
```

### `GET /api/attendance/summary/:employeeId`

Monthly attendance summary. Optional: `?month=4&year=2024`

---

## Leaves

### `GET /api/leaves`

List leave requests. Optional filters: `?employeeId=xxx&status=PENDING`

### `POST /api/leaves`

Request leave.

**Body:**
```json
{
  "employeeId": "clxyz...",
  "type": "CASUAL",
  "fromDate": "2024-01-20",
  "toDate": "2024-01-22",
  "reason": "Personal work"
}
```

### `PATCH /api/leaves/:id/status`

Approve or reject a leave. **Automatically triggers LeaveApproved/LeaveRejected event**.

**Body:**
```json
{ "status": "APPROVED" }
```

---

## Automation Rules

### `GET /api/rules`

List all rules with action log counts.

### `GET /api/rules/:id`

Get a single rule by ID.

### `GET /api/rules/actions`

List available action types.

**Response:**
```json
{
  "actions": ["DeductSalary", "AddBonus", "SendNotification", "WarnEmployee", "GenerateCoupon", "AutoApproveLeave", "Escalate"]
}
```

### `POST /api/rules`

Create a new automation rule.

**Body:**
```json
{
  "name": "Bonus for 20+ days attendance",
  "description": "Add 5% bonus for employees with 20+ present days",
  "eventType": "AttendanceMarked",
  "conditionField": "attendance_days",
  "conditionOperator": "gte",
  "conditionValue": 20,
  "actionType": "AddBonus",
  "actionConfig": { "percentage": 5 },
  "priority": 1
}
```

**Available Operators:** `lt`, `gt`, `lte`, `gte`, `eq`, `neq`, `contains`, `startsWith`, `in`

### `POST /api/rules/test`

Dry-run a rule against sample payload without persisting.

**Body:**
```json
{
  "conditionField": "attendance_days",
  "conditionOperator": "gte",
  "conditionValue": 20,
  "actionType": "AddBonus",
  "payload": { "attendance_days": 22 }
}
```

**Response:**
```json
{
  "conditionMet": true,
  "fieldValue": 22,
  "conditionField": "attendance_days",
  "conditionOperator": "gte",
  "conditionValue": 20,
  "actionType": "AddBonus",
  "wouldExecute": true,
  "message": "Condition met: 22 gte 20 → AddBonus would execute"
}
```

### `PATCH /api/rules/:id`

Update a rule.

### `DELETE /api/rules/:id`

Delete a rule.

### `POST /api/rules/:id/toggle`

Toggle a rule active/inactive.

---

## Events

### `GET /api/events`

List events. Optional filters: `?type=AttendanceMarked&status=PROCESSED&employeeId=xxx`

### `GET /api/events/:id`

Get a single event with action logs.

### `GET /api/events/types`

List all valid event types.

### `POST /api/events/trigger`

Manually trigger an event for rule processing.

**Body:**
```json
{
  "type": "AttendanceMarked",
  "employeeId": "clxyz...",
  "payload": {
    "attendance_days": 22,
    "overtime_hours": 5,
    "is_late": 0
  }
}
```

---

## Action Logs

### `GET /api/action-logs`

List action logs. Optional filters: `?employeeId=xxx&actionType=AddBonus&status=SUCCESS`

### `GET /api/action-logs/stats`

Statistics: total, successful, failed, skipped, breakdown by action type.

---

## Workflows

### `GET /api/workflows`

List all workflows with steps and run counts.

### `GET /api/workflows/:id`

Get workflow details with steps and recent runs.

### `POST /api/workflows`

Create a workflow with steps.

**Body:**
```json
{
  "name": "Onboarding Workflow",
  "trigger": "employee_created",
  "description": "New employee onboarding steps",
  "steps": [
    { "name": "Send Welcome Email", "type": "email", "config": { "to": "{{employee.email}}", "subject": "Welcome!" } },
    { "name": "Wait 1 day", "type": "delay", "config": { "ms": 86400000 } },
    { "name": "Assign Training", "type": "http_request", "config": { "url": "/api/training", "method": "POST" } }
  ]
}
```

### `PATCH /api/workflows/:id`

Update workflow fields.

### `DELETE /api/workflows/:id`

Delete a workflow and all its steps/runs.

### `POST /api/workflows/:id/activate`

Activate a workflow.

### `POST /api/workflows/:id/deactivate`

Deactivate a workflow.

---

## Workflow Runs

### `GET /api/runs`

List workflow runs. Optional filters: `?workflowId=xxx&status=SUCCESS&limit=20`

### `GET /api/runs/:id`

Get run details with step results.

### `POST /api/runs`

Trigger a workflow run manually.

**Body:**
```json
{ "workflowId": "clxyz..." }
```

**Response (202):**
```json
{ "message": "Workflow run started", "runId": "clxyz..." }
```

---

## Salary

### `GET /api/salary`

List salary simulations for all active employees. Optional: `?month=4&year=2024`

### `GET /api/salary/:employeeId`

Detailed salary simulation with attendance summary, deductions, bonuses, and net salary.
