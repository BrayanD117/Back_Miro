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

module.exports = mongoose.model('Dependency', dependencySchema);
