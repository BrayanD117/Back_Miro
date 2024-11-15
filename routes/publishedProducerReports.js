const router = require('express').Router()
const controller = require('../controllers/publishedProducerReports')

router.get("/:id", controller.getPublishedProducerReport)
router.get("/", controller.getPublishedProducerReports)
router.post("/publish", controller.publishProducerReport)

module.exports = router