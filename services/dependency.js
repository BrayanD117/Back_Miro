const Template = require('../models/templates');
const Dependency = require('../models/dependencies');
const axios = require('axios');

class DependencyService {
  static async getDependencyTemplates(dependencyId) {
    try {
      // Asegúrate de poblar las referencias de 'fields', 'dimensions' y 'producers'
      const templates = await Template.find({ producers: dependencyId })
        .populate('fields')    // Poblar las referencias de los campos, si es necesario
        .populate('dimensions') // Poblar las dimensiones relacionadas
        .populate('producers')  // Poblar los productores (usuarios o dependencias relacionadas)
        .exec();                // Usar `.exec()` para ejecutar la consulta correctamente
  
      return templates;
    } catch (err) {
      throw new Error('Error fetching templates: ' + err.message);
    }
  }
  
  

  static async giveDependenciesToKeep() {
    try {
      const response = await axios.get(process.env.DEPENDENCIES_ENDPOINT);
      const depCodes = response.data.map(dependency => dependency.dep_code);
      const existingDocuments = await Dependency.find({ dep_code: { $in: depCodes } });
      return existingDocuments;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = DependencyService;
