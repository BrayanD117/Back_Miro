const mongoose = require('mongoose')

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

module.exports = mongoose.model('dimension', dimensionSchema);