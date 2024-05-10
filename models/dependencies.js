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
    users: {
        type: [String],
        required: true
    },
    dep_father: {
        type: String
    },
},
{
    versionKey: false,
    timestamps: true
}
);

module.exports = mongoose.model('dependency', dependencySchema);