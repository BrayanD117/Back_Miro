const router = require('express').Router()

const controller = require('../controllers/periods.js')

router.get("/all", controller.getPeriods)

router.get("/", controller.getPeriod)

router.get("/active", controller.getActivePeriods)

router.post("/create", controller.createPeriod)

router.put("/:id", controller.updatePeriod);  

router.delete("/:id", controller.deletePeriod);

router.get("/allperiods", controller.getAllPeriods)

module.exports = router