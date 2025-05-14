const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  daysBefore: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('reminders', reminderSchema);
