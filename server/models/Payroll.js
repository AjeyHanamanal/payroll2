const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  bonuses: {
    performance: { type: Number, default: 0 },
    attendance: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    tax: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    leave: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  grossSalary: {
    type: Number,
    required: true,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  workingDays: {
    type: Number,
    required: true,
    min: 0
  },
  paidLeaves: {
    type: Number,
    default: 0
  },
  unpaidLeaves: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique payroll per employee per month
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema); 