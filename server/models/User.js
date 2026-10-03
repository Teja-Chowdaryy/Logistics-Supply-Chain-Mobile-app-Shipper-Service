const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, default: () => 'usr_' + Math.random().toString(36).substring(2, 9) },
  name: { type: String, required: true, trim: true },
  company: { type: String, default: 'Independent Shipper' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['shipper', 'partner', 'admin'], default: 'shipper' },
  accountNo: { type: String, default: () => 'NL-' + Math.floor(1000 + Math.random() * 9000) + '-US' },
  kycStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Verified' },
  balance: { type: Number, default: 10000.00 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
