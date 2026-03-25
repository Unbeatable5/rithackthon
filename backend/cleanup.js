require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

async function cleanup() {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error("MONGO_URI not found in .env");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("[*] Connected to Atlas for cleanup...");

    const result = await Complaint.deleteMany({ category: 'other' });
    console.log(`[SUCCESS] Deleted ${result.deletedCount} instances of 'Other' complaints.`);
    
    console.log("Database sanitized. Presentation environment is ready.");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanup();
