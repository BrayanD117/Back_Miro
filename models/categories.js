// models/categories.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  templates: [{
    templateId: { 
      type: Schema.Types.ObjectId, 
      ref: 'templates', 
      required: true 
    },
    sequence: { 
      type: Number, 
      required: true 
    }
  }],
  
}, { timestamps: true });

module.exports = mongoose.model('categories', categorySchema);
