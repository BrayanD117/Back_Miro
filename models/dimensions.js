const mongoose = require('mongoose')
const User = require('./users');
const Dependency = require('./dependencies');

const dimensionSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        unique: true
    },
    responsible: {
        type: String,
        required: true,
    },
    producers: {
        type: [String],
    },
    templates: {
        type: [String],
    },
    published_templates: {
        type: [String],
    }
},
{
    versionKey: false,
    timestamps: true
}
);

dimensionSchema.pre('save', async function(next) {
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

    if (this.isModified('producers') && this.producers.length > 0) { // Verifica si el campo 'responsible' ha sido modificado
        try {
            for (let i = 0; i < this.producers.length; i++) {
                const producerDepCode = this.producers[i];
                const dependency = await Dependency.findOne({ dep_code: producerDepCode });
                if (!dependency) {
                    return next(new Error(`Producer with dep_code ${producerDepCode} not found`));
                }
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('dimension', dimensionSchema);