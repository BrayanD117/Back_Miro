const Template = require('../models/templates');
const Dependency = require('../models/dependencies');
const axios = require('axios');

class DependencyService {
  static async getDependencyTemplates(dependencyId) {
    try {
      const templates = await Template.find({ producers: dependencyId })
        .populate('producers');
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
