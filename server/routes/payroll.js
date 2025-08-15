const express = require('express');
const { body, validationResult } = require('express-validator');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const auth = require('../middleware/auth');
const SalaryCalculator = require('../utils/salaryCalculator');
const { jsPDF } = require('jspdf');
const XLSX = require('xlsx');
const moment = require('moment');

const router = express.Router();

// @route   GET /api/payroll
// @desc    Get all payrolls with pagination and filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', month = '', year = '', status = '' } = req.query;
    
    // Build query
    let query = {};
    
    if (month) {
      query.month = parseInt(month);
    }
    
    if (year) {
      query.year = parseInt(year);
    }
    
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get payrolls with employee data
    let payrolls = await Payroll.find(query)
      .populate('employeeId', 'firstName lastName employeeId department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Filter by search term if provided
    if (search) {
      payrolls = payrolls.filter(payroll => {
        const employee = payroll.employeeId;
        if (!employee) return false;
        
        const searchLower = search.toLowerCase();
        return (
          employee.firstName?.toLowerCase().includes(searchLower) ||
          employee.lastName?.toLowerCase().includes(searchLower) ||
          employee.employeeId?.toLowerCase().includes(searchLower) ||
          employee.department?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Get total count for pagination (without search filter for accurate count)
    const totalQuery = { ...query };
    const total = await Payroll.countDocuments(totalQuery);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      payrolls,
      currentPage: parseInt(page),
      totalPages,
      total,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payroll
// @desc    Create payroll record from form data
// @access  Private
router.post('/', [
  auth,
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020 }).withMessage('Year must be valid'),
  body('basicSalary').isFloat({ min: 0 }).withMessage('Basic salary must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      employeeId, 
      month, 
      year, 
      basicSalary, 
      allowances, 
      bonuses, 
      deductions, 
      workingDays, 
      leaves, 
      remarks,
      grossSalary,
      netSalary 
    } = req.body;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if payroll already exists for this month
    const existingPayroll = await Payroll.findOne({ employeeId, month, year });
    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll already exists for this month' });
    }

    // Create payroll record
    const payroll = new Payroll({
      employeeId,
      month,
      year,
      basicSalary: basicSalary || 0,
      allowances: allowances || {
        hra: 0,
        da: 0,
        ta: 0,
        other: 0
      },
      bonuses: bonuses || {
        performance: 0,
        attendance: 0,
        other: 0
      },
      deductions: deductions || {
        tax: 0,
        pf: 0,
        esi: 0,
        loan: 0,
        leave: 0,
        other: 0
      },
      grossSalary: grossSalary || 0,
      netSalary: netSalary || 0,
      workingDays: workingDays || 22,
      paidLeaves: leaves?.paid || 0,
      unpaidLeaves: leaves?.unpaid || 0,
      remarks: remarks || '',
      status: 'processed'
    });

    await payroll.save();
    res.json(payroll);
  } catch (error) {
    console.error('Payroll creation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payroll/generate
// @desc    Generate payroll for an employee
// @access  Private
router.post('/generate', [
  auth,
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020 }).withMessage('Year must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, month, year } = req.body;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if payroll already exists for this month
    const existingPayroll = await Payroll.findOne({ employeeId, month, year });
    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll already exists for this month' });
    }

    // Get leaves for the month
    const leaves = await Leave.find({
      employeeId,
      startDate: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1)
      }
    });

    // Calculate salary
    const salaryData = SalaryCalculator.calculateMonthlySalary(employee, month, year, leaves);

    // Create payroll record
    const payroll = new Payroll({
      employeeId,
      month,
      year,
      basicSalary: salaryData.basicSalary,
      allowances: salaryData.allowances,
      bonuses: salaryData.bonuses,
      deductions: salaryData.deductions,
      grossSalary: salaryData.grossSalary,
      netSalary: salaryData.netSalary,
      workingDays: salaryData.workingDays,
      paidLeaves: salaryData.paidLeaves,
      unpaidLeaves: salaryData.unpaidLeaves,
      status: 'processed'
    });

    await payroll.save();
    res.json(payroll);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/payroll/employee/:employeeId
// @desc    Get payroll history for an employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;

    let query = { employeeId };
    if (year) {
      query.year = parseInt(year);
    }

    const payrolls = await Payroll.find(query)
      .sort({ year: -1, month: -1 })
      .populate('employeeId', 'firstName lastName employeeId');

    res.json(payrolls);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/payroll/:id
// @desc    Get payroll by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'firstName lastName employeeId department designation');
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }
    
    res.json(payroll);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Payroll not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/payroll/download/pdf/:id
// @desc    Download payslip as PDF
// @access  Private
router.get('/download/pdf/:id', auth, async (req, res) => {
  try {
    console.log('PDF download requested for payroll ID:', req.params.id);
    
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'firstName lastName employeeId department designation address bankDetails');
    
    if (!payroll) {
      console.log('Payroll not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Payroll not found' });
    }

    if (!payroll.employeeId) {
      console.log('Employee data not found for payroll:', payroll._id);
      return res.status(400).json({ message: 'Employee data not found' });
    }

    console.log('Creating PDF for employee:', payroll.employeeId.firstName, payroll.employeeId.lastName);

    const doc = new jsPDF();
    const employee = payroll.employeeId;
    const monthName = moment().month(payroll.month - 1).format('MMMM');
    
    // Helper function to safely format numbers
    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || isNaN(amount)) return '0';
      return amount.toLocaleString('en-IN');
    };

    // Helper function to safely get text
    const safeText = (text) => {
      return text || 'N/A';
    };
    
    // Header
    doc.setFontSize(20);
    doc.text('PAYROLL MANAGEMENT SYSTEM', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('PAYSLIP', 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`For the month of ${monthName} ${payroll.year}`, 105, 40, { align: 'center' });
    
    // Employee Details
    doc.setFontSize(12);
    doc.text('Employee Details:', 20, 60);
    doc.setFontSize(10);
    doc.text(`Name: ${safeText(employee.firstName)} ${safeText(employee.lastName)}`, 20, 70);
    doc.text(`Employee ID: ${safeText(employee.employeeId)}`, 20, 80);
    doc.text(`Department: ${safeText(employee.department)}`, 20, 90);
    doc.text(`Designation: ${safeText(employee.designation)}`, 20, 100);
    
    // Salary Details
    doc.setFontSize(12);
    doc.text('Salary Details:', 20, 120);
    doc.setFontSize(10);
    doc.text(`Basic Salary: ₹${formatCurrency(payroll.basicSalary)}`, 20, 130);
    
    // Allowances
    doc.text('Allowances:', 20, 145);
    doc.text(`HRA: ₹${formatCurrency(payroll.allowances?.hra)}`, 30, 155);
    doc.text(`DA: ₹${formatCurrency(payroll.allowances?.da)}`, 30, 165);
    doc.text(`TA: ₹${formatCurrency(payroll.allowances?.ta)}`, 30, 175);
    doc.text(`Other: ₹${formatCurrency(payroll.allowances?.other)}`, 30, 185);
    
    // Bonuses
    doc.text('Bonuses:', 120, 145);
    doc.text(`Performance: ₹${formatCurrency(payroll.bonuses?.performance)}`, 130, 155);
    doc.text(`Attendance: ₹${formatCurrency(payroll.bonuses?.attendance)}`, 130, 165);
    doc.text(`Other: ₹${formatCurrency(payroll.bonuses?.other)}`, 130, 175);
    
    // Deductions
    doc.text('Deductions:', 20, 200);
    doc.text(`Tax: ₹${formatCurrency(payroll.deductions?.tax)}`, 30, 210);
    doc.text(`PF: ₹${formatCurrency(payroll.deductions?.pf)}`, 30, 220);
    doc.text(`ESI: ₹${formatCurrency(payroll.deductions?.esi)}`, 30, 230);
    doc.text(`Loan: ₹${formatCurrency(payroll.deductions?.loan)}`, 30, 240);
    doc.text(`Leave: ₹${formatCurrency(payroll.deductions?.leave)}`, 30, 250);
    doc.text(`Other: ₹${formatCurrency(payroll.deductions?.other)}`, 30, 260);
    
    // Totals
    doc.setFontSize(12);
    doc.text(`Gross Salary: ₹${formatCurrency(payroll.grossSalary)}`, 20, 280);
    doc.text(`Net Salary: ₹${formatCurrency(payroll.netSalary)}`, 120, 280);
    
    // Working Days
    doc.text(`Working Days: ${payroll.workingDays || 0}`, 20, 295);
    doc.text(`Paid Leaves: ${payroll.paidLeaves || 0}`, 80, 295);
    doc.text(`Unpaid Leaves: ${payroll.unpaidLeaves || 0}`, 140, 295);
    
    // Footer
    doc.setFontSize(8);
    doc.text('Generated on: ' + moment().format('DD/MM/YYYY HH:mm'), 20, 300);
    
    console.log('PDF generated successfully, sending response...');
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${safeText(employee.employeeId)}_${monthName}_${payroll.year}.pdf`);
    
    // Generate and send PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.send(pdfBuffer);
    
    console.log('PDF sent successfully');
    
  } catch (error) {
    console.error('PDF generation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to generate PDF: ' + error.message });
  }
});

// @route   GET /api/payroll/download/excel/:id
// @desc    Download payslip as Excel
// @access  Private
router.get('/download/excel/:id', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'firstName lastName employeeId department designation');
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    if (!payroll.employeeId) {
      return res.status(400).json({ message: 'Employee data not found' });
    }

    const employee = payroll.employeeId;
    const monthName = moment().month(payroll.month - 1).format('MMMM');
    
    // Helper function to safely get text
    const safeText = (text) => {
      return text || 'N/A';
    };

    // Helper function to safely get number
    const safeNumber = (num) => {
      return num || 0;
    };
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Employee details sheet
    const employeeData = [
      ['Employee Details'],
      ['Name', `${safeText(employee.firstName)} ${safeText(employee.lastName)}`],
      ['Employee ID', safeText(employee.employeeId)],
      ['Department', safeText(employee.department)],
      ['Designation', safeText(employee.designation)],
      ['Month', `${monthName} ${payroll.year}`],
      [],
      ['Salary Breakdown'],
      ['Basic Salary', safeNumber(payroll.basicSalary)],
      [],
      ['Allowances'],
      ['HRA', safeNumber(payroll.allowances?.hra)],
      ['DA', safeNumber(payroll.allowances?.da)],
      ['TA', safeNumber(payroll.allowances?.ta)],
      ['Other', safeNumber(payroll.allowances?.other)],
      [],
      ['Bonuses'],
      ['Performance', safeNumber(payroll.bonuses?.performance)],
      ['Attendance', safeNumber(payroll.bonuses?.attendance)],
      ['Other', safeNumber(payroll.bonuses?.other)],
      [],
      ['Deductions'],
      ['Tax', safeNumber(payroll.deductions?.tax)],
      ['PF', safeNumber(payroll.deductions?.pf)],
      ['ESI', safeNumber(payroll.deductions?.esi)],
      ['Loan', safeNumber(payroll.deductions?.loan)],
      ['Leave', safeNumber(payroll.deductions?.leave)],
      ['Other', safeNumber(payroll.deductions?.other)],
      [],
      ['Summary'],
      ['Gross Salary', safeNumber(payroll.grossSalary)],
      ['Net Salary', safeNumber(payroll.netSalary)],
      [],
      ['Attendance'],
      ['Working Days', safeNumber(payroll.workingDays)],
      ['Paid Leaves', safeNumber(payroll.paidLeaves)],
      ['Unpaid Leaves', safeNumber(payroll.unpaidLeaves)]
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(employeeData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payslip');
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${safeText(employee.employeeId)}_${monthName}_${payroll.year}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Excel generation error:', error);
    res.status(500).json({ message: 'Failed to generate Excel file' });
  }
});

module.exports = router; 