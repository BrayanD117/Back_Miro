const AccordionSection = require('../models/homeInfo');

exports.getAllSections = async (req, res) => {
  try {
    const sections = await AccordionSection.find().sort({ order: 1 });
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las secciones', error });
  }
};

exports.createSection = async (req, res) => {
  const { title, description, order } = req.body;
  try {
    const newSection = new AccordionSection({ title, description, order });
    await newSection.save();
    res.status(201).json(newSection);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear la sección', error });
  }
};

exports.updateSection = async (req, res) => {
  const { id } = req.params;
  const { title, description, order } = req.body;
  try {
    const updatedSection = await AccordionSection.findByIdAndUpdate(
      id,
      { title, description, order, updated_at: Date.now() },
      { new: true }
    );
    if (!updatedSection) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }
    res.status(200).json(updatedSection);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar la sección', error });
  }
};

exports.deleteSection = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedSection = await AccordionSection.findByIdAndDelete(id);
    if (!deletedSection) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }
    res.status(200).json({ message: 'Sección eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la sección', error });
  }
};
