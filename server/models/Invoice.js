const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true
  },
  shipmentId: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: () => new Date().toISOString().replace('T', ' ').substring(0, 10)
  },
  consignor: {
    name: String,
    address: String
  },
  consignee: {
    name: String,
    address: String
  },
  lineItems: [
    {
      description: String,
      amount: Number
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PENDING', 'OVERDUE'],
    default: 'PAID'
  },
  paymentMethod: {
    type: String,
    default: 'Corporate Billing Line'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
