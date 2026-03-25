// Restrict authority to only see complaints assigned to their department
// Must be used AFTER authMiddleware
module.exports = (req, res, next) => {
  if (req.userType !== 'authority') {
    return res.status(403).json({ error: 'Only authority accounts can access this resource' });
  }
  // Inject dept filter into req so controllers can use it
  if (req.user.role === 'admin') {
    req.deptFilter = {}; 
    console.log(`[AUTH LOG] Super-Admin ${req.user.email} accessing ALL data.`);
  } else {
    req.deptFilter = { assignedDept: req.user.department };
    console.log(`[AUTH LOG] Dept Account ${req.user.email} restricted to: ${req.user.department}`);
  }
  next();
};
