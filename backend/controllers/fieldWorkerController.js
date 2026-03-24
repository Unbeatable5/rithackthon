const FieldWorker = require('../models/FieldWorker');
const Complaint   = require('../models/Complaint');

// ── AUTO-ASSIGN LOGIC ─────────────────────────────────────────────────────────
// Finds best field worker in a department whose sectors match the complaint area.
// Falls back to any active worker in the department.
exports.autoAssign = async (complaintId, department, area) => {
  try {
    const areaLower = (area || '').toLowerCase();

    // 1. Try to find worker whose sectors include the area (partial match)
    const workers = await FieldWorker.find({ department, isActive: true });
    let bestWorker = workers.find(w =>
      w.sectors.some(s => areaLower.includes(s.toLowerCase()) || s.toLowerCase().includes(areaLower))
    );

    // 2. Fallback: find worker with fewest active complaints in this dept
    if (!bestWorker && workers.length > 0) {
      const counts = await Promise.all(
        workers.map(async w => ({
          worker: w,
          count: await Complaint.countDocuments({ assignedTo: w._id, status: { $in: ['pending', 'in_progress'] } })
        }))
      );
      counts.sort((a, b) => a.count - b.count);
      bestWorker = counts[0]?.worker;
    }

    if (bestWorker) {
      await Complaint.findOneAndUpdate({ complaintId }, { assignedTo: bestWorker._id });
      console.log(`[ASSIGN] Complaint ${complaintId} → Worker: ${bestWorker.name} (${bestWorker.employeeId})`);
      return bestWorker;
    }
  } catch (err) {
    console.error('[ASSIGN ERROR]', err.message);
  }
  return null;
};

// ── FIELD WORKER CRUD ─────────────────────────────────────────────────────────

// GET /api/authority/workers — list workers for the logged-in dept
exports.listWorkers = async (req, res) => {
  try {
    const dept = req.user.department;
    const workers = await FieldWorker.find({ department: dept, isActive: true });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/authority/workers — create a new field worker
exports.createWorker = async (req, res) => {
  try {
    const { name, employeeId, phone, sectors } = req.body;
    const department = req.user.department;
    if (!name || !employeeId) return res.status(400).json({ error: 'Name and Employee ID required' });

    const worker = await FieldWorker.create({ name, employeeId, phone, department, sectors: sectors || [] });
    res.status(201).json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/authority/workers/:id — update sectors or info
exports.updateWorker = async (req, res) => {
  try {
    const worker = await FieldWorker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/authority/workers/:id — soft-delete (deactivate)
exports.deactivateWorker = async (req, res) => {
  try {
    await FieldWorker.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Worker deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/authority/complaints/:id/assign — manually re-assign
exports.manualAssign = async (req, res) => {
  try {
    const { workerId } = req.body;
    const worker = await FieldWorker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const complaint = await Complaint.findOneAndUpdate(
      { complaintId: req.params.id },
      { assignedTo: workerId },
      { new: true }
    ).populate('assignedTo', 'name employeeId phone sectors');

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
