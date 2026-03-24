const Complaint = require('../models/Complaint');

// GET /api/authority/complaints — dept-filtered list
exports.listComplaints = async (req, res) => {
  try {
    const filter = req.deptFilter || {};

    // Optional query filters
    const { status, priority, category, search, page = 1, limit = 20 } = req.query;
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search)   filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { complaintId: { $regex: search, $options: 'i' } }
    ];

    const skip  = (page - 1) * limit;
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name employeeId phone sectors')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ total, page: Number(page), pages: Math.ceil(total / limit), complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/authority/complaints/:id — single complaint detail
exports.getComplaintDetail = async (req, res) => {
  try {
    const filter = { complaintId: req.params.id, ...(req.deptFilter || {}) };
    console.log(`[AUTH LOG] Dept Account: ${req.user.department} | Requesting ID: ${req.params.id}`);
    
    const complaint = await Complaint.findOne(filter)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name employeeId phone sectors');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found or access denied' });

    // Mark as viewed (first open triggers SLA view timestamp)
    if (!complaint.viewedAt) {
      complaint.viewedAt = new Date();
      await complaint.save();
    }
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/authority/complaints/:id — update status, message, deadline, resolved images
exports.updateComplaint = async (req, res) => {
  try {
    const filter = { complaintId: req.params.id, ...(req.deptFilter || {}) };
    const complaint = await Complaint.findOne(filter);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found or access denied' });

    const { status, departmentMessage, deadline } = req.body;
    if (status)            complaint.status            = status;
    if (departmentMessage) complaint.departmentMessage = departmentMessage;
    if (deadline)          complaint.deadline          = new Date(deadline);

    // Attach resolved images if uploaded
    if (req.files && req.files.length > 0) {
      complaint.resolvedImages = req.files.map(f => f.filename);
    }

    await complaint.save();
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const base = req.deptFilter || {};

    const [total, pending, delayed, high, slaBreached] = await Promise.all([
      Complaint.countDocuments(base),
      Complaint.countDocuments({ ...base, status: 'pending' }),
      Complaint.countDocuments({ ...base, status: { $in: ['delayed', 'escalated'] } }),
      Complaint.countDocuments({ ...base, priority: { $in: ['high', 'urgent'] } }),
      Complaint.countDocuments({ ...base, slaBreached: true })
    ]);

    // Recent 10 complaints
    const recent = await Complaint.find(base)
      .populate('citizen', 'name phone')
      .populate('assignedTo', 'name employeeId phone sectors')
      .sort({ submittedAt: -1 })
      .limit(10);
    
    console.log(`[AUTH DEBUG] Dept: ${req.user.department} | Total: ${total} | Recent Found: ${recent.length}`);


    // Category Breakdown (for original bars)
    const categories = ['water', 'road', 'electrical', 'sanitation', 'other'];
    const categoryCounts = await Promise.all(
      categories.map(async cat => ({
        name: cat,
        count: await Complaint.countDocuments({ ...base, category: cat })
      }))
    );

    // Location Breakdown (Top 5 Areas)
    const locationCounts = await Complaint.aggregate([
      { $match: base },
      { $group: { _id: "$area", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);



    // Notifications (top 5 recent)
    const notifications = recent.slice(0, 5).map(c => ({
      type: c.slaBreached ? 'SLA Breach' : 'New Complaint',
      text: `Case #${c.complaintId}: ${c.title}`,
      time: c.submittedAt
    }));

    // Analytics: Resolution Rate
    const resolved = await Complaint.countDocuments({ ...base, status: 'resolved' });
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Analytics: Avg Resolution Time (in days)
    const resolvedList = await Complaint.find({ ...base, status: 'resolved', submittedAt: { $exists: true }, updatedAt: { $exists: true } });
    let avgResolutionTime = 0;
    if (resolvedList.length > 0) {
      const totalMs = resolvedList.reduce((acc, c) => acc + (c.updatedAt - c.submittedAt), 0);
      avgResolutionTime = (totalMs / resolvedList.length / (1000 * 60 * 60 * 24)).toFixed(1);
    }

    // Analytics: Citizens Served (unique citizens)
    const uniqueCitizens = await Complaint.distinct('citizen', base);
    const citizensServed = uniqueCitizens.length;

    res.json({ 
      total, pending, delayed, high, slaBreached, recent, categoryCounts, locationCounts,
      resolutionRate, avgResolutionTime, citizensServed,
      department: req.user.department || "Authority",
      notifications
    });




  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

