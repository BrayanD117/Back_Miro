const Template = require('../models/templates');

const getDependencyTemplates = async (dependencyId) => {
    try{
        const templates = await Template.find({producers: dependencyId}).
        populate('producers');
        return templates
    } catch (err){
        throw new Error ('Error fetching templates: ' + err.message)
    }
}

module.exports= {getDependencyTemplates}
