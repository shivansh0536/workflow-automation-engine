const router = require('express').Router();
const c = require('../controllers/employee.controller');
router.get('/',    c.listEmployees);
router.post('/',   c.createEmployee);
router.get('/:id', c.getEmployee);
router.patch('/:id', c.updateEmployee);
router.delete('/:id', c.deleteEmployee);
module.exports = router;
