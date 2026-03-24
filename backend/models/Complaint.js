const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ComplaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    default: () => 'cv' + uuidv4().replace(/-/g, '').slice(0, 8),
    unique: true
  },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen', required: true },

  // Content
  title:       { type: String, required: true },
  description: { type: String, required: true },
  category:    {
    type: String,
    enum: ['water', 'road', 'electrical', 'sanitation', 'garbage', 'noise', 'other'],
    default: 'other'
  },
  aiCategoryConfidence: { type: Number, default: 0 }, // 0–1
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  aiPriorityConfidence: { type: Number, default: 0 },
  assignedDept: {
    type: String,
    enum: ['water', 'road', 'electrical', 'sanitation', 'administration']
  },

  // Location
  area:    { type: String },
  pincode: { type: String },
  ward:    { type: String },

  // Media
  images:         [{ type: String }], // uploaded filenames by citizen
  resolvedImages: [{ type: String }], // uploaded by authority when resolved

  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'delayed', 'escalated'],
    default: 'pending'
  },

  // Authority actions
  departmentMessage: { type: String, default: '' },
  deadline:          { type: Date },
  viewedAt:          { type: Date },
  slaBreached:       { type: Boolean, default: false },
  escalatedTo:       { type: String },
  assignedTo:        { type: mongoose.Schema.Types.ObjectId, ref: 'FieldWorker' }, // field worker

  // Timestamps
  submittedAt: { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

ComplaintSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  // Auto-assign dept based on category mapping
  const deptMap = {
    water: 'water', road: 'road', electrical: 'electrical',
    sanitation: 'sanitation', garbage: 'sanitation', noise: 'administration', other: 'administration'
  };
  if (!this.assignedDept && this.category) {
    this.assignedDept = deptMap[this.category] || 'administration';
    console.log(`[MODEL LOG] Auto-assigned Dept: ${this.assignedDept} for Category: ${this.category}`);
  }

  // SLA check: if >24h since submission and not yet viewed/resolved → breach
  const hoursSinceSubmit = (Date.now() - this.submittedAt) / 3600000;
  if (hoursSinceSubmit > 24 && !this.viewedAt && this.status === 'pending') {
    this.slaBreached = true;
    this.status = 'delayed';
  }
  next();
});


module.exports = mongoose.model('Complaint', ComplaintSchema);
