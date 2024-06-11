const express = require('express')

const router = express.Router()

const controller = require('../controllers/dependencies.js')

router.get("/all", controller.getDependencies)

router.get("/", controller.getDependency)

router.post("/loadData", controller.loadDependencies)

router.put("/setResponsible", controller.setResponsible)

module.exports = router