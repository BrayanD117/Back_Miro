const controller = require('../controllers/validators')

const router = require('express').Router()

router.post("/create", controller.createValidator)
router.put("/updateName", controller.updateName)
router.put("/update", controller.updateValidator)
router.get("/options", controller.getValidators)
router.get("/", controller.getValidator)
router.get("/pagination", controller.getValidatorsWithPagination)
router.delete("/delete", controller.deleteValidator)

module.exports = router