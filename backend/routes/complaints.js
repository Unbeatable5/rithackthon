const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const authMw     = require('../middleware/authMiddleware');
const ctrl       = require('../controllers/complaintController');

// Multer storage for complaint images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// Public
router.get('/nearby', ctrl.getNearby);
router.get('/track/:id', ctrl.getComplaintPublic);
router.patch('/:id/support', ctrl.supportComplaint);

// Citizen: submit + track
router.get('/me', authMw, ctrl.getMyComplaints);
router.post('/', authMw, upload.array('images', 5), ctrl.submitComplaint);
router.get('/:id', authMw, ctrl.getComplaint);


module.exports = router;
