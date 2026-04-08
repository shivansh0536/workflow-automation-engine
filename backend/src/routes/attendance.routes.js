const router = require('express').Router();
const c = require('../controllers/attendance.controller');
router.get('/',                      c.listAttendance);
router.post('/',                     c.markAttendance);
router.get('/summary/:employeeId',   c.getAttendanceSummary);
module.exports = router;
