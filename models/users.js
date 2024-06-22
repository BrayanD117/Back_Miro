const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

    identification: {
        type: Number,
        index: true,
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    roles: {
        type: [String],
        default: ["Usuario"]
    },
    activeRole: {
        type: String,   
        default: "Usuario",
      },
    email: {
        type: String,
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    dep_code: String
    
},
{
    versionKey: false,
    timestamps: true
}
);

userSchema.statics.syncUsers = async function (externalUsers) {
    const User = this;

    // Create a set of emails from external users for efficient look-up
    const emailSet = new Set(externalUsers.map(user => user.email));

    // Use bulkWrite to perform upsert operations
    const updateOps = externalUsers.map(externalUser => ({
        updateOne: {
            filter: { email: externalUser.email },
            update: { $set: { ...externalUser, isActive: true } },
            upsert: true
        }
    }));

    // Perform bulkWrite for upserting users
    await User.bulkWrite(updateOps);

    // Deactivate users not in the external users list
    await User.updateMany(
        { email: { $nin: Array.from(emailSet) } },
        { $set: { isActive: false } }
    );
};

module.exports = mongoose.model('users', userSchema);