const axios     = require('axios');
const path      = require('path');
const Complaint = require('../models/Complaint');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Helper: call Python ML classifier with Keyword Fallback
const classifyComplaint = async (text) => {
  try {
    const { data } = await axios.post(`${ML_URL}/ml/predict`, { text }, { timeout: 3000 });
    if (data && data.category) return data;
    throw new Error('Invalid ML response');
  } catch (err) {
    console.log('[*] ML Service Unreachable or Failed. Using Regex Fallback...');
    const t = text.toLowerCase();
    
    // Keyword matching logic
    if (t.includes('water') || t.includes('leak') || t.includes('pipe') || t.includes('drainage')) 
      return { category: 'water', priority: 'high', aiCategoryConfidence: 0.7, aiPriorityConfidence: 0.7 };
    
    if (t.includes('road') || t.includes('pothole') || t.includes('street') || t.includes('hazard'))
      return { category: 'road', priority: 'medium', aiCategoryConfidence: 0.7, aiPriorityConfidence: 0.7 };
      
    if (t.includes('light') || t.includes('electric') || t.includes('power') || t.includes('shock'))
      return { category: 'electrical', priority: 'urgent', aiCategoryConfidence: 0.7, aiPriorityConfidence: 0.7 };

    if (t.includes('garbage') || t.includes('waste') || t.includes('trash') || t.includes('cleaning') || t.includes('sanitation'))
      return { category: 'sanitation', priority: 'medium', aiCategoryConfidence: 0.7, aiPriorityConfidence: 0.7 };

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

    // AI classification or Frontend Override
    let category = req.body.category;
    let priority = req.body.priority;
    let aiResult = { aiCategoryConfidence: 1, aiPriorityConfidence: 1 }; // Default for user-verified

    if (!category || !priority) {
      console.log('Backend Re-classifying (Frontend data missing)...');
      aiResult = await classifyComplaint(`${title} ${description}`);
      category = aiResult.category;
      priority = aiResult.priority;
    }

    // Handle uploaded images
    const images = req.files ? req.files.map(f => f.filename) : [];
    console.log('[DEBUG] Received Files:', req.files ? req.files.length : 0);

    // Map Category to Department
    const deptMap = {
      'water': 'water',
      'road': 'road',
      'electrical': 'electrical',
      'sanitation': 'sanitation',
      'garbage': 'sanitation',
      'noise': 'administration',
      'other': 'administration'
    };
    const assignedDept = deptMap[category.toLowerCase()] || 'administration';

    console.log(`Creating Complaint in MongoDB (Dept: ${assignedDept})...`);
    const complaint = await Complaint.create({
      citizen:             req.user._id,
      title, description, area, pincode, ward, images,
      category:            category.toLowerCase(),
      priority:            priority.toLowerCase(),
      assignedDept:        assignedDept,
      aiCategoryConfidence: aiResult.aiCategoryConfidence || 0.95,
      aiPriorityConfidence: aiResult.aiPriorityConfidence || 0.95
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
      .select('-citizen') // Hide citizen details for public tracking
      .populate('assignedTo', 'name employeeId phone');
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
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name employeeId phone');
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
// PATCH /api/complaints/:id/support — citizen supports a case
exports.supportComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    complaint.supportCount += 1;

    // Auto-escalation Logic
    if (complaint.supportCount >= 10) {
      complaint.priority = 'urgent';
    } else if (complaint.supportCount >= 5) {
      if (complaint.priority !== 'urgent') complaint.priority = 'high';
    }

    await complaint.save();

    res.json({ 
      success: true, 
      supportCount: complaint.supportCount, 
      newPriority: complaint.priority 
    });
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
