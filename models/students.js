const mongoose = require('mongoose')

const studentsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  code_student: {
    type: String,
  },
  identification: {
    type: String,
    required: true,
  },
  program_code: {
    type: String,
  },
  program: {
    type: String
  },
  status: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
},
{
    versionKey: false,
    timestamps: true
}
);

//Perform an upsert operation
studentsSchema.statics.syncUsers = async function (externalUsers) {
  const Student = this;

  // Create a set of emails from external users for efficient look-up
  const emailSet = new Set(externalUsers.map(user => user.email));

  // Use bulkWrite to perform upsert operations
  const updateOps = externalUsers.map(externalUser => ({
    updateOne: {
      filter: { email: externalUser.email },
      update: { $set: { ...externalUser, isActive: true } },
      upsert: true
    }
  }));

  await Student.bulkWrite(updateOps);
}

module.exports = mongoose.model('students', studentsSchema);