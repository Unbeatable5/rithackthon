const mongoose = require('mongoose');
require('dotenv').config();
const Complaint = require('./models/Complaint');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const complaints = await Complaint.find({}).sort({ submittedAt: -1 }).limit(5);
    
    complaints.forEach(c => {
      console.log(`Complaint: ${c.complaintId}`);
      console.log(` - Status: ${c.status}`);
      console.log(` - Images:`, c.images);
      console.log(` - ResolvedImages:`, c.resolvedImages);
      console.log('---');
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
