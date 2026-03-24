const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');
const Citizen    = require('../models/Citizen');
const Authority  = require('../models/Authority');

const signToken = (id, type) =>
  jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const sendOTP = async (recipient, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from: `"CivicSense" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: 'CivicSense — Your OTP',
      html: `<h2>Your OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`
    });
    return true;
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
    console.log(`[MOCK OTP] ${otp}`);
    return false; // Indicates mock mode was used
  }
};

// POST /api/auth/citizen/register (Aadhaar + Email)
exports.citizenRegister = async (req, res) => {
  try {
    const { aadhaar, email } = req.body;
    console.log(`[*] Registering citizen: ${email}`);
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      return res.status(400).json({ error: 'Valid 12-digit Aadhaar number required' });
    }

    // Hash Aadhaar for privacy
    const aadhaarHash = await bcrypt.hash(aadhaar, 10);
    const aadhaarMasked = `XXXX-XXXX-${aadhaar.slice(-4)}`;

    // Find existing citizen by email OR checking hashed Aadhaar
    let citizen = await Citizen.findOne({ email: email?.toLowerCase() });
    
    if (!citizen) {
      const allCitizens = await Citizen.find({});
      for (const c of allCitizens) {
        if (c.aadhaarHash && await bcrypt.compare(aadhaar, c.aadhaarHash)) {
          citizen = c;
          break;
        }
      }
    }

    // Check if banned
    if (citizen && citizen.isBanned) {
      return res.status(403).json({ error: '🚫 Your account has been suspended due to repeated false complaints.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (citizen) {
      citizen.otp = otp;
      citizen.otpExpiry = otpExpiry;
      if (email) citizen.email = email; // Update email if provided
      
      // Ensure Aadhaar info is present (fixes validation error for legacy/incomplete records)
      if (!citizen.aadhaarHash) citizen.aadhaarHash = aadhaarHash;
      if (!citizen.aadhaarMasked) citizen.aadhaarMasked = aadhaarMasked;
      
      await citizen.save();
    } else {
      citizen = await Citizen.create({
        name: `Citizen-${aadhaar.slice(-4)}`,
        email: email || undefined,
        aadhaarHash,
        aadhaarMasked,
        passwordHash: 'otp_only',
        otp,
        otpExpiry
      });
    }

    // Send OTP to the real email address if provided, otherwise fallback to masked Aadhaar (mock mode)
    const recipient = email || aadhaarMasked;
    const sent = await sendOTP(recipient, otp);
    
    console.log(`[AUTH] OTP for ${recipient}: ${otp}`);
    
    // Sign token directly for hackathon/frictionless flow
    const token = signToken(citizen._id, 'citizen');

    res.status(200).json({
      message: sent ? 'OTP sent!' : 'OTP generated (Mock Mode)',
      isMock: !sent,
      token,
      citizen: { id: citizen._id, name: citizen.name, aadhaarMasked: citizen.aadhaarMasked }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/citizen/verify-otp (Aadhaar-based)
exports.citizenVerifyOTP = async (req, res) => {
  try {
    const { aadhaar, otp } = req.body;
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      return res.status(400).json({ error: 'Valid Aadhaar required' });
    }

    const allCitizens = await Citizen.find({});
    let citizen = null;
    for (const c of allCitizens) {
      if (c.aadhaarHash && await bcrypt.compare(aadhaar, c.aadhaarHash)) { citizen = c; break; }
    }

    if (!citizen) return res.status(404).json({ error: 'Citizen not found' });
    if (citizen.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (citizen.otpExpiry < Date.now()) return res.status(400).json({ error: 'OTP expired' });

    citizen.isVerified = true;
    citizen.otp = undefined;
    citizen.otpExpiry = undefined;
    await citizen.save();

    const token = signToken(citizen._id, 'citizen');
    res.json({ token, citizen: { id: citizen._id, name: citizen.name, aadhaarMasked: citizen.aadhaarMasked } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/citizen/login
exports.citizenLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const citizen = await Citizen.findOne({ email });
    if (!citizen) return res.status(401).json({ error: 'Invalid credentials' });
    if (!citizen.isVerified) return res.status(403).json({ error: 'Please verify your email first' });

    const match = await citizen.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(citizen._id, 'citizen');
    res.json({ token, citizen: { id: citizen._id, name: citizen.name, email: citizen.email, phone: citizen.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/authority/login
exports.authorityLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const authority = await Authority.findOne({ email });
    if (!authority) return res.status(401).json({ error: 'Invalid credentials' });
    if (!authority.isActive) return res.status(403).json({ error: 'Account disabled' });

    const match = await authority.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(authority._id, 'authority');
    res.json({
      token,
      authority: {
        id: authority._id, name: authority.name,
        email: authority.email, department: authority.department, role: authority.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/authority/register  (admin-only in production, open for hackathon)
exports.authorityRegister = async (req, res) => {
  try {
    const { name, email, department, role, password } = req.body;
    if (!name || !email || !department || !password)
      return res.status(400).json({ error: 'All fields required' });

    const exists = await Authority.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const authority = new Authority({ name, email, department, role: role || 'officer', passwordHash: password });
    await authority.save();
    res.status(201).json({ message: 'Authority account created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
