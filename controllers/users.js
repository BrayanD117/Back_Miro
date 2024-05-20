//const { loadEnvFile } = require("process");
const axios = require('axios');
const User = require('../models/users');
const dependencyController = require('./dependencies.js')

const userController = {}

USERS_ENDPOINT = process.env.USERS_ENDPOINT;

userController.addExternalUser = async (req, res) => {
    const user = new User( req.body )
    await user.save();
    res.status(200).json({status: "User created"});
}

userController.loadUsers = async (req, res) => {
    await axios.get(USERS_ENDPOINT)
    .then(response => {
        return response.data.map(user => {
            dependencyController.addUserToDependency(user.dep_code, user.identification);
            return {
                identification: user.identification,
                full_name: user.full_name,
                email: user.code_user+"@unibague.edu.co",
                position: user.position
            };
        });
    })
    .then(async (users) => { await User.insertMany(users) })
    .then(() => { res.status(200).send("Users loaded")})
    .catch(error => {
        console.error(error);
    });
}

// Get all users existing into the DB with pagination
userController.getUsersPagination = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    try {
        const query = search
            ? { full_name: { $regex: search, $options: 'i' } }
            : {};
        const users = await User.find(query).skip(skip).limit(limit);
        const total = await User.countDocuments(query);

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
            res.status(200).json({ roles: user.roles, activeRole: user.activeRole });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

userController.getResponsibles = async (req, res) => {
    try {
      const responsibles = await User.find({ roles: "Responsable" });
      res.status(200).json(responsibles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
userController.updateUserRoles = async (req, res) => {
    const email = req.body.email;
    const roles = req.body.roles;

    try {
        const user = await User.findOneAndUpdate(
            { email },
            { roles },
            { new: true }
        );
        res.status(200).json({ user });
    } catch (error){
        console.log(error)
        res.status(404).json({status: "Something wrong"})
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
