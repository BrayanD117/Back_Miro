const Template = require('../models/templates');

const templateController = {};

templateController.getPlantillas = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    try {
        const query = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { file_name: { $regex: search, $options: 'i' } },
                    { file_description: { $regex: search, $options: 'i' } },
                ]
            }
            : {};
        const templates = await Template.find(query).skip(skip).limit(limit);
        const total = await Template.countDocuments(query);

        res.status(200).json({
            templates,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

templateController.getPlantilla = async (req, res) => {
    try {
        const { id } = req.params;
        const plantilla = await Template.findById(id);
        if (!plantilla) {
            return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
        }
        res.status(200).json(plantilla);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la plantilla', error });
    }
};

templateController.createPlantilla = async (req, res) => {
    try {
        // Convertir el nombre de la plantilla a minúsculas para la comparación
        const existingTemplate = await Template.findOne({ name: new RegExp(`^${req.body.name}$`, 'i') });
        if (existingTemplate) {
            return res.status(400).json({ mensaje: 'El nombre de la plantilla ya existe. Por favor, elija otro nombre.' });
        }

        const plantilla = new Template(req.body);
        await plantilla.save();
        res.status(200).json({ status: 'Plantilla creada' });
    } catch (error) {
        console.error('Error al crear la plantilla:', error);
        if (error.name === 'ValidationError') {
            const mensajesErrores = {};
            for (let campo in error.errors) {
                mensajesErrores[campo] = error.errors[campo].message;
            }
            res.status(400).json({ mensaje: 'Error al crear la plantilla', errores: mensajesErrores });
        } else {
            res.status(500).json({ mensaje: 'Error interno del servidor', error });
        }
    }
};

templateController.updatePlantilla = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedTemplate = await Template.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedTemplate) {
            return res.status(404).json({ error: "Plantilla no encontrada" });
        }
        res.status(200).json(updatedTemplate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

templateController.deletePlantilla = async (req, res) => {
    try {
        const { id } = req.body;
        const plantillaEliminada = await Template.findByIdAndDelete(id);
        if (!plantillaEliminada) {
            return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
        }
        res.status(200).json({ status: 'Plantilla eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar la plantilla', error });
    }
};

module.exports = templateController;
