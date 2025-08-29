const mongoose = require('mongoose');

const connectDB = async () => {
  console.log('🔌 [DB] Initial state:', mongoose.connection.readyState); // 0 = disconnected

  const start = Date.now();
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const latency = Date.now() - start;
    console.log(`✅ [DB] Connected to ${conn.connection.host} in ${latency}ms`);
    console.log('📶 [DB] Post-connect state:', mongoose.connection.readyState); // 1 = connected
  } catch (error) {
    console.error('❌ [DB] Connection error:', error.message);
    process.exit(1); // Fail fast to avoid running in broken state
  }
};

module.exports = connectDB;
