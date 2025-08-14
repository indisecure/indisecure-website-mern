const mongoose = require('mongoose');
const { Schema } = mongoose;

const feeSchema = new Schema({
  studentName: String,
  studentEmail: String, // ✅ new field
  courseName: String,
  feeAmount: Number,
  dueDate: Date,
  isPaid: Boolean,
  reminderEnabled: Boolean,
  lastReminderSent: Date
});

module.exports = mongoose.model('Fee', feeSchema);
