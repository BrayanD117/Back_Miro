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

// Get all users existing into the DB with pagination
userController.getUsersPagination = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        const users = await User.find().skip(skip).limit(limit);
        const total = await User.countDocuments();

        res.status(200).json({
            users,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all users existing into the DB
userController.getUsers = async (req, res) => {
    const users = await User.find();
    res.status(200).json(users);
}

userController.getUser = async (req, res) => {
    const email = req.body.email;
    const user = await User.findOne({email});
    res.status(200).json(user);
}

userController.getUserRoles = async (req, res) => {
    const email = req.query.email;
    try {
        const user = await User.findOne({ email });
        if (user) {
            res.status(200).json({ roles: user.roles });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Receives de UUID generated from DB
userController.updateUserRoles = async (req, res) => {
    const id = String(req.body.id)

    try {
        const user = await User.findByIdAndUpdate(id, {roles: req.body.roles}, {new: true})
        res.status(200).json({user})
    } catch {
        res.json({status: "Something wrong"})
    }
    
}

userController.updateUserActiveRole = async (req, res) => {
    const email = req.body.email;
    const activeRole = req.body.activeRole;

    try {
        const user = await User.findOneAndUpdate(
            { email },
            { activeRole },
            { new: true }
        );
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = userController
