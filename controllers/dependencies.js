const axios = require('axios');
const Dependency = require('../models/dependencies');

const dependencyController = {}

DEPENDENCIES_ENDPOINT = process.env.DEPENDENCIES_ENDPOINT;

dependencyController.loadDependencies = async (req, res) => {
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
    .then(async (dependencies) => { await Dependency.insertMany(dependencies) } )
    .then(() => { res.status(200).send("Dependencies loaded")})
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

// Get all dependencies existing into the DB
dependencyController.getDependencies = async (req, res) => {
    const dependencies = await Dependency.find();
    res.status(200).json(dependencies);
}

dependencyController.addUserToDependency = async (dep_code, user) => {
    try {

        const dependency = await Dependency.findOne({
            dep_code
        });

        if(!dependency.members.$isEmpty && dependency.members.includes(user)) {
            console.log("User already exists in dependency")
            return;
        }
        dependency.members.push(user);
        await dependency.save();
        console.log("User added to dependency")

    } catch (error) {
        console.log(error)
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

module.exports = dependencyController
