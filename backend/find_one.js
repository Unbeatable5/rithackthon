const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicsense');
    const complaintId = 'cvde3cece9';
    const c = await Complaint.findOne({ complaintId });
    if (c) {
        console.log(`ID: ${c.complaintId}`);
        console.log(`Images: ${JSON.stringify(c.images)}`);
        console.log(`Status: ${c.status}`);
    } else {
        console.log(`Complaint ${complaintId} not found.`);
    }
    process.exit(0);
}

check();
