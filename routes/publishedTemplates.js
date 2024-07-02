const router = require('express').Router();
const controller = require('../controllers/publishedTemplates');

router.post("/publish", controller.publishTemplate);

router.get("/", controller.getAssignedTemplatesToProductor);

router.get("/feedOptions", controller.feedOptionsToPublishTemplate);

module.exports = router