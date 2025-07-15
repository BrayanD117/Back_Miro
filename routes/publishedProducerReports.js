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
router.get("/:id", controller.getPublishedProducerReport)
router.get('/pending-by-user', controller.getPendingProducerReportsByUser);

router.delete("/:id", controller.deletePublishedProducerReport)

module.exports = router