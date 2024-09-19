const router = require('express').Router();
const logController = require('../controllers/logs');

router.post('/', logController.create);
router.get('/', logController.get);
router.get('/:id', logController.getById);
router.delete('/', logController.deleteDateRange);

module.exports = router;