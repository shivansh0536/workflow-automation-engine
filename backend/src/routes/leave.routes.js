const router = require('express').Router();
const c = require('../controllers/leave.controller');
router.get('/',               c.listLeaves);
router.post('/',              c.requestLeave);
router.patch('/:id/status',   c.updateLeaveStatus);
module.exports = router;
