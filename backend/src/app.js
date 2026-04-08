const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'Smart HR Automation System', ts: new Date().toISOString() })
);

// ─── Workflow Engine (existing) ────────────────────────────────────────────
app.use('/api/workflows',   require('./routes/workflow.routes'));
app.use('/api/runs',        require('./routes/run.routes'));

// ─── HR System ─────────────────────────────────────────────────────────────
app.use('/api/employees',   require('./routes/employee.routes'));
app.use('/api/attendance',  require('./routes/attendance.routes'));
app.use('/api/leaves',      require('./routes/leave.routes'));
app.use('/api/rules',       require('./routes/rule.routes'));
app.use('/api/events',      require('./routes/event.routes'));
app.use('/api/action-logs', require('./routes/actionLog.routes'));
app.use('/api/salary',      require('./routes/salary.routes'));

// ─── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
