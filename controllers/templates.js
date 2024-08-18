const Template = require('../models/templates');
const User = require('../models/users');
const Dimension = require('../models/dimensions');
const Validator = require('./validators')

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

        const templatesWithValidators = await Promise.all(
            templates.map(async (template) => {
              const validators = await Promise.all(
                template.fields.map(async (field) => {
                  return Validator.giveValidatorToExcel(field.validate_with);
                })
              );
      
              template = template.toObject();
              validatorsFiltered = validators.filter(v => v !== undefined)
              template.validators = validatorsFiltered // Añadir validators al objeto
      
              return template;
            })
        );

        res.status(200).json({
            templates: templatesWithValidators,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

templateController.getPlantillasByCreator = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const email = req.query.email;
    const skip = (page - 1) * limit;

    try {
        const dimensions = await Dimension.find({ responsible: email });

        const query = {
            dimension: { $in: dimensions.map(dimension => dimension._id) },
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { file_name: { $regex: search, $options: 'i' } },
                { file_description: { $regex: search, $options: 'i' } },
            ],
        };
        const templates = await Template.find(query).skip(skip).limit(limit);
        const total = await Template.countDocuments(query);

        const templatesWithValidators = await Promise.all(
            templates.map(async (template) => {
              const validators = await Promise.all(
                template.fields.map(async (field) => {
                  return Validator.giveValidatorToExcel(field.validate_with);
                })
              );
      
              template = template.toObject();
              validatorsFiltered = validators.filter(v => v !== undefined)
              template.validators = validatorsFiltered // Añadir validators al objeto
      
              return template;
            })
          );

        res.status(200).json({
            templates: templatesWithValidators,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching templates by creator:', error);
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
        const existingTemplate = await Template.findOne({ name: new RegExp(`^${req.body.name}$`, 'i') });
        if (existingTemplate) {
            return res.status(400).json({ mensaje: 'El nombre de la plantilla ya existe. Por favor, elija otro nombre.' });
        }

        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const plantilla = new Template({ ...req.body, created_by: user });
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
