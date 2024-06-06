const router = require('express').Router()

const controller = require('../controllers/periods.js')

router.get("/all", controller.getPeriods)

router.get("/", controller.getPeriod)

router.post("/create", controller.createPeriod)

module.exports = router