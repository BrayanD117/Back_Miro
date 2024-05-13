const express = require('express')

const router = express.Router()

const controller = require('../controllers/dimensions.js')

router.get("/all", controller.getDimensions)

router.post("/create", controller.createDimension)

router.get("/", controller.getDimension)

// router.get("/loadSample", controller.loadUsers)

module.exports = router