const express = require('express');
const router = express.Router();
const { listRuns, getRun, triggerRun } = require('../controllers/run.controller');

router.get('/', listRuns);
router.get('/:id', getRun);
router.post('/', triggerRun);

module.exports = router;
