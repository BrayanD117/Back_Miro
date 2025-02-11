const controller = require('../controllers/students.js')

const router = require('express').Router()

router.get("/all", controller.getStudents)
router.get("/:id", controller.getStudent)
router.put("/sync", controller.syncStudents)

module.exports = router