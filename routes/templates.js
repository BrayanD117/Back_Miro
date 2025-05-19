const router = require('express').Router();
const controller = require('../controllers/templates');

router.get('/sync-published-templates', controller.syncAllPublishedTemplates);
router.get("/creator", controller.getPlantillasByCreator);
router.get("/all", controller.getPlantillas);
router.get("/all/no-pagination", controller.getTemplatesWithoutPagination)
router.get("/:id", controller.getPlantilla);
router.post("/create", controller.createPlantilla);
router.put("/:id", controller.updatePlantilla);
router.delete("/delete", controller.deletePlantilla);


module.exports = router