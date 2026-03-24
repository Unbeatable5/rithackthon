const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

async function update() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicsense');
    const complaintId = 'cv39cb3138';
    await Complaint.findOneAndUpdate({ complaintId }, { 
        departmentMessage: "Officer dispatched. We are working on the resolution.",
        status: "in_progress"
    });
    console.log(`Updated ${complaintId} with message and in_progress status.`);
    process.exit(0);
}

update();
