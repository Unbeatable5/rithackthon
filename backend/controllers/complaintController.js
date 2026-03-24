const axios     = require('axios');
const path      = require('path');
const Complaint = require('../models/Complaint');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Helper: call Python ML classifier
const classifyComplaint = async (text) => {
  try {
    const { data } = await axios.post(`${ML_URL}/ml/predict`, { text }, { timeout: 5000 });
    return data; // { category, priority, aiCategoryConfidence, aiPriorityConfidence }
  } catch {
    return { category: 'other', priority: 'medium', aiCategoryConfidence: 0, aiPriorityConfidence: 0 };
  }
};

const FieldWorker = require('../models/FieldWorker');
const fwController = require('./fieldWorkerController');

// POST /api/complaints — citizen submits complaint
exports.submitComplaint = async (req, res) => {
  try {
    console.log('--- Complaint Submission Start ---');
    const { title, description, area, pincode, ward } = req.body;
    
    if (!req.user) {
      console.error('[AUTH ERROR] req.user is missing! Ensure token is valid.');
      return res.status(401).json({ error: 'User context missing. Please login again.' });
    }

    if (!title || !description) {
      console.warn('[VALIDATION ERROR] Title or description empty');
      return res.status(400).json({ error: 'Title and description required' });
    }

    // AI classification
    console.log('Calling AI Classifier...');
    const aiResult = await classifyComplaint(`${title} ${description}`);
    console.log('AI Result:', aiResult);

    // Handle uploaded images
    const images = req.files ? req.files.map(f => f.filename) : [];
    console.log('Uploaded Images:', images);

    console.log('Creating Complaint in MongoDB...');
    const complaint = await Complaint.create({
      citizen:             req.user._id,
      title, description, area, pincode, ward, images,
      category:            aiResult.category,
      priority:            aiResult.priority,
      aiCategoryConfidence: aiResult.aiCategoryConfidence,
      aiPriorityConfidence: aiResult.aiPriorityConfidence
    });

    // ── AUTO-ASSIGN FIELD WORKER ──
    const assignedWorker = await fwController.autoAssign(
      complaint.complaintId,
      complaint.assignedDept,
      area
    );

    console.log('Complaint Created Successfully:', complaint.complaintId);
    res.status(201).json({ 
      success: true, 
      complaintId: complaint.complaintId, 
      complaint,
      assignedTo: assignedWorker ? { name: assignedWorker.name, id: assignedWorker.employeeId } : null
    });
  } catch (err) {
    console.error('--- Complaint Submission FAILED ---');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/complaints/track/:id — public tracking
exports.getComplaintPublic = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id })
      .select('-citizen'); // Hide citizen details for public tracking
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET /api/complaints/:id — citizen tracks their complaint
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id })
      .populate('citizen', 'name email phone');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    // Citizens can only see their own
    if (req.userType === 'citizen' && complaint.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/complaints/nearby — public, filter by pincode/ward/category/status
exports.getNearby = async (req, res) => {
  try {
    const { area, category, status } = req.query;
    const filter = {};
    if (area)     filter.area     = { $regex: area, $options: 'i' };
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all')    filter.status   = status.toLowerCase().replace(' ', '_');


    const complaints = await Complaint.find(filter)
      .select('-citizen')   // hide citizen identity in public view
      .sort({ submittedAt: -1 })
      .limit(50);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// GET /api/complaints/me — citizen sees their own history
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizen: req.user._id })
      .sort({ submittedAt: -1 })
      .limit(10);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
