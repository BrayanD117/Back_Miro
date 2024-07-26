const router = require('express').Router();
const controller = require('../controllers/publishedTemplates');

router.post("/publish", controller.publishTemplate);

router.get("/", controller.getAssignedTemplatesToProductor);

router.get("/feedOptions", controller.feedOptionsToPublishTemplate);

router.put("/producer/load", controller.loadProducerData);

router.get("/responsible/mergedData", controller.getFilledDataMergedForResponsible);

module.exports = router