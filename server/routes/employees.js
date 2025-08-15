const express = require('express');
const { body, validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const SalaryCalculator = require('../utils/salaryCalculator');

const router = express.Router();

// @route   GET /api/employees
// @desc    Get all employees with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, status } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by department
    if (department) {
      query.department = department;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    const employees = await Employee.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Employee.countDocuments(query);
    
    res.json({
      employees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/employees
// @desc    Create new employee
// @access  Private
router.post('/', [
  auth,
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('dateOfBirth').isISO8601().withMessage('Please enter a valid date'),
  body('dateOfJoining').isISO8601().withMessage('Please enter a valid date'),
  body('department').notEmpty().withMessage('Department is required'),
  body('designation').notEmpty().withMessage('Designation is required'),
  body('baseSalary').isNumeric().withMessage('Base salary must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      dateOfJoining,
      department,
      designation,
      baseSalary,
      address,
      emergencyContact,
      bankDetails
    } = req.body;

    // Check if employee already exists
    let employee = await Employee.findOne({ $or: [{ employeeId }, { email }] });
    if (employee) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    // Calculate current salary with increments
    const tempEmployee = { dateOfJoining, baseSalary };
    const currentSalary = await SalaryCalculator.calculateCurrentSalary(tempEmployee);

    employee = new Employee({
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      dateOfJoining,
      department,
      designation,
      baseSalary,
      currentSalary,
      address,
      emergencyContact,
      bankDetails
    });

    await employee.save();
    res.json(employee);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private
router.put('/:id', [
  auth,
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('designation').notEmpty().withMessage('Designation is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      baseSalary,
      address,
      emergencyContact,
      bankDetails,
      status
    } = req.body;

    let employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if email is already taken by another employee
    if (email !== employee.email) {
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update fields
    employee.firstName = firstName;
    employee.lastName = lastName;
    employee.email = email;
    employee.phone = phone;
    employee.department = department;
    employee.designation = designation;
    
    if (baseSalary) {
      employee.baseSalary = baseSalary;
      // Recalculate current salary if base salary changed
      employee.currentSalary = await SalaryCalculator.calculateCurrentSalary(employee);
    }
    
    if (address) employee.address = address;
    if (emergencyContact) employee.emergencyContact = emergencyContact;
    if (bankDetails) employee.bankDetails = bankDetails;
    if (status) employee.status = status;

    await employee.save();
    res.json(employee);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.remove();
    res.json({ message: 'Employee removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/employees/departments/list
// @desc    Get list of all departments
// @access  Private
router.get('/departments/list', auth, async (req, res) => {
  try {
    const departments = await Employee.distinct('department');
    res.json(departments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 