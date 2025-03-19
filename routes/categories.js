const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoryController');

// Obtener todas las categorías
router.get('/all', controller.getCategories);

// Obtener una categoría por su ID
router.get('/:categoryId', controller.getCategoryById);

// Crear una nueva categoría
router.post('/create', controller.createCategory);

// Asignar una plantilla a una categoría
router.post('/assign-template', controller.assignTemplateToCategory);

// Eliminar una plantilla de una categoría
router.post('/remove-template', controller.removeTemplateFromCategory);

// Actualizar una categoría
router.put('/:categoryId', controller.updateCategory);

// Actualizar una plantilla asignada a una categoría
router.put('/:categoryId/assign-template', controller.updateTemplateAssignment);

// Eliminar una categoría
router.delete('/:categoryId', controller.deleteCategory);

module.exports = router;
