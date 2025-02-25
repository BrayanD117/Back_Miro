const Template = require("../models/templates");
const Dependency = require("../models/dependencies");

const getDependencyTemplates = async (dependencyId) => {
  try {
    // Fetch the dependency's name
    const dependency = await Dependency.findById(dependencyId, "name");
    if (!dependency) throw new Error("Dependency not found");

    const templates = await Template.find(
      { producers: dependencyId },
      { name: 1, _id: 1 } // Only return "name", hide "_id"
    ).sort({name: 1});
    return { dependencyName: dependency.name, templates };
  } catch (err) {
    throw new Error("Error fetching templates: " + err.message);
  }
};

module.exports = { getDependencyTemplates };
