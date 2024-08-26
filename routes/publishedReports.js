const controller = require('../controllers/publishedReports')
const router = require('express').Router()
const fileUpload = require('../config/fileReceive')

router.get("/all", controller.getPublishedReports)
router.get("/responsible", controller.getPublishedReportsResponsible)
router.post("/publish", controller.publishReport)
router.put("/responsible/load", fileUpload.fields([
    { name: 'reportFile', maxCount: 1 },
    { name: 'attachments' }
]), controller.loadResponsibleReport)
router.get("/feed", controller.feedOptionsForPublish)

module.exports = router