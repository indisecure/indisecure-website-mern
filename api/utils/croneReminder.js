const cron = require('node-cron')
const Fee = require('../models/feeSchema')
const sendReminderEmail = require('./sendReminderEmail')
function startReminderCron() {
  cron.schedule('0 9 * * *', async () => {
    const today = new Date();
    const threeDaysAgo = new Date(today - 2* 24 * 60 * 60 * 1000);

    const dueFees = await Fee.find({
      dueDate: { $lte: today },
      isPaid: false,
      reminderEnabled: true,
      $or: [
        { lastReminderSent: { $lt: threeDaysAgo } },
        { lastReminderSent: null }
      ]
    });

    for (const fee of dueFees) {
      if (fee.studentEmail) {
        try {
          const balance = fee.feeAmount - fee.paidAmount;
          await sendReminderEmail(
            fee.studentEmail,
            fee.studentName,
            fee.courseName,
            balance,
            fee.dueDate
          );



          fee.lastReminderSent = today;
          await fee.save();

          console.log(`📧 Reminder sent to ${fee.studentEmail}`);
        } catch (err) {
          console.error(`❌ Failed to send to ${fee.studentEmail}:`, err.message);
        }
      }
    }

    console.log(`📨 ${dueFees.length} reminders processed at ${new Date().toLocaleString('en-IN')}`);
  });

  console.log('📅 Reminder cron job scheduled at 9:00 AM once in 2 days');
}

module.exports = startReminderCron