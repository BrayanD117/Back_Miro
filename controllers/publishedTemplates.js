const PublishedTemplate = require('../models/publishedTemplates.js');
const Template = require('../models/templates.js')
const Period = require('../models/periods.js')
const Dimension = require('../models/dimensions.js')
const User = require('../models/users.js')

const publTempController = {};

publTempController.publishTemplate = async (req, res) => {
    template_id = req.body.template_id
    period_id = req.body.period_id
    dimension_id = req.body.dimension_id

    try {
        const template = await Template.findById(template_id)
        if(!template) {
            return res.status(404).json({status: 'Template not found'})
        }

        const period = await Period.findById(period_id)
        if(!period) {
            return res.status(404).json({status: 'Period not found'})
        }

        const dimension_id = await Dimension.findById
    }

}

module.exports = publTempController;
