const Dependency = require("../models/dependencies");
const User = require("../models/users");
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
      { name: 1, _id: 1, period: 1 , loaded_data: 1 } // Only return "name", hide "_id"
    ).sort({name: 1});

    const processedTemplates = templates.map(template => ({
      _id: template._id,
      name: template.name,
      period: template.period,
      isSent: template.loaded_data.some(data => data.dependency === depCode) // Check if depCode exists in loaded_data
    }));

   return { 
      dependencyId: dependency._id, 
      dependencyCode: depCode, 
      dependencyName: dependency.name, 
      templates: processedTemplates 
    };
  } catch (err) {
    throw new Error("Error fetching templates: " + err.message);
  }
};

const getDependencyHierarchy = async (dependencies, depFatherCode = null) => {
  const filteredDependencies = dependencies.filter(dep => dep.dep_father === depFatherCode);
  return await Promise.all(filteredDependencies.map(async (dep) => {
    return {
      ...dep.toObject(),
      members: await filterValidMembers(dep.members), // Filter members for each dependency
      children: await getDependencyHierarchy(dependencies, dep.dep_code),
    };
  }));
}

// Function to get only the members of the dependency that at least have more than one role (that is, they already have some function assigned in the platform)
const filterValidMembers = async (members) => {
  const validMembers = await User.find({ email: { $in: members }, "roles.1": { $exists: true } }).select("email");
  return validMembers.map((user) => user.email);
};


module.exports = { getDependencyTemplates, getDependencyHierarchy, filterValidMembers };
