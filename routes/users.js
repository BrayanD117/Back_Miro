const express = require('express')

const router = express.Router()

const controller = require('../controllers/users.js')

router.get("/all", controller.getUsers)

router.get("/allPagination", controller.getUsersPagination)

router.get("/roles", controller.getUserRoles);

router.put("/updateRole", controller.updateUserRoles)

router.get("/", controller.getUser)

// router.get("/loadData", controller.loadUsers)

module.exports = router