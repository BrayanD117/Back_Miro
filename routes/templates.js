const router = require('express').Router();
const controller = require('../controllers/templates'); // Ajusta el path según tu estructura de proyecto

router.get("/all", controller.getPlantillas);       // Obtener todas las plantillas
router.get("/:id", controller.getPlantilla);        // Obtener una plantilla por ID
router.get("/creator", controller.getPlantillasByCreator); // Obtener plantillas por creador
router.post("/create", controller.createPlantilla);  // Crear una nueva plantilla
router.put("/:id", controller.updatePlantilla);
router.delete("/delete", controller.deletePlantilla); // Borrar una plantilla por ID

module.exports = router;
