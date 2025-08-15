const express = require('express');
const { body, validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// @route   GET /api/leaves
// @desc    Get all leaves with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, status, leaveType, startDate, endDate } = req.query;
    
    let query = {};
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (leaveType) {
      query.leaveType = leaveType;
    }
    
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const leaves = await Leave.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startDate: -1 })
      .populate('employeeId', 'firstName lastName employeeId department');
    
    const total = await Leave.countDocuments(query);
    
    res.json({
      leaves,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/leaves/:id
// @desc    Get leave by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'firstName lastName employeeId department designation')
      .populate('approvedBy', 'username');
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    
    res.json(leave);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Leave not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/leaves
// @desc    Create new leave request
// @access  Private
router.post('/', [
  auth,
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('leaveType').isIn(['sick', 'casual', 'annual', 'maternity', 'paternity', 'other']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Please enter a valid start date'),
  body('endDate').isISO8601().withMessage('Please enter a valid end date'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      isPaid = false
    } = req.body;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate number of days
    const start = moment(startDate);
    const end = moment(endDate);
    const numberOfDays = end.diff(start, 'days') + 1;

    if (numberOfDays <= 0) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check for overlapping leaves
    const overlappingLeaves = await Leave.find({
      employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    });

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({ message: 'Leave request overlaps with existing approved or pending leaves' });
    }

    const leave = new Leave({
      employeeId,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      isPaid
    });

    await leave.save();
    
    const populatedLeave = await Leave.findById(leave._id)
      .populate('employeeId', 'firstName lastName employeeId department');
    
    res.json(populatedLeave);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve or reject leave request
// @access  Private
router.put('/:id/approve', [
  auth,
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('remarks').optional().isString().withMessage('Remarks must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, remarks } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request has already been processed' });
    }

    leave.status = status;
    leave.approvedBy = req.admin.id;
    leave.approvedAt = new Date();
    if (remarks) {
      leave.remarks = remarks;
    }

    await leave.save();
    
    const populatedLeave = await Leave.findById(leave._id)
      .populate('employeeId', 'firstName lastName employeeId department')
      .populate('approvedBy', 'username');
    
    res.json(populatedLeave);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Leave not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/leaves/:id
// @desc    Update leave request
// @access  Private
router.put('/:id', [
  auth,
  body('leaveType').optional().isIn(['sick', 'casual', 'annual', 'maternity', 'paternity', 'other']).withMessage('Invalid leave type'),
  body('startDate').optional().isISO8601().withMessage('Please enter a valid start date'),
  body('endDate').optional().isISO8601().withMessage('Please enter a valid end date'),
  body('reason').optional().notEmpty().withMessage('Reason cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leaveType, startDate, endDate, reason, isPaid } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update processed leave request' });
    }

    // Update fields
    if (leaveType) leave.leaveType = leaveType;
    if (startDate) leave.startDate = startDate;
    if (endDate) leave.endDate = endDate;
    if (reason) leave.reason = reason;
    if (typeof isPaid === 'boolean') leave.isPaid = isPaid;

    // Recalculate number of days if dates changed
    if (startDate || endDate) {
      const start = moment(leave.startDate);
      const end = moment(leave.endDate);
      leave.numberOfDays = end.diff(start, 'days') + 1;
    }

    await leave.save();
    
    const populatedLeave = await Leave.findById(leave._id)
      .populate('employeeId', 'firstName lastName employeeId department');
    
    res.json(populatedLeave);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Leave not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/leaves/:id
// @desc    Delete leave request
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete processed leave request' });
    }

    await leave.remove();
    res.json({ message: 'Leave request removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Leave not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/leaves/employee/:employeeId
// @desc    Get leaves for specific employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, status } = req.query;

    let query = { employeeId };
    
    if (year) {
      query.startDate = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1)
      };
    }
    
    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .sort({ startDate: -1 })
      .populate('approvedBy', 'username');

    res.json(leaves);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/leaves/stats/employee/:employeeId
// @desc    Get leave statistics for employee
// @access  Private
router.get('/stats/employee/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;

    let dateQuery = {};
    if (year) {
      dateQuery.startDate = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1)
      };
    }

    const leaves = await Leave.find({ employeeId, ...dateQuery });

    const stats = {
      total: leaves.length,
      approved: leaves.filter(l => l.status === 'approved').length,
      pending: leaves.filter(l => l.status === 'pending').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
      byType: {
        sick: leaves.filter(l => l.leaveType === 'sick' && l.status === 'approved').length,
        casual: leaves.filter(l => l.leaveType === 'casual' && l.status === 'approved').length,
        annual: leaves.filter(l => l.leaveType === 'annual' && l.status === 'approved').length,
        maternity: leaves.filter(l => l.leaveType === 'maternity' && l.status === 'approved').length,
        paternity: leaves.filter(l => l.leaveType === 'paternity' && l.status === 'approved').length,
        other: leaves.filter(l => l.leaveType === 'other' && l.status === 'approved').length
      },
      totalDays: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.numberOfDays, 0),
      paidDays: leaves.filter(l => l.status === 'approved' && l.isPaid).reduce((sum, l) => sum + l.numberOfDays, 0),
      unpaidDays: leaves.filter(l => l.status === 'approved' && !l.isPaid).reduce((sum, l) => sum + l.numberOfDays, 0)
    };

    res.json(stats);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 