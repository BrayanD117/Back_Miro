const controller = require('../controllers/publishedReports')
const router = require('express').Router()

router.get("/all", controller.getPublishedReports)
router.get("/responsible", controller.getPublishedReportsResponsible)
router.post("/publish", controller.publishReport)
router.get("/feed", controller.feedOptionsForPublish)

module.exports = router