const router = require('express').Router();
const controller = require('../controllers/publishedTemplates');

router.post("/publish", controller.publishTemplate);

router.delete("/delete", controller.deletePublishedTemplate);

router.get("/", controller.getAssignedTemplatesToProductor);
router.get("/available", controller.getAvailableTemplatesToProductor);

router.get("/feedOptions", controller.feedOptionsToPublishTemplate);

router.put("/producer/load", controller.loadProducerData);
router.put("/producer/submitEmpty", controller.submitEmptyData);
router.get("/uploaded", controller.getUploadedTemplatesByProducer);
router.delete("/producer/delete", controller.deleteLoadedDataDependency);

router.get("/dimension", controller.getPublishedTemplatesDimension);
router.get("/dimension/mergedData", controller.getFilledDataMergedForDimension);

router.get("/template/:id", controller.getTemplateById);

router.get('/uploaded/:id_template', controller.getUploadedTemplateDataByProducer);

router.get("/export-pending/:periodId", controller.exportPendingTemplates);

module.exports = router