const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicsense');
    const c = await Complaint.findOne({ images: { $exists: true, $not: { $size: 0 } } }).sort({ submittedAt: -1 });
    if (c) {
        console.log(`LATEST_ID: ${c.complaintId}`);
        console.log(`Images: ${JSON.stringify(c.images)}`);
    } else {
        console.log('NO_IMAGE_COMPLAINTS_FOUND');
    }
    process.exit(0);
}

check();
