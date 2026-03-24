const mongoose = require('mongoose');
const FieldWorker = require('../models/FieldWorker');
require('dotenv').config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create a test worker for Water department
    const worker = {
      name: 'Rajesh Kumar',
      employeeId: 'FW-WATER-001',
      phone: '9876543210',
      department: 'water',
      sectors: ['Sector 4', 'Main Market', 'Railway Colony'],
      isActive: true
    };

    const exists = await FieldWorker.findOne({ employeeId: worker.employeeId });
    if (exists) {
      console.log('Worker already exists.');
    } else {
      await FieldWorker.create(worker);
      console.log('Successfully seeded test Field Worker: Rajesh Kumar');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
