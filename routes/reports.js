const upload = require('../config/fileUpload.js')
const controller = require('../controllers/reports.js')

const router = require('express').Router()

router.get("/all", controller.getReports)

router.post("/create", upload.single('report_example'), controller.createReport)

module.exports = router