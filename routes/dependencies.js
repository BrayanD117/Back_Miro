const express = require('express')

const router = express.Router()

const controller = require('../controllers/dependencies.js')

router.get("/all", controller.getDependencies)

router.get("/", controller.getDependency)

router.post("/loadData", controller.loadDependencies)

router.put("/setResponsible", controller.setResponsible)

router.get("/:dep_code/members", controller.getMembers)

router.put("/:id", controller.updateDependency)

module.exports = router