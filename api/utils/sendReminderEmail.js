const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD
  }
});

const sendReminderEmail = async (to, name, course, amount, dueDate) => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to,
    subject: 'Fee Reminder',
    text: `Dear ${name}, your fee of ₹${amount} for the course "${course}" is due on ${new Date(dueDate).toLocaleDateString('en-IN')}. Please make the payment.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Reminder sent to ${to}: ${info.response}`);
  } catch (err) {
    console.error(`Failed to send to ${to}:`, err.message);
  }
};

module.exports = sendReminderEmail;
