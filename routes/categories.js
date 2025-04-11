const express = require('express');
const router = express.Router();
const controller = require('../controllers/categories');

// Obtener todas las categorías
router.get('/all', controller.getCategories);

// Obtener una categoría por su ID
router.get('/:categoryId', controller.getCategoryById);

// Crear una nueva categoría
router.post('/create', controller.createCategory);

// Asignar una plantilla a una categoría
router.post('/assign-template', controller.assignTemplateToCategory);

// Actualizar una categoría
router.put('/:categoryId', controller.updateCategory);

// Eliminar una categoría
router.delete('/:categoryId', controller.deleteCategory);

module.exports = router;
