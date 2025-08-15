const express = require('express');
const { body, validationResult } = require('express-validator');
const IncrementSettings = require('../models/IncrementSettings');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');
const auth = require('../middleware/auth');
const SalaryCalculator = require('../utils/salaryCalculator');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Employee statistics
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });
    
    // Department statistics
    const departments = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Payroll statistics
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyPayrolls = await Payroll.countDocuments({ 
      month: currentMonth, 
      year: currentYear 
    });
    
    const totalPayrollAmount = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);
    
    // Leave statistics
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const approvedLeaves = await Leave.countDocuments({ status: 'approved' });
    const rejectedLeaves = await Leave.countDocuments({ status: 'rejected' });
    
    // Recent activities
    const recentEmployees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName employeeId department createdAt');
    
    const recentPayrolls = await Payroll.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employeeId', 'firstName lastName employeeId')
      .select('month year netSalary status createdAt');
    
    const recentLeaves = await Leave.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employeeId', 'firstName lastName employeeId')
      .select('leaveType startDate endDate status createdAt');

    res.json({
      employeeStats: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees
      },
      departmentStats: departments,
      payrollStats: {
        monthlyCount: monthlyPayrolls,
        totalAmount: totalPayrollAmount[0]?.total || 0
      },
      leaveStats: {
        pending: pendingLeaves,
        approved: approvedLeaves,
        rejected: rejectedLeaves
      },
      recentActivities: {
        employees: recentEmployees,
        payrolls: recentPayrolls,
        leaves: recentLeaves
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/increment-settings
// @desc    Get current increment settings
// @access  Private
router.get('/increment-settings', auth, async (req, res) => {
  try {
    const settings = await IncrementSettings.findOne({ isActive: true });
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/admin/increment-settings
// @desc    Create or update increment settings
// @access  Private
router.post('/increment-settings', [
  auth,
  body('interval').isInt({ min: 1 }).withMessage('Interval must be at least 1 year'),
  body('incrementType').isIn(['percentage', 'fixed']).withMessage('Increment type must be percentage or fixed'),
  body('incrementValue').isFloat({ min: 0 }).withMessage('Increment value must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { interval, incrementType, incrementValue } = req.body;

    // Deactivate existing settings
    await IncrementSettings.updateMany({}, { isActive: false });

    // Create new settings
    const settings = new IncrementSettings({
      interval,
      incrementType,
      incrementValue,
      lastUpdatedBy: req.admin.id
    });

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/admin/apply-increments
// @desc    Apply increments to all employees
// @access  Private
router.post('/apply-increments', auth, async (req, res) => {
  try {
    const result = await SalaryCalculator.applyIncrements();
    res.json(result);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/employee-stats
// @desc    Get detailed employee statistics
// @access  Private
router.get('/employee-stats', auth, async (req, res) => {
  try {
    const { department, year } = req.query;
    
    let matchQuery = {};
    if (department) {
      matchQuery.department = department;
    }
    
    // Employee count by department
    const departmentStats = await Employee.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Employee count by designation
    const designationStats = await Employee.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$designation', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Salary statistics
    const salaryStats = await Employee.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgSalary: { $avg: '$currentSalary' },
          minSalary: { $min: '$currentSalary' },
          maxSalary: { $max: '$currentSalary' },
          totalSalary: { $sum: '$currentSalary' }
        }
      }
    ]);
    
    // Employee count by status
    const statusStats = await Employee.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Monthly joining trends
    const joiningTrends = await Employee.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$dateOfJoining' },
            month: { $month: '$dateOfJoining' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      departmentStats,
      designationStats,
      salaryStats: salaryStats[0] || {},
      statusStats,
      joiningTrends
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/payroll-stats
// @desc    Get payroll statistics
// @access  Private
router.get('/payroll-stats', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let matchQuery = {};
    if (year) {
      matchQuery.year = parseInt(year);
    }
    if (month) {
      matchQuery.month = parseInt(month);
    }
    
    // Monthly payroll summary
    const monthlyStats = await Payroll.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          totalGross: { $sum: '$grossSalary' },
          totalNet: { $sum: '$netSalary' },
          totalTax: { $sum: '$deductions.tax' },
          totalPF: { $sum: '$deductions.pf' },
          totalESI: { $sum: '$deductions.esi' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    
    // Department-wise payroll
    const departmentPayroll = await Payroll.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employee.department',
          totalNet: { $sum: '$netSalary' },
          avgNet: { $avg: '$netSalary' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalNet: -1 } }
    ]);
    
    // Top earners
    const topEarners = await Payroll.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $project: {
          employeeName: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] },
          employeeId: '$employee.employeeId',
          department: '$employee.department',
          netSalary: 1
        }
      },
      { $sort: { netSalary: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      monthlyStats,
      departmentPayroll,
      topEarners
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/leave-stats
// @desc    Get leave statistics
// @access  Private
router.get('/leave-stats', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let matchQuery = {};
    if (year) {
      matchQuery.startDate = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1)
      };
    }
    if (month && year) {
      matchQuery.startDate = {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1)
      };
    }
    
    // Leave type statistics
    const leaveTypeStats = await Leave.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$leaveType',
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          totalDays: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$numberOfDays', 0] } }
        }
      }
    ]);
    
    // Department-wise leave statistics
    const departmentLeaveStats = await Leave.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employee.department',
          totalLeaves: { $sum: 1 },
          approvedLeaves: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          totalDays: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$numberOfDays', 0] } }
        }
      },
      { $sort: { totalLeaves: -1 } }
    ]);
    
    // Monthly leave trends
    const monthlyLeaveTrends = await Leave.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' }
          },
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          totalDays: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$numberOfDays', 0] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      leaveTypeStats,
      departmentLeaveStats,
      monthlyLeaveTrends
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 