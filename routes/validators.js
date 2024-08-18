const controller = require('../controllers/validators')

const router = require('express').Router()

router.post("/create", controller.createValidator)
router.put("/updateName", controller.updateName)
router.put("/update", controller.updateValidator)
router.get("/options", controller.getValidatorOptions)
router.get("/", controller.getValidator)
router.get("/all", controller.getValidators)
router.get("/pagination", controller.getValidatorsWithPagination)
router.delete("/delete", controller.deleteValidator)
router.get("/id", controller.getValidatorById)

module.exports = router