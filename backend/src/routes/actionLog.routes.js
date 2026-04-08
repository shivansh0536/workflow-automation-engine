const router = require('express').Router();
const c = require('../controllers/actionLog.controller');
router.get('/',       c.listLogs);
router.get('/stats',  c.getStats);
module.exports = router;
