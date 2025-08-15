const mongoose = require('mongoose');

const incrementSettingsSchema = new mongoose.Schema({
  interval: {
    type: Number,
    required: true,
    min: 1,
    description: 'Increment interval in years'
  },
  incrementType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  incrementValue: {
    type: Number,
    required: true,
    min: 0,
    description: 'Percentage or fixed amount'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IncrementSettings', incrementSettingsSchema); 