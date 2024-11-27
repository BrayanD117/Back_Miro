const upload = require('../config/fileReceive.js')
const controller = require('../controllers/reports.js')

const router = require('express').Router()

router.get("/all", controller.getReports)

router.post("/create", upload.single('report_example'), controller.createReport)


router.delete("/delete/:id", controller.deleteReport)

router.get("/:id", controller.getReport)

router.put("/:id", upload.single('report_example'), controller.updateReport)

module.exports = router