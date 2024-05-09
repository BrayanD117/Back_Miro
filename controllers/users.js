require('dotenv').config()
//const { loadEnvFile } = require("process");
const axios = require('axios');
const User = require('../models/users');

const userController = {}

USERS_ENDPOINT = process.env.USERS_ENDPOINT;

userController.loadUsers = async (req, res) => {
    await axios.get(USERS_ENDPOINT)
    .then(response => {
        return response.data.map(user => {
            return {
                id: user.identification,
                full_name: user.full_name,
                email: user.code_user+"@unibague.edu.co",
                position: user.position
            };
        });
    })
    .then(async (users) => { await User.insertMany(users) } )
    .then(() => { res.status(200).send("Users loaded")})
    .catch(error => {
        console.error(error);
    });
}

// Get all users existing into the DB
userController.getUsers = async (req, res) => {
    const users = await User.find();
    res.status(200).json(users);
}

// Receives de UUID generated from DB
userController.updateUser = async (req, res) => {
    const id = req.body.id

    try {
        const user = await User.findByIdAndUpdate(id, {roles: req.body.roles}, {new: true})
        res.status(200).json({user})
    } catch {
        res.json({status: "Something wrong"})
    }

    
}

module.exports = userController
