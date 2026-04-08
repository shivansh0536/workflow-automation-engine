const router = require('express').Router();
const c = require('../controllers/event.controller');
router.get('/',         c.listEvents);
router.get('/types',    c.getEventTypes);
router.post('/trigger', c.triggerEvent);
module.exports = router;
