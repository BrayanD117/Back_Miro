//const { loadEnvFile } = require("process");
const axios = require('axios');
const User = require('../models/users');
const Dependency = require('../models/dependencies');
const dependencyController = require('./dependencies.js');
const { default: mongoose } = require('mongoose');

const userController = {}

USERS_ENDPOINT = process.env.USERS_ENDPOINT;

const roles = ["Administrador", "Responsable", "Productor","Usuario"];

userController.addExternalUser = async (req, res) => {
    const dep_code = req.body.dep_code;

    const email = req.body.email;

    await dependencyController.addUserToDependency(dep_code, email);
    const user = new User( req.body )
    await user.save();
    res.status(200).json({status: "User created"});
}

userController.loadUsers = async (req, res) => {
    try {
        dependencyController.loadDependencies();

        const response = await axios.get(USERS_ENDPOINT);

        const usersMigrated = await User.find({ migrated: true });

        const externalUsers = response.data
            .filter(user => user.code_user && user.code_user.trim() !== "" && 
                !usersMigrated.some(migratedUser => migratedUser.email === user.email)
          )
            .map(user => ({
                identification: user.identification,
                full_name: user.full_name,
                email: user.email,
                position: user.position,
                dep_code: user.dep_code,
            }));

        // Handle dependency updates concurrently
        await Promise.all(
            externalUsers.map(async (externalUser) => {
                try {
                    await dependencyController.addUserToDependency(externalUser.dep_code, externalUser.email);
                } catch (error) {
                    console.error(`Error processing user ${externalUser.email}:`, error);
                }
            })
        );

        // Sync users
        await User.syncUsers(externalUsers);

        // await userController.deleteDeactivatedUsersFromDependency();

        res.status(200).send("Users synchronized");
    } catch (error) {
        console.error('Error during user synchronization:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

userController.deleteDeactivatedUsersFromDependency = async () => {
  try {
    const users = await User.find({ isActive: false });
    const dependencies = await Dependency.find();
    const updatePromises = dependencies.map(async (dependency) => {
        dependency.members = dependency.members.filter(member => !users.some(user => user.email === member));
        await dependency.save();
    });
    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error removing users from dependencies:", error);
  }
};

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
    const email = req.query.email; 
    try {
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(404).json({ error: "User not found or inactive" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};


userController.getUserToImpersonate = async (req, res) => {
    const id = req.query.id; 
    try {
        const user = await User.findOne({ _id: id });
        if (!user) {
            return res.status(404).json({ error: "User not found in DB" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

userController.getUserRoles = async (req, res) => {
    const email = req.query.email;
    try {
        const user = await User.findOne({ email, isActive: true });
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
  
userController.getProducers = async (req, res) => {
    try {
        const producers = await User.find({ roles: "Productor" });
        res.status(200).json(producers);
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

userController.updateUsersToProducer = async (req, res) => {
    const rolesToUpdate = req.body;
    try {
        const updatePromises = rolesToUpdate.map(async ({ email, roles }) => {
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error(`User not found: ${email}`);
        }

        const updatedRoles = new Set(user.roles);

        if (roles.includes("Productor")) {
            updatedRoles.add("Productor");
        } else {
            updatedRoles.delete("Productor");
        }

        user.roles = Array.from(updatedRoles);
        await user.save();

        return user;
        });

        const updatedUsers = await Promise.all(updatePromises);

        res.status(200).json({ message: "Roles updated successfully", users: updatedUsers });
    } catch (error) {
        console.error("Error updating roles:", error);
        res.status(500).json({ error: error.message });
    }
};

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

userController.updateUserStatus = async (req, res) => {
    const { userId, isActive } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { isActive },
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

userController.getUsersByDependency = async (req, res) => {
    const { dep_code } = req.params;
    try {
        const users = await User.find({ dep_code });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users by dependency:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

userController.migrateUserDependecy = async (req, res) => {
  const { email, dep_code, new_dep_code } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    if (user.dep_code !== dep_code) {
      throw new Error("User dependency mismatch");
    }
    user.dep_code = new_dep_code;
    user.migrated = true;
    await user.save(session);
    const dependency = await Dependency.findOne({ dep_code });
    dependency.members = dependency.members.filter(member => member !== email);
    await dependency.save(session);

    const newDependency = await Dependency.findOne({ dep_code: new_dep_code });
    newDependency.members.push(email);
    await newDependency.save(session);
    
    await session.commitTransaction();
    res.status(200).json({ user });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
}

const validateRoles = (userRoles) => {
    return userRoles.every(role => roles.includes(role));
}

module.exports = userController
