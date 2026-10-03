const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
  partnerId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true
  },
  avatar: {
    type: String,
    default: 'DP'
  },
  phone: {
    type: String,
    required: true
  },
  vehicle: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['Van', 'Sprinter', 'Box Truck', 'Semi-Trailer'],
    default: 'Van'
  },
  licensePlate: {
    type: String
  },
  rating: {
    type: Number,
    default: 4.90
  },
  deliveriesCompleted: {
    type: Number,
    default: 0
  },
  todayEarnings: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Online', 'Offline', 'Busy'],
    default: 'Online'
  },
  kycStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Suspended'],
    default: 'Approved'
  },
  currentLocation: {
    type: String,
    default: 'Metro Logistics Bay'
  },
  coordinates: {
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Partner', PartnerSchema);
