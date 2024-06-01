//const { loadEnvFile } = require("process");
const axios = require('axios');
const User = require('../models/users');
const dependencyController = require('./dependencies.js')

const userController = {}

USERS_ENDPOINT = process.env.USERS_ENDPOINT;

const roles = ["Administrador", "Responsable", "Productor","Usuario"];

userController.addExternalUser = async (req, res) => {
    const dep_code = req.body.dep_code;

    const email = req.body.email;

    await dependencyController.addUserToDependency(dep_code, email);
    console.log(req.body)
    const user = new User( req.body )
    await user.save();
    res.status(200).json({status: "User created"});
}

userController.loadUsers = async (req, res) => {
    await axios.get(USERS_ENDPOINT)
    .then(response => {
        return response.data.map(user => {
            return {
                identification: user.identification,
                full_name: user.full_name,
                email: user.code_user+"@unibague.edu.co",
                position: user.position,
                dep_code: user.dep_code,
            };
        });
    })
    .then(async (users) => { 
        await User.insertMany(users);
        for (const user of users) {
            await dependencyController.addUserToDependency(user.dep_code, user.email);
        }
    })
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
            ? {
                $or: [
                    { identification: !isNaN(Number(search)) ? Number(search) : undefined },
                    { full_name: { $regex: search, $options: 'i' } },
                    { position: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { roles: { $regex: search, $options: 'i' } }
                ].filter(condition => condition !== undefined)
            }
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
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
    const roles = Array.from(req.body.roles);
    try {
        if(!validateRoles(roles)) {
            throw new Error("Invalid roles");
        }
        const user = await User.findOneAndUpdate(
            { email },
            { roles },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error){
        res.status(500).json({ error: error.message });
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
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const validateRoles = (userRoles) => {
    return userRoles.every(role => roles.includes(role));
}

module.exports = userController
