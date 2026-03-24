const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CitizenSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  aadhaarHash:    { type: String, required: true, unique: true }, // hashed for privacy
  aadhaarMasked:  { type: String, required: true },               // e.g. XXXX-XXXX-3456
  passwordHash:   { type: String, required: true },
  isVerified:     { type: Boolean, default: false },
  otp:            { type: String },
  otpExpiry:      { type: Date },
  complaintCount: { type: Number, default: 0 },                   // anti-fake: rate limit
  isBanned:       { type: Boolean, default: false },              // anti-fake: strike system
  createdAt:      { type: Date, default: Date.now }
});

CitizenSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

CitizenSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('Citizen', CitizenSchema);
