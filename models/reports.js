const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: false
    },
    report_example_id: {
        type: String
    },
    report_example_link: {
        type: String
    },
    report_example_download: {
        type: String
    },
    requires_attachment: {
        type: Boolean,
        required: true
    },
    file_name: {
        type: String,
        required: true
    },
    created_by: {
        type: {},
        required: true
    }
}, {
    versionKey: false,
    timestamps: true
})

module.exports = mongoose.model('reports', reportSchema)