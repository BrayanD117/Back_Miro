const mongoose = require('mongoose')

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
        type: [String],
        required: true
    }
},
{
    versionKey: false,
    timestamps: true
}
);

module.exports = mongoose.model('dependency', dependencySchema);