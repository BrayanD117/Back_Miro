const Category = require("../models/categories");
const Template = require("../models/templates");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const categoryController = {};

// Crear una nueva categoría
categoryController.createCategory= async (req, res) => {
  try {
    const { name, templates } = req.body; // Receive category name and templates

    if (!name) {
      return res.status(400).json({ message: "El nombre de la categoría es requerido" });
    }

    const category = new Category({ name, templates }); // Creating category with templates
    await category.save(); // Save the category
    res.status(201).json(category); // Return the created category
  } catch (error) {
    console.error("Error al crear categoría:", error);
    res.status(500).json({ message: "Hubo un error al crear la categoría", error: error.message });
  }
};


// Obtener todas las categorías
categoryController.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("templates.templateId");
    res.status(200).json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las categorías", error });
  }
};

// Obtener una categoría por su ID
categoryController.getCategoryById = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await Category.findById(categoryId).populate("templates.templateId");
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Error al obtener la categoría:", error);
    res.status(500).json({ message: "Error al obtener la categoría", error });
  }
};


// Asignar una plantilla a una categoría
categoryController.assignTemplateToCategory = async (req, res) => {
  const { categoryId, templateId, sequence } = req.body;

  try {
    // Buscar la categoría
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Verificar si la plantilla ya está asignada
    const templateExists = category.templates.some(
      (template) => template.templateId.toString() === templateId
    );
    if (templateExists) {
      return res.status(400).json({ message: "La plantilla ya está asignada a esta categoría" });
    }

    // Obtener la plantilla
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: "Plantilla no encontrada" });
    }

    // Asignar la plantilla a la categoría
    category.templates.push({ templateId, sequence });

    // Guardar la categoría actualizada
    await category.save();
    res.status(200).json({ message: "Plantilla asignada a la categoría exitosamente", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al asignar plantilla a la categoría", error });
  }
};

// Eliminar una plantilla de una categoría
categoryController.removeTemplateFromCategory = async (req, res) => {
  const { categoryId, templateId } = req.body;

  try {
    // Buscar la categoría
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Encontrar y eliminar la plantilla de la categoría
    const templateIndex = category.templates.findIndex(
      (template) => template.templateId.toString() === templateId
    );
    if (templateIndex === -1) {
      return res.status(400).json({ message: "Plantilla no asignada a esta categoría" });
    }

    // Eliminar la plantilla
    category.templates.splice(templateIndex, 1);

    // Guardar la categoría actualizada
    await category.save();
    res.status(200).json({ message: "Plantilla eliminada de la categoría exitosamente", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar plantilla de la categoría", error });
  }
};

// Actualizar una categoría
categoryController.updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { name, templates } = req.body; // Receive updated category name and templates

  try {
    // Buscar la categoría por su ID
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Actualizar el nombre y las plantillas de la categoría
    category.name = name || category.name;
    category.templates = templates || category.templates;

    // Guardar la categoría actualizada
    await category.save();
    res.status(200).json({ message: "Categoría actualizada exitosamente", category });
  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    res.status(500).json({ message: "Hubo un error al actualizar la categoría", error });
  }
};

// Actualizar una plantilla asignada a una categoría por su ID
categoryController.updateTemplateAssignment = async (req, res) => {
  const { categoryId } = req.params; // Recibe el categoryId desde los parámetros de la URL
  const { templateId, sequence } = req.body;

  try {
    // Buscar la categoría por su ID
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Buscar si la plantilla ya está asignada a la categoría
    const templateIndex = category.templates.findIndex(
      (template) => template.templateId.toString() === templateId
    );
    if (templateIndex === -1) {
      return res.status(400).json({ message: "La plantilla no está asignada a esta categoría" });
    }

    // Actualizar la plantilla y la secuencia
    category.templates[templateIndex].sequence = sequence;

    // Guardar la categoría actualizada
    await category.save();
    res.status(200).json({ message: "Plantilla actualizada exitosamente", category });
  } catch (error) {
    console.error("Error al actualizar plantilla:", error);
    res.status(500).json({ message: "Hubo un error al actualizar la plantilla", error });
  }
};


// Eliminar una categoría
categoryController.deleteCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Buscar y eliminar la categoría por su ID
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    res.status(200).json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar la categoría:", error);
    res.status(500).json({ message: "Hubo un error al eliminar la categoría", error });
  }
};

module.exports = categoryController;
