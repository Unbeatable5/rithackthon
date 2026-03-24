const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('[*] Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds instead of 30
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Drop old non-sparse indexes that cause E11000 duplicate null errors
    try {
      await conn.connection.collection('citizens').dropIndex('email_1');
      await conn.connection.collection('citizens').dropIndex('phone_1');
      console.log('✅ Dropped old email/phone indexes to prevent null duplication errors.');
    } catch (indexErr) {
      // Ignore errors if the index doesn't exist anymore
    }
  } catch (err) {
    console.error(' MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
