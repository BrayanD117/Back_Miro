const router = require('express').Router();
const logController = require('../controllers/logs');

router.get('/', logController.get);
router.get('/:id', logController.getById);
router.delete('/', logController.deleteDateRange);

module.exports = router;