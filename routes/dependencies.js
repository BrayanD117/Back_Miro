const express = require('express')

const router = express.Router()

const controller = require('../controllers/dependencies.js')

router.get("/", controller.getDependencies)

// router.post("/loadData", controller.loadDependencies)

module.exports = router