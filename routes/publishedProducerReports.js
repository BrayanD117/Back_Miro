const router = require('express').Router()
const fileUpload = require('../config/fileReceive')
const controller = require('../controllers/publishedProducerReports')

router.get("/producer", controller.getPublishedProducerReportsProducer)
router.get("/producer/:id", controller.getPublishedProducerReportProducer)
router.put("/producer/loadDraft", fileUpload.fields([
  { name: 'reportFile', maxCount: 1 },
  { name: 'attachments' }
]), controller.loadProducerReportDraft)
router.put("/producer/send", controller.sendProducerReport) 

router.get("/", controller.getPublishedProducerReports)
router.post("/publish", controller.publishProducerReport)
router.put("/status", controller.setFilledReportStatus)
router.get('/get/pendingReportsByUser', controller.getPendingProducerReportsByUser);
router.get("/:id", controller.getPublishedProducerReport)
router.delete("/:id", controller.deletePublishedProducerReport)
router.put("/update-deadlines", controller.updateDeadlines);
// router.put("/update-deadlines/by-period", controller.updateDeadlinesByPeriod);

module.exports = router