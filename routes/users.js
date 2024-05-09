const express = require('express')

const router = express.Router()

const controller = require('../controllers/users.js')

router.get("/", controller.getUsers)

router.put("/updateRole", controller.updateUserRoles)

// router.get("/loadSample", controller.loadUsers)

module.exports = router