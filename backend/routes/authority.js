const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const authMw   = require('../middleware/authMiddleware');
const deptMw   = require('../middleware/deptFilter');
const dash     = require('../controllers/dashboardController');
const fw       = require('../controllers/fieldWorkerController');

// Multer for resolved evidence uploads by authority
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => cb(null, 'resolved-' + Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// All routes require authority JWT + dept scope
router.use(authMw, deptMw);

router.get('/dashboard',        dash.getDashboardStats);
router.get('/complaints',       dash.listComplaints);
router.get('/complaints/:id',   dash.getComplaintDetail);
router.put('/complaints/:id',   upload.array('resolvedImages', 5), dash.updateComplaint);

// ── Field Worker routes ──
router.get('/workers',              fw.listWorkers);
router.post('/workers',             fw.createWorker);
router.put('/workers/:id',          fw.updateWorker);
router.delete('/workers/:id',       fw.deactivateWorker);
router.put('/complaints/:id/assign', fw.manualAssign);

module.exports = router;

