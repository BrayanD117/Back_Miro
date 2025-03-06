const axios = require("axios");
const Dependency = require("../models/dependencies");
const dependencyService = require("../services/dependency"); // Import the correct service
const User = require("../models/users");
const UserService = require("../services/users");
const publishedTemplates = require("../models/publishedTemplates");
const producerReports = require("../models/producerReports");
const { Types } = require("mongoose");
const Validator = require("./validators.js");
const ValidatorModel = require("../models/validators");
const Template = require("../models/templates.js");

const dependencyController = {};

DEPENDENCIES_ENDPOINT = process.env.DEPENDENCIES_ENDPOINT;

dependencyController.getTemplates = async (req, res) => {
  try {
    const { id } = req.params; 
    let { periodId } = req.query; 

    if (!id || !periodId) {
      return res.status(400).json({ error: "Dependency ID and period ID are required." });
    }

    const dependency = await Dependency.findById(id, "dep_code");
    if (!dependency) {
      return res.status(404).json({ error: "Dependency not found" });
    }

    console.log("Obteniendo plantillas con:", { dependencyCode: dependency.dep_code, periodId });

    const templates = await dependencyService.getDependencyTemplates(dependency.dep_code, periodId);

    return res.status(200).json(templates);
  } catch (err) {
    console.error("Error fetching templates:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

dependencyController.loadDependencies = async () => {
  await axios
    .get(DEPENDENCIES_ENDPOINT)
    .then((response) => {
      return response.data.map((dependency) => {
        return {
          dep_code: dependency.dep_code,
          name: dependency.dep_name,
          dep_father: dependency.dep_father,
        };
      });
    })
    .then(async (dependencies) => {
      await Dependency.upsertDependencies(dependencies);
    })
    .then(() => {
      console.log("Dependencies loaded/updated successfully");
    })
    .catch((error) => {
      console.error(error);
    });
};

dependencyController.getDependency = async (req, res) => {
  const dep_code = req.body.dep_code;
  try {
    const dependency = await Dependency.findOne({ dep_code });
    res.status(200).json(dependency);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: "Error getting dependency", error: error.message });
  }
};

dependencyController.getDependencyByResponsible = async (req, res) => {
  const email = req.query.email;
  console.log("Fetching dependency for responsible:", email);
  try {
    const dependency = await Dependency.findOne({ responsible: email });
    if (!dependency) {
      console.log(`No dependency found for responsible: ${email}`);
      return res.status(404).json({ status: "Dependency not found" });
    }
    console.log("Found dependency:", dependency);
    res.status(200).json(dependency);
  } catch (error) {
    console.error("Error fetching dependency by responsible:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

dependencyController.getDependencyById = async (req, res) => {
  const { id } = req.params;
  try {
    const dependency = await Dependency.findById(id);

    if (!dependency) {
      return res.status(404).json({ status: "Dependency not found" });
    }


    res.status(200).json({
      dep_code: dependency.dep_code,
      name: dependency.name,
      responsible: dependency.responsible,
      dep_father: dependency.dep_father,
      members: dependency.members,
      visualizers: dependency.visualizers || [] 
    }); 
   } catch (error) {
    console.error("Error fetching dependency by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// update Visualizers 
dependencyController.updateVisualizers = async (req, res) => {
  const { id } = req.params;
  const { visualizers } = req.body;

  try {
    const dependency = await Dependency.findById(id);
    if (!dependency) {
      return res.status(404).json({ status: "Dependency not found" });
    }

    dependency.visualizers = visualizers;
    await dependency.save();

    res.status(200).json({ status: "Visualizers updated successfully" });
  } catch (error) {
    console.error("Error updating visualizers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// get Visualizers 

dependencyController.getVisualizers = async (req, res) => {
  const { id } = req.params;

  try {
    const dependency = await Dependency.findById(id);

    if (!dependency) {
      return res.status(404).json({ status: "Dependency not found" });
    }

    res.status(200).json({ visualizers: dependency.visualizers || [] });
  } catch (error) {
    console.error("Error fetching visualizers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


dependencyController.getAllDependencies = async (req, res) => {
  try {
    const email = req.params.email;
    console.log("Fetching dependencies for user:", email);
    await UserService.findUserByEmail(email);
    const dependencies = await Dependency.find({}, "dep_code name responsible dep_father members visualizers");

    res.status(200).json(dependencies);
  } catch (error) {
    console.error("Error fetching dependencies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all dependencies existing into the DB with pagination
dependencyController.getDependencies = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || "";
  const skip = (page - 1) * limit;

  try {
    const query = search
      ? {
          $or: [
            { dep_code: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
            { responsible: { $regex: search, $options: "i" } },
            { dep_father: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    const dependencies = await Dependency.find(query).skip(skip).limit(limit);
    const total = await Dependency.countDocuments(query);

    res.status(200).json({
      dependencies,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching dependencies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

dependencyController.addUserToDependency = async (dep_code, user) => {
  try {
    try {
      await Dependency.addUserToDependency(dep_code, user);
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

dependencyController.setResponsible = async (req, res) => {
  const { dep_code, email } = req.body;
  try {
    const dependency = await Dependency.findOne({ dep_code });
    if (!dependency) {
      return res.status(404).json({ status: "Dependency not found" });
    }

    // Asigna el email como responsable
    dependency.responsible = email;
    await dependency.save();

    res.status(200).json({ status: "Responsible assigned" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: "Error assigning responsible", error: error.message });
  }
};

dependencyController.updateDependency = async (req, res) => {
  const { id } = req.params;
  const { dep_code, name, responsible, dep_father, producers } = req.body;

  try {
    const dependency = await Dependency.findById(id);
    if (!dependency) {
      return res.status(404).json({ status: "Dependency not found" });
    }

    dependency.dep_code = dep_code;
    dependency.name = name;
    dependency.responsible = responsible;
    dependency.dep_father = dep_father;
    dependency.members = [...new Set([...dependency.members, ...producers])];

    const users = await User.find({ email: { $in: producers } });
    console.log(users);

    await User.updateMany(
      { email: { $in: producers } },
      { $addToSet: { roles: "Productor" } },
      { multi: true }
    );

    await dependency.save();

    res.status(200).json({ status: "Dependency updated" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "Error updating dependency", error: error.message });
  }
};

dependencyController.getMembers = async (req, res) => {
  const dep_code = req.params.dep_code;
  try {
    const dependency = await Dependency.findOne({ dep_code });
    if (!dependency) {
      return res.status(404).json({ status: "Dependency not found" });
    }

    const members = await User.find({ email: { $in: dependency.members } });
    res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

dependencyController.getMembersWithFather = async (req, res) => {
  const dep_code = req.query.dep_code;
  try {
    //const result = await Dependency.getMembersWithFather(dep_code);

    const dependency = await Dependency.findOne({ dep_code: dep_code });

    const father = await Dependency.findOne({
      dep_code: dependency.dep_father,
    });

    members = User.find({ email: { $in: dependency.members } });
    fatherMembers = User.find({ email: { $in: father.members } });

    if (!dependency) {
      return res.status(404).json({ status: "Dependency not found" });
    }

    // const { members, fatherMembers } = result[0];
    res.status(200).json({ members, fatherMembers });
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

dependencyController.getDependencyNames = async (req, res) => {
  try {
    const codes = req.body.codes;
    const dependencies = await Dependency.find({ dep_code: { $in: codes } });
    res.status(200).json(dependencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

dependencyController.getChildrenDependenciesPublishedTemplates = async (req,res) => {
  
  const email = req.query.email;
  const periodId = req.query.periodId;

  try {
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "User not found" });
    }

    const fatherDependency = await Dependency.findOne({ responsible: email });

    console.log(fatherDependency)

    const activeRole = user.activeRole;

    if (activeRole !== "Administrador") {
      if (!fatherDependency || fatherDependency.childrenDependencies.length === 0) {
        return res.status(403).json({ status: "Access denied" });
      }
    }

    const childrenDependenciesPublishedTemplates = await publishedTemplates
      .find({
        "template.producers": { $in: fatherDependency.childrenDependencies },
        period: periodId,
      })
      .populate("period").sort({name:1});

    const filteredTemplates = childrenDependenciesPublishedTemplates.map(
      (template) => {
        const filteredProducers = template.template.producers.filter(
          (producer) =>
            fatherDependency.childrenDependencies.some((childId) =>
              childId.equals(producer)
            )
        );
        return {
          ...template.toObject(),
          template: {
            ...template.template,
            producers: filteredProducers,
          },
        };
      }
    );

    const updated_templates = await Promise.all(
      filteredTemplates.map(async (template) => {
        const validators = await Promise.all(
          template.template.fields.map(async (field) => {
            return Validator.giveValidatorToExcel(field.validate_with);
          })
        );
        validatorsFiltered = validators.filter((v) => v !== undefined);
        template.validators = validatorsFiltered; // Añadir validators al objeto
        const dependencies = await Dependency.find(
          { dep_code: { $in: template.producers_dep_code } },
          "name -_id"
        );
        template.producers_dep_code = dependencies.map((dep) => dep.name);
        template.loaded_data = await Promise.all(
          template.loaded_data.map(async (data) => {
            const loadedDependency = await Dependency.findOne(
              { dep_code: data.dependency },
              "name -_id"
            );
            data.dependency = loadedDependency
              ? loadedDependency.name
              : data.dependency;
            return data;
          })
        );
        return template;
      })
    );

    res.status(200).json({templates:updated_templates});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

dependencyController.getDependencyHierarchy = async (req, res) => {

  const email = req.params.email 

  console.log(email);

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ status: "User not found" });
  }

  const fatherDependency = await Dependency.findOne({ responsible: email });

  if (!fatherDependency) {
    res.status(404).json({message: "User is not leader of any dependency..."})
  }



  fatherDependency.members = await dependencyService.filterValidMembers(fatherDependency.members);

  const dependencies = await Dependency.find();

  const dependencyHierarchy = await dependencyService.getDependencyHierarchy(dependencies, fatherDependency.dep_code)

  console.log(dependencyHierarchy);

  res.status(200).json({
    fatherDependency, 
    childrenDependencies: dependencyHierarchy 
  });

}

module.exports = dependencyController;
