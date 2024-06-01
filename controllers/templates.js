const Plantilla = require('../models/plantilla.model'); // Ajusta el path según tu estructura de proyecto

const plantillaController = {};

plantillaController.getPlantillas = async (req, res) => {
    try {
        const plantillas = await Plantilla.find();
        res.status(200).json(plantillas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener las plantillas', error });
    }
};

plantillaController.getPlantilla = async (req, res) => {
    try {
        const { id } = req.body;
        const plantilla = await Plantilla.findById(id);
        if (!plantilla) {
            return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
        }
        res.status(200).json(plantilla);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la plantilla', error });
    }
};

plantillaController.createPlantilla = async (req, res) => {
    try {
        const plantilla = new Plantilla(req.body);
        await plantilla.save();
        res.status(200).json({ status: 'Plantilla creada' });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear la plantilla', error });
    }
};


// TODO: Implementar la actualización de plantillas validando que no tenga ninguna plantilla publicada asociada
// plantillaController.updatePlantilla = async (req, res) => {
//     try {
//         const { id, ...updateData } = req.body;
//         const plantillaActualizada = await Plantilla.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
//         if (!plantillaActualizada) {
//             return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
//         }
//         res.status(200).json({ status: 'Plantilla actualizada', plantillaActualizada });
//     } catch (error) {
//         res.status(400).json({ mensaje: 'Error al actualizar la plantilla', error });
//     }
// };

plantillaController.deletePlantilla = async (req, res) => {
    try {
        const { id } = req.body;
        const plantillaEliminada = await Plantilla.findByIdAndDelete(id);
        if (!plantillaEliminada) {
            return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
        }
        res.status(200).json({ status: 'Plantilla eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar la plantilla', error });
    }
};

module.exports = plantillaController;
