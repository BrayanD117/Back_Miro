const mongoose = require('mongoose');
const User = require('./users');

const dependencySchema = new mongoose.Schema({
    dep_code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    members: {
        type: [String]
    },
    responsible: {
        type: String
    },
    dep_father: {
        type: String
    },
    visualizers: {
        type: [String], 
        default: []
    }
},
{
    versionKey: false,
    timestamps: true
});

// Middleware pre-save para validar el email
dependencySchema.pre('save', async function(next) {
    if (this.isModified('responsible')) { // Verifica si el campo 'responsible' ha sido modificado
        try {
            const user = await User.findOne({ email: this.responsible });
            if (!user) {
                return next(new Error('User not found'));
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// udpdate visualizers
dependencySchema.statics.updateVisualizers = async function(dep_code, visualizers) {
    try {
        const dependency = await this.findOne({ dep_code });
        if (!dependency) {
            throw new Error('Dependency not found');
        }

        dependency.visualizers = visualizers;
        await dependency.save();
        return dependency;
    } catch (error) {
        console.error("Error updating visualizers:", error);
        throw error;
    }
};
dependencySchema.statics.upsertDependencies = async function(dependencies) {
    const bulkOps = dependencies.map(dep => ({
        updateOne: {
            filter: { dep_code: dep.dep_code },
            update: { $set: dep },
            upsert: true // Realiza una operación de upsert
        }
    }));

    await this.bulkWrite(bulkOps);

    const newDepCodes = dependencies.map(dep => dep.dep_code);
    await this.updateMany(
        { dep_code: { $nin: newDepCodes } },
        { $set: { active: false } }
    );
};

dependencySchema.statics.addUserToDependency = async function(dep_code, user) {
    try {
        // Buscar si el usuario ya está en la dependencia especificada
        const currentDependency = await this.findOne({ dep_code, members: user });

        if (currentDependency) {
            return;
        }

        // Eliminar al usuario de cualquier otra dependencia en la que se encuentre actualmente
        await this.updateMany(
            { members: user },
            { $pull: { members: user } }
        );

        // Añadir al usuario a la nueva dependencia
        const newDependency = await this.findOne({ dep_code });
        if (!newDependency) {
            console.log("Specified dependency not found");
            return;
        }

        newDependency.members.push(user);
        await newDependency.save();
        console.log("User added to the specified dependency");

    } catch (error) {
        console.error(error);
    }
};

dependencySchema.statics.getMembersWithFather = async function(dep_code) {
    return this.aggregate([
        // Filtra las dependencias por el código de dependencia especificado
        { $match: { dep_code } },
        {
            $lookup: {
                from: "users",
                localField: "members",
                foreignField: "email",
                as: "members"
            }
        },
        {
            $lookup: {
                from: "dependencies",
                localField: "dep_father",
                foreignField: "dep_code",
                as: "father"
            }
        },
        // Desenreda la dependencia padre, si existe
        { $unwind: { path: "$father", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "users",
                let: { fatherMembers: "$father.members" },
                pipeline: [
                    { $match: { $expr: { $in: ["$email", "$$fatherMembers"] } } }
                ],
                as: "fatherMembers"
            }
        },
        {
            $project: {
                members: 1,
                fatherMembers: 1
            }
        }
    ]);
};

dependencySchema.statics.getWithChildren = async function(dep_code) {
    return this.findOne({ dep_code })
        .populate("childDependencies") // Fetch child dependencies
        .exec();
};


module.exports = mongoose.model('dependencies', dependencySchema);
