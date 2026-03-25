require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
const Citizen = require('./models/Citizen');
const FieldWorker = require('./models/FieldWorker');

async function cleanup() {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error("MONGO_URI not found in .env");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("[*] Connected to Atlas for TOTAL SANITIZATION...");

    // 1. Clear All Complaints
    const compRes = await Complaint.deleteMany({});
    console.log(`[x] CLEANED: ${compRes.deletedCount} Complaints removed.`);

    // 2. Clear All Citizens
    const citRes = await Citizen.deleteMany({});
    console.log(`[x] CLEANED: ${citRes.deletedCount} Citizens wiped.`);

    // 3. Clear All Field Workers
    const fwRes = await FieldWorker.deleteMany({});
    console.log(`[x] CLEANED: ${fwRes.deletedCount} Field Workers reset.`);

    console.log("\n✅ Database is now 100% CLEAN (except for Authority accounts).");
    console.log("Your presentation environment is fresh and ready!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanup();
