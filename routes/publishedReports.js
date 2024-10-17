const controller = require('../controllers/publishedReports')
const router = require('express').Router()
const fileUpload = require('../config/fileReceive')

router.get("/all", controller.getPublishedReports)
router.get("/responsible", controller.getPublishedReportsResponsible)
router.put("/responsible/load", fileUpload.fields([
    { name: 'reportFile', maxCount: 1 },
    { name: 'attachments' }
]), controller.loadResponsibleReportDraft)
//router.put("/responsible/send", controller.sendResponsibleReportDraft)
router.get("/responsible/loaded", controller.getLoadedReportsResponsible)
router.post("/publish", controller.publishReport)
router.get("/feed", controller.feedOptionsForPublish)
router.put("/status", controller.setFilledReportStatus)
router.get("/responsible/:id", controller.getPublishedReport);
router.delete("/delete/:reportId", controller.deletePublishedReport)
router.get("/history", controller.getHistory)

module.exports = router