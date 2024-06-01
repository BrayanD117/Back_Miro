const router = require('express').Router();
const controller = require('../controllers/template.controller'); // Ajusta el path según tu estructura de proyecto

router.get("/all", controller.getPlantillas);       // Obtener todas las plantillas
router.get("/", controller.getPlantilla);        // Obtener una plantilla por ID
router.post("/create", controller.createPlantilla);  // Crear una nueva plantilla
// router.put("/update", controller.updatePlantilla); // Actualizar una plantilla por ID (pendiente)
router.delete("/delete", controller.deletePlantilla); // Borrar una plantilla por ID

module.exports = router;
