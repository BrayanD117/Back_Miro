const axios = require('axios');
const Dependency = require('../models/dependencies');
const User = require('../models/users');

const dependencyController = {}

DEPENDENCIES_ENDPOINT = process.env.DEPENDENCIES_ENDPOINT;

dependencyController.loadDependencies = async () => {
    await axios.get(DEPENDENCIES_ENDPOINT)
    .then(response => {
        return response.data.map(dependency => {
            return {
                dep_code: dependency.dep_code,
                name: dependency.dep_name,
                dep_father: dependency.dep_father
            };
        });
    })
    .then(async (dependencies) => { await Dependency.upsertDependencies(dependencies) } )
    .then(() => { console.log("Dependencies loaded/updated successfully")})
    .catch(error => {
        console.error(error);
    });
}

dependencyController.getDependency = async (req, res) => {
    const dep_code = req.body.dep_code;
    try {
        const dependency = await Dependency.findOne({ dep_code });
        res.status(200).json(dependency);
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error getting dependency", error: error.message });
    }
}

// Get all dependencies existing into the DB with pagination
dependencyController.getDependencies = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    try {
        const query = search
            ? {
                $or: [
                    { dep_code: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                    { responsible: { $regex: search, $options: 'i' } },
                    { dep_father: { $regex: search, $options: 'i' } }
                ]
            }
            : {};
        const dependencies = await Dependency.find(query).skip(skip).limit(limit);
        const total = await Dependency.countDocuments(query);

        res.status(200).json({
            dependencies,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching dependencies:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

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
}

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
        res.status(500).json({ status: "Error assigning responsible", error: error.message });
    }
}

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

        await dependency.save();

        res.status(200).json({ status: "Dependency updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "Error updating dependency", error: error.message });
    }
}

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
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

dependencyController.getMembersWithFather = async (req, res) => {
    const dep_code = req.body.dep_code;
    try {
        const result = await Dependency.getMembersWithFather(dep_code);

        if (result.length === 0) {
            return res.status(404).json({ status: "Dependency not found" });
        }

        const { members, fatherMembers } = result[0];
        res.status(200).json({ members, fatherMembers });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

dependencyController.getDependencyNames = async (req, res) => {
    const dep_codes = req.body.dep_codes;
    try {
      const dependencies = await Dependency.find({ dep_code: { $in: dep_codes } });
      const depNames = {};
      dependencies.forEach(dep => {
        depNames[dep.dep_code] = dep.name;
      });
      res.status(200).json(depNames);
    } catch (error) {
      console.error('Error fetching dependency names:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };  

module.exports = dependencyController;
