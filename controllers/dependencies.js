const axios = require('axios');
const Dependency = require('../models/dependencies');

const dependencyController = {}

DEPENDENCIES_ENDPOINT = process.env.DEPENDENCIES_ENDPOINT;

dependencyController.loadDependencies = async (req, res) => {
    await axios.get(DEPENDENCIES_ENDPOINT)
    .then(response => {
        return response.data.map(dependency => {
            console.log(dependency)
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

// Get all dependencies existing into the DB
dependencyController.getDependencies = async (req, res) => {
    const dependencies = await Dependency.find();
    res.status(200).json(dependencies);
}

module.exports = dependencyController
