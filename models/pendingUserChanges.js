const mongoose = require('mongoose');

const pendingUserChangeSchema = new mongoose.Schema({
  user_email: { 
    type: String, 
    required: true 
  },
  user_name: { 
    type: String, 
    required: true 
  },
  change_type: { 
    type: String, 
    enum: ['dependency_change'], 
    required: true 
  },
  current_value: { 
    type: String, 
    required: true 
  }, // dep_code actual en BD
  proposed_value: { 
    type: String, 
    required: true 
  }, // dep_code del endpoint
  current_dependency_name: { 
    type: String, 
    required: true 
  },
  proposed_dependency_name: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  detected_date: { 
    type: Date, 
    default: Date.now 
  },
  reviewed_by: { 
    type: String 
  }, // email del admin que revisó
  reviewed_date: { 
    type: Date 
  }
}, {
  versionKey: false,
  timestamps: true
});

// Índice único para evitar duplicados
pendingUserChangeSchema.index({ 
  user_email: 1, 
  change_type: 1, 
  current_value: 1, 
  proposed_value: 1 
}, { unique: true });

module.exports = mongoose.model('PendingUserChanges', pendingUserChangeSchema);