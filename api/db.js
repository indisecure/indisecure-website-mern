const mongoose = require('mongoose');

const connectDB = async () => {
  console.log('🔌 [DB] Initial state:', mongoose.connection.readyState);

  const start = Date.now();
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); 
    const latency = Date.now() - start;
    console.log(`✅ [DB] Connected to ${conn.connection.host} in ${latency}ms`);
    console.log('📶 [DB] Post-connect state:', mongoose.connection.readyState);
  } catch (error) {
    console.error('❌ [DB] Connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
