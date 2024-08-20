const upload = require('../config/fileReceive.js')
const controller = require('../controllers/reports.js')

const router = require('express').Router()

router.get("/all", controller.getReports)

router.post("/create", upload.single('report_example'), controller.createReport)

router.get("/:id", controller.getReportExampleFile)

module.exports = router