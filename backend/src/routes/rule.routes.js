const router = require('express').Router();
const c = require('../controllers/rule.controller');
router.get('/',            c.listRules);
router.get('/actions',     c.getAvailableActions);
router.post('/',           c.createRule);
router.patch('/:id',       c.updateRule);
router.delete('/:id',      c.deleteRule);
router.post('/:id/toggle', c.toggleRule);
module.exports = router;
