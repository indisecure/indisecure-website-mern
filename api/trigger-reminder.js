require('dotenv').config();
const Fee = require('./models/feeSchema');
const sendReminderEmail = require('./utils/sendReminderEmail');

module.exports = async function triggerReminder(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.query.token;
  if (token !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const today = new Date();
  const daysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

  const dueFees = await Fee.find({
    dueDate: { $lte: today },
    isPaid: false,
    reminderEnabled: true,
    $or: [
      { lastReminderSent: { $lt: daysAgo } },
      { lastReminderSent: null }
    ]
  });

  let sentCount = 0;
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
        sentCount++;
      } catch (err) {
        console.error(`❌ Failed to send to ${fee.studentEmail}:`, err.message);
      }
    }
  }

  res.json({
    success: true,    
  });
};
