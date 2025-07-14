const controller = require('../controllers/producerReports')
const router = require('express').Router()
const fileUpload = require('../config/fileReceive')

router.get("/all", controller.getReports)
router.get("/", controller.getReportsPagination)
router.post("/create", fileUpload.single('report_example'), controller.createReport)
router.get("/:id", controller.getReport)
router.put("/", fileUpload.single('report_example'), controller.updateReport)
router.delete("/:id", controller.deleteProducerReport);


module.exports = router