const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the fields array
const FieldSchema = new Schema({
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
    required: false} // Reference to another collection for validation
});

// Define the schema for the main template
const TemplateSchema = new Schema({
  name: { type: String, required: true },
  file_name: { type: String, required: true },
  file_description: { type: String, required: true },
  fields: [FieldSchema] // Array of fields
}, { collection: 'Plantillas' }); // Name of the collection in the database

const Plantilla = mongoose.model('Plantilla', TemplateSchema);

module.exports = Plantilla;
