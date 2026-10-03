const mongoose = require('mongoose');

const PricingRuleSchema = new mongoose.Schema({
  ruleId: {
    type: String,
    required: true,
    unique: true,
    default: 'global_rate_card'
  },
  baseFee: {
    type: Number,
    default: 25.0
  },
  perKgRate: {
    type: Number,
    default: 2.8
  },
  priorityMultipliers: {
    standard: { type: Number, default: 1.0 },
    express: { type: Number, default: 1.45 },
    sameday: { type: Number, default: 2.1 },
    freight: { type: Number, default: 1.75 }
  },
  fuelSurchargePct: {
    type: Number,
    default: 6.5
  },
  taxPct: {
    type: Number,
    default: 5.0
  },
  insurancePer100: {
    type: Number,
    default: 1.5
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PricingRule', PricingRuleSchema);
