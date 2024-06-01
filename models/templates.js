const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the fields array
const fieldSchema = new Schema({
    name: { 
        type: String,
        unique: true, 
        required: true 
    },
    datatype: { 
        type: String, 
        required: true 
    },
    required: {
        type: Boolean,
        required: true
    },
    validate_with: {
        type: String,
        required: false
    } // Reference to another collection for validation
});

// Define the schema for the main template
const templateSchema = new Schema({
    name: { 
        type: String, 
        required: true,
    },
    file_name: {
        type: String,
    },
    file_description: { 
        type: String,
    },
    fields: {
        type: [fieldSchema],
        required: true
    }, // Array of fields
    active: {
        type: Boolean,
        default: true,
        required: true
    }
}, 
{
    versionKey: false,
    timestamps: true
}
); // Name of the collection in the database

module.exports = mongoose.model('templates', templateSchema);;
