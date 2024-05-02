const express = require('express')

const router = express.Router()

const controller = require('../controllers/functionaries.js')

router.get("/", controller.getFunctionaries)

module.exports = router