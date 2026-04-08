const router = require('express').Router();
const c = require('../controllers/dashboard.controller');
router.get('/stats', c.getDashboardStats);
module.exports = router;
