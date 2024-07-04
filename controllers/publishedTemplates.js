const PublishedTemplate = require('../models/publishedTemplates.js');
const Template = require('../models/templates.js')
const Period = require('../models/periods.js')
const Dimension = require('../models/dimensions.js')
const Dependency = require('../models/dependencies.js')
const User = require('../models/users.js')

const mongoose = require('mongoose');


const publTempController = {};

publTempController.publishTemplate = async (req, res) => {
    console.log(req.body)
    template_id = req.body.template_id
    email = req.body.user_email

    try {
        const template = await Template.findById(template_id)
        if(!template) {
            return res.status(404).json({status: 'Template not found'})
        }

        const user = await User.findOne({email})

        // Name => Recibe el nombre de la plantilla (modificable) + period_name
        const newPublTemp = new PublishedTemplate({
            name: req.body.name,
            published_by: user,
            template: template,
            period: req.body.period_id,
            producers_dep_code: req.body.producers_dep_code,
            dimension_id: req.body.dimension_id
        })

        await newPublTemp.save()

        return res.status(201).json({status: 'Template published successfully'})
    } catch (error) {
        return res.status(500).json({status: error.message})
    }
}

publTempController.getAssignedTemplatesToProductor = async (req, res) => {
    const email = req.query.email
    try {
        const user = await User.findOne({email})
        if(!user || !user.roles.includes('Productor')) {
            return res.status(404).json({status: 'User not found'})
        }

        const templates = await PublishedTemplate.find({'producers_dep_code': user.dep_code}).populate('period').populate('dimension_id')

        return res.status(200).json(templates)
        
    } catch (error) {
            
    }
}

publTempController.feedOptionsToPublishTemplate = async (req, res) => {
    const email = req.query.email;

    try {
        const dimension = await Dimension.findOne({ responsible: email });
        if (!dimension) {
            return res.status(404).json({ status: 'Dimension not found' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: 'User not found' });
        }
        if (!dimension.producers.includes(user.dep_code) && !user.roles.includes('Administrador' || 'Responsable')) {
            return res.status(403).json({ status: 'User is not responsible of this dimension' });
        }

        // Get active periods
        const periods = await Period.find({ is_active: true });

        // Get dependencie producers
        const producers = await Dependency.find({ dep_code: { $in: dimension.producers } });

        res.status(200).json({ periods, producers });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: 'Internal server error', details: error.message });
    }
}


// Editar publishedTemplate (Productores)


module.exports = publTempController;
