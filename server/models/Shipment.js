const mongoose = require('mongoose');

const TimelineNodeSchema = new mongoose.Schema({
  milestone: { type: String, required: true },
  time: { type: String, default: 'Pending' },
  location: { type: String, default: '-' },
  done: { type: Boolean, default: false }
}, { _id: false });

const ProofOfDeliverySchema = new mongoose.Schema({
  receiverName: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toISOString() },
  signature: { type: String, required: true }, // SVG or base64 data URL
  confirmationCode: { type: String, default: '4821' },
  photoUrl: { type: String }
}, { _id: false });

const ShipmentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: String,
    default: () => new Date().toISOString().replace('T', ' ').substring(0, 16)
  },
  status: {
    type: String,
    enum: ['Created', 'Confirmed', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Created'
  },
  origin: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true }
  },
  destination: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true }
  },
  package: {
    type: { type: String, default: 'Parcel' },
    weight: { type: Number, required: true },
    dimensions: { type: String, default: '40 x 30 x 25 cm' },
    quantity: { type: Number, default: 1 },
    declaredValue: { type: Number, default: 500 },
    description: { type: String }
  },
  priority: {
    type: String,
    enum: ['standard', 'express', 'sameday', 'freight'],
    default: 'express'
  },
  pricing: {
    base: { type: Number, default: 25.0 },
    weightCharge: { type: Number, default: 0 },
    prioritySurcharge: { type: Number, default: 0 },
    fuelSurcharge: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  assignedPartnerId: {
    type: String,
    default: null
  },
  eta: {
    type: String,
    default: 'Calculating...'
  },
  distanceRemainingKm: {
    type: Number,
    default: 0
  },
  currentCoords: {
    x: { type: Number, default: 20 },
    y: { type: Number, default: 25 }
  },
  routeCoords: [
    {
      x: Number,
      y: Number,
      label: String
    }
  ],
  timeline: [TimelineNodeSchema],
  pod: {
    type: ProofOfDeliverySchema,
    default: null
  },
  invoiceId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Shipment', ShipmentSchema);
