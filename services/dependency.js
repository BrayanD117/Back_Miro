const Dependency = require("../models/dependencies");
const mongoose = require("mongoose");
const PublishedTemplate = require("../models/publishedTemplates");

const getDependencyTemplates = async (depCode, periodId) => {
   try {
    if (!depCode || !periodId) {
      throw new Error("Dependency code and period ID are required.");
    }
    const dependency = await Dependency.findOne({ dep_code: depCode }, "name dep_code");
    if (!dependency) throw new Error("Dependency not found");


    const periodObjectId = mongoose.Types.ObjectId.isValid(periodId)
    ? new mongoose.Types.ObjectId(periodId)
    : periodId;
    
    const templates = await PublishedTemplate.find(
      {  "template.producers" : dependency._id, period: periodObjectId  },
      { name: 1, _id: 1, period: 1  } // Only return "name", hide "_id"
    ).sort({name: 1});

   return { 
      dependencyId: dependency._id, 
      dependencyCode: depCode, 
      dependencyName: dependency.name, 
      templates 
    };
  } catch (err) {
    throw new Error("Error fetching templates: " + err.message);
  }
};

const getDependencyHierarchy = (dependencies, depFatherCode = null) => {
    return dependencies.filter(dep => dep.dep_father === depFatherCode)
    .map(dep => ({
      ...dep.toObject(),
      children: getDependencyHierarchy(dependencies, dep.dep_code)
    }))
}

module.exports = { getDependencyTemplates, getDependencyHierarchy };
