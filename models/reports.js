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
    report_example_path: {
        type: String,
        required: true
    },
    required_files: {
        type: [String],
        required: true
    }
}, {
    versionKey: false,
    timestamps: true
})