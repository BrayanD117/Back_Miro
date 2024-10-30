const express = require('express')

const router = express.Router()

const controller = require('../controllers/dependencies.js')

router.get("/all", controller.getDependencies)

router.get("/:email", controller.getAllDependencies)

router.get("/", controller.getDependency)

router.get("/responsible", controller.getDependencyByResponsible);

router.get("/:id", controller.getDependencyById);

router.post("/updateAll", controller.loadDependencies)

router.put("/setResponsible", controller.setResponsible)

router.get("/:dep_code/members", controller.getMembers)

router.put("/:id", controller.updateDependency)

router.get("/members", controller.getMembersWithFather)

router.post("/names", controller.getDependencyNames);

module.exports = router