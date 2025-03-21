const Category = require("../models/categories");
const Template = require("../models/templates");
const mongoose = require("mongoose");

const categoryController = {};

// Crear una nueva categoría
categoryController.createCategory = async (req, res) => {
  try {
    const { name, templates } = req.body;

    if (!name) {
      return res.status(400).json({ message: "El nombre de la categoría es requerido" });
    }

    // Crear la nueva categoría
    const category = new Category({ name, templates });
    await category.save();

    // Asignar la categoría y la secuencia a las plantillas
    if (templates && templates.length > 0) {
      const updatePromises = templates.map((t) =>
        Template.findByIdAndUpdate(
          t.templateId,
          { category: category._id, sequence: t.sequence },
          { new: true }
        )
      );
      await Promise.all(updatePromises);
    }

    res.status(201).json({ message: "Categoría creada exitosamente", category });
  } catch (error) {
    console.error("Error al crear la categoría:", error);
    res.status(500).json({ message: "Hubo un error al crear la categoría", error: error.message });
  }
};

// Obtener todas las categorías
categoryController.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("templates.templateId");
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    res.status(500).json({ message: "Error al obtener las categorías", error });
  }
};

// Obtener una categoría por ID
categoryController.getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId).populate("templates.templateId");

    if (!category) return res.status(404).json({ message: "Categoría no encontrada" });

    res.status(200).json(category);
  } catch (error) {
    console.error("Error al obtener la categoría:", error);
    res.status(500).json({ message: "Error al obtener la categoría", error });
  }
};

// Asignar una plantilla a una categoría
categoryController.assignTemplateToCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { templateId, sequence } = req.body;

    if (!categoryId || !templateId || sequence === undefined) {
      return res.status(400).json({ message: "Faltan datos requeridos (categoryId, templateId, sequence)" });
    }

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Categoría no encontrada" });

    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ message: "Plantilla no encontrada" });

    // Verificar si la plantilla ya está en la categoría
    const templateExists = category.templates.some((t) => t.templateId.toString() === templateId);
    if (templateExists) return res.status(400).json({ message: "La plantilla ya está asignada a esta categoría" });

    // Asignar plantilla con secuencia
    category.templates.push({ templateId, sequence });
    await category.save();

    // Actualizar plantilla en `templates`
    await Template.findByIdAndUpdate(templateId, { category: categoryId, sequence }, { new: true });

    res.status(200).json({ message: "Plantilla asignada exitosamente", category });
  } catch (error) {
    console.error("Error al asignar plantilla a la categoría:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar una categoría y sus plantillas
categoryController.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, templates } = req.body;

    if (!categoryId || !name || !templates) {
      return res.status(400).json({ message: "Faltan datos requeridos (categoryId, name, templates)" });
    }

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Categoría no encontrada" });

    // Obtener los IDs de las nuevas y antiguas plantillas
    const newTemplateIds = templates.map((t) => t.templateId.toString());
    const oldTemplateIds = category.templates.map((t) => t.templateId.toString());

    // **Eliminar las plantillas que ya no están en la categoría**
    const templatesToRemove = oldTemplateIds.filter((id) => !newTemplateIds.includes(id));
    await Template.updateMany({ _id: { $in: templatesToRemove } }, { $unset: { category: "", sequence: "" } });

    // **Actualizar la categoría con las nuevas plantillas**
    category.name = name;
    category.templates = templates;
    await category.save();

    // **Actualizar cada plantilla con la nueva categoría y secuencia**
    const updatePromises = templates.map((t) =>
      Template.findByIdAndUpdate(t.templateId, { category: categoryId, sequence: t.sequence }, { new: true })
    );
    await Promise.all(updatePromises);

    res.status(200).json({ message: "Categoría actualizada exitosamente", category });
  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    res.status(500).json({ message: "Hubo un error al actualizar la categoría", error: error.message });
  }
};

// Eliminar una categoría y limpiar plantillas
categoryController.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Categoría no encontrada" });

    // **Eliminar la categoría de todas las plantillas asociadas**
    await Template.updateMany({ category: categoryId }, { $unset: { category: "", sequence: "" } });

    // **Eliminar la categoría**
    await Category.findByIdAndDelete(categoryId);

    res.status(200).json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar la categoría:", error);
    res.status(500).json({ message: "Hubo un error al eliminar la categoría", error });
  }
};

module.exports = categoryController;
