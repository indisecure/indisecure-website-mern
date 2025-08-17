const nodemailer = require('nodemailer');
const path = require('path');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_APP_PASSWORD
  }
});
const capitalizeName = name =>
  name.trim().toLowerCase().split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const sendReminderEmail = async (to, name, course, balance, dueDate) => {
  if (!/\S+@\S+\.\S+/.test(to)) {
    console.warn(`⚠️ Invalid email format: ${to}`);
    return;
  }

  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN');
  const capitalizedName = capitalizeName(name);
 
  const qrPath = path.join(__dirname, 'qr.jpeg');

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to,
    subject: 'Fee Reminder',
    text: `Dear ${capitalizedName}, your remaining fees of ₹${balance} for "${course}" was due on ${formattedDate}. Please complete your payment.`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333;">
        <p>Dear ${capitalizedName},</p>
        <p>This is a gentle reminder that your <strong>remaining fees</strong> of <strong> ₹${balance}</strong> for the course <em>"${course}"</em> <strong> is due.</strong></p>
        <p>Please complete your payment at your earliest convenience.</p>
        <p>You can scan the QR code below to pay via UPI:</p>
        <p>Once you paid using UPI,pls.share transaction details while replying this email:</p>
        <img src="cid:paymentqr" alt="Payment QR Code" width="300" height="300" />
        <p>Regards,<br/><strong>Indi Secure</strong></p>
      </div>
    `,
    attachments: [{
      filename: 'qr.jpeg',
      path: qrPath,
      cid: 'paymentqr'
    }]
  };
 
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Reminder sent to ${capitalizedName} (${to}) for "${course}": ${info.response}`);
  } catch (err) {
    console.error(`❌ Failed to send to ${to}:`, err.message);
  }
};

module.exports = sendReminderEmail;
