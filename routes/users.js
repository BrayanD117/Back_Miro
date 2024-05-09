const express = require('express')

const router = express.Router()

const controller = require('../controllers/users.js')

router.get("/", controller.getUsers)

router.put("/update", controller.updateUser)

// router.get("/loadSample", controller.loadUsers)

module.exports = router