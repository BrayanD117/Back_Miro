const mongoose = require("mongoose");

const ReminderLogSchema = new mongoose.Schema({
  recipient_email: { type: String, required: true },
  recipient_name: { type: String },
  sent_at: { type: Date, default: Date.now },
  templates_sent: [String], // nombres de plantillas
  deadline: { type: Date },
  period_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Period' }
});

module.exports = mongoose.model("ReminderLog", ReminderLogSchema);