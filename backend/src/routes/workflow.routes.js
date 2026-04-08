const express = require('express');
const router = express.Router();
const {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  deactivateWorkflow,
} = require('../controllers/workflow.controller');

router.get('/', listWorkflows);
router.get('/:id', getWorkflow);
router.post('/', createWorkflow);
router.patch('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);
router.post('/:id/activate', activateWorkflow);
router.post('/:id/deactivate', deactivateWorkflow);

module.exports = router;
