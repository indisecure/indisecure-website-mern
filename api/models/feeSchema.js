const mongoose = require('mongoose');
const { Schema } = mongoose;
const feeSchema = new Schema({
  studentName: String,
  studentEmail: String,
  courseName: String,
  feeAmount: Number,
  paidAmount: { type: Number, default: 0 },
  dueDate: Date,
  isPaid: Boolean,
  reminderEnabled: Boolean,
  lastReminderSent: Date
});


module.exports = mongoose.model('Fee', feeSchema);
