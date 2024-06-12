const router = require('express').Router()

const controller = require('../controllers/periods.js')

router.get("/all", controller.getPeriods)

router.get("/", controller.getPeriod)

router.post("/create", controller.createPeriod)

router.put("/:id", controller.updatePeriod);  

router.delete("/:id", controller.deletePeriod);

module.exports = router