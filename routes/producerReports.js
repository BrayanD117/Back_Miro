const controller = require('../controllers/producerReports')
const router = require('express').Router()
const fileUpload = require('../config/fileReceive')

router.get("/all", controller.getReports)
router.get("/", controller.getReportsPagination)
router.post("/create", fileUpload.single('report_example'), controller.createReport)

module.exports = router