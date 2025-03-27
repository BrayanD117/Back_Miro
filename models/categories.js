// models/categories.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  templates: [
    {
      templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'templates', required: true },
      sequence: { type: Number, required: true } // Order within the category
    }
  ]
  
}, { timestamps: true });

module.exports = mongoose.model('categories', categorySchema);
