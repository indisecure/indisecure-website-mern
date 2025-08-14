const cron = require('node-cron');
const mongoose = require('mongoose');
const Fee = require('../models/feeSchema');
const sendReminderEmail = require('./sendReminderEmail');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

function startReminderCron() {
  cron.schedule('0 9 * * *', async () => {
    const today = new Date();
    const dueFees = await Fee.find({
      dueDate: { $lte: today },
      isPaid: false,
      reminderEnabled: true
    });

    for (const fee of dueFees) {
      if (fee.studentEmail) {
        await sendReminderEmail(
          fee.studentEmail,
          fee.studentName,
          fee.courseName,
          fee.feeAmount,
          fee.dueDate
        );
      }
    }
  });

  console.log('📅 Reminder cron job scheduled at 9:00 AM daily');
}

module.exports = startReminderCron;
