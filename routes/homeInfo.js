const express = require('express');
const router = express.Router();
const accordionController = require('../controllers/homeInfo');

router.get('/', accordionController.getAllSections);

router.post('/', accordionController.createSection);

router.put('/:id', accordionController.updateSection);

router.delete('/:id', accordionController.deleteSection);

module.exports = router;
