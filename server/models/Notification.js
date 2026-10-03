const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  notifId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'ntf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
  },
  userId: {
    type: String,
    default: 'usr_shipper_01'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  time: {
    type: String,
    default: 'Just now'
  },
  type: {
    type: String,
    enum: ['delivery', 'transit', 'success', 'billing', 'delay', 'info'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);
