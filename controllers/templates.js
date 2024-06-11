const Template = require('../models/templates'); // Ajusta el path según tu estructura de proyecto

const templateController = {};

templateController.getPlantillas = async (req, res) => {
    try {
        const plantillas = await Template.find();
        res.status(200).json(plantillas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener las plantillas', error });
    }
};

templateController.getPlantilla = async (req, res) => {
    try {
        const { id } = req.body;
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
        console.log(req.body)
        const plantilla = new Template(req.body);
        await plantilla.save();
        res.status(200).json({ status: 'Plantilla creada' });
    } catch (error) {
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

//TODO Validar antes de borrar que no tenga ninguna plantilla publicada asociada
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
