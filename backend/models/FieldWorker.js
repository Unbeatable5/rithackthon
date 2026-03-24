const mongoose = require('mongoose');

const FieldWorkerSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  phone:      { type: String },
  department: {
    type: String,
    enum: ['water', 'road', 'electrical', 'sanitation', 'administration'],
    required: true
  },
  // Sectors/areas this worker is responsible for (flexible array)
  sectors: [{ type: String }],  // e.g. ["Sector 4", "Sector 5", "Main Market"]
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('FieldWorker', FieldWorkerSchema);
