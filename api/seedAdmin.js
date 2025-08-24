const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userSchema');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_EMAIL_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 3);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists');
    process.exit();
  }

  const adminUser = new User({
    email,
    passwordHash,
    isAdmin: true
  });

  await adminUser.save();
  console.log('✅ Admin user created');
  process.exit();
})();
