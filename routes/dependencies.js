const express = require('express')

const router = express.Router()

const controller = require('../controllers/dependencies.js')

router.get("/all", controller.getDependencies)

router.get("/childrenDependencies/templates", controller.getChildrenDependenciesPublishedTemplates)

router.get("/responsible", controller.getDependencyByResponsible);

router.get("/:id/templates", controller.getTemplates)

router.get("/:id/reports", controller.getReports)

router.get("/:id", controller.getDependencyById);

router.get("/all/:email", controller.getAllDependencies)

router.get("/", controller.getDependency)

router.post("/updateAll", controller.loadDependencies)

router.put("/setResponsible", controller.setResponsible)

router.get("/:dep_code/members", controller.getMembers)

router.put("/:id", controller.updateDependency)

router.get("/members", controller.getMembersWithFather)

router.post("/names", controller.getDependencyNames);

router.get("/:email/hierarchy", controller.getDependencyHierarchy)

router.get("/:id/visualizers", controller.getVisualizers);

router.put("/:id/visualizers", controller.updateVisualizers);





module.exports = router