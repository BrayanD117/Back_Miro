const express = require('express')

const router = express.Router()

const controller = require('../controllers/users.js')

router.get("/all", controller.getUsers)

router.get("/allPagination", controller.getUsersPagination)

router.get("/roles", controller.getUserRoles);

router.get("/responsibles", controller.getResponsibles);

router.get("/producers", controller.getProducers);

router.put("/updateRole", controller.updateUserRoles)

router.put("/updateActiveRole", controller.updateUserActiveRole);

router.get("/", controller.getUser)

router.post("/loadData", controller.loadUsers)

router.post("/addExternalUser", controller.addExternalUser)

router.put("/updateStatus", controller.updateUserStatus);

module.exports = router