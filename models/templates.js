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
    }, // Reference to another collection for validation
    active: {
        type: Boolean,
        default: true,
        required: true
    }
});

// Define the schema for the main template
const templateSchema = new Schema({
    name: { 
        type: String, 
        required: true 
    },
    file_name: {
        type: String,
        required: true
    },
    file_description: { 
        type: String,
        required: true
    },
    fields: [fieldSchema] // Array of fields
}, 
{
    versionKey: false,
    timestamps: true
}
); // Name of the collection in the database

module.exports = mongoose.model('templates', templateSchema);;
