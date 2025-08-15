const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');
const IncrementSettings = require('../models/IncrementSettings');
require('dotenv').config({ path: './config.env' });

const sampleEmployees = [
  {
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+91-9876543210',
    dateOfBirth: new Date('1990-05-15'),
    dateOfJoining: new Date('2022-01-15'),
    department: 'Engineering',
    designation: 'Senior Developer',
    baseSalary: 75000,
    currentSalary: 75000,
    address: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001'
    },
    bankDetails: {
      accountNumber: '1234567890',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234'
    },
    status: 'active'
  },
  {
    employeeId: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    phone: '+91-9876543211',
    dateOfBirth: new Date('1988-08-22'),
    dateOfJoining: new Date('2021-06-01'),
    department: 'Marketing',
    designation: 'Marketing Manager',
    baseSalary: 85000,
    currentSalary: 85000,
    address: {
      street: '456 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001'
    },
    bankDetails: {
      accountNumber: '1234567891',
      bankName: 'ICICI Bank',
      ifscCode: 'ICIC0001234'
    },
    status: 'active'
  },
  {
    employeeId: 'EMP003',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@company.com',
    phone: '+91-9876543212',
    dateOfBirth: new Date('1992-03-10'),
    dateOfJoining: new Date('2023-03-01'),
    department: 'HR',
    designation: 'HR Specialist',
    baseSalary: 60000,
    currentSalary: 60000,
    address: {
      street: '789 Oak Street',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001'
    },
    bankDetails: {
      accountNumber: '1234567892',
      bankName: 'SBI Bank',
      ifscCode: 'SBIN0001234'
    },
    status: 'active'
  },
  {
    employeeId: 'EMP004',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+91-9876543213',
    dateOfBirth: new Date('1995-11-05'),
    dateOfJoining: new Date('2022-09-15'),
    department: 'Finance',
    designation: 'Financial Analyst',
    baseSalary: 70000,
    currentSalary: 70000,
    address: {
      street: '321 Pine Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zipCode: '600001'
    },
    bankDetails: {
      accountNumber: '1234567893',
      bankName: 'Axis Bank',
      ifscCode: 'AXIS0001234'
    },
    status: 'active'
  },
  {
    employeeId: 'EMP005',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@company.com',
    phone: '+91-9876543214',
    dateOfBirth: new Date('1987-12-20'),
    dateOfJoining: new Date('2021-12-01'),
    department: 'Engineering',
    designation: 'Tech Lead',
    baseSalary: 95000,
    currentSalary: 95000,
    address: {
      street: '654 Elm Street',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '500001'
    },
    bankDetails: {
      accountNumber: '1234567894',
      bankName: 'Kotak Bank',
      ifscCode: 'KOTAK0001234'
    },
    status: 'active'
  }
];

const setupSampleData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await Employee.deleteMany({});
    await Payroll.deleteMany({});
    await Leave.deleteMany({});
    await IncrementSettings.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample employees
    const employees = await Employee.insertMany(sampleEmployees);
    console.log(`Inserted ${employees.length} employees`);

    // Create sample payrolls for current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const samplePayrolls = employees.map(employee => ({
      employeeId: employee._id,
      month: currentMonth,
      year: currentYear,
      basicSalary: employee.baseSalary,
      allowances: {
        hra: employee.baseSalary * 0.4,
        da: employee.baseSalary * 0.2,
        ta: 5000
      },
      bonuses: {
        performance: employee.baseSalary * 0.1,
        other: 0
      },
      deductions: {
        tax: employee.baseSalary * 0.1,
        pf: employee.baseSalary * 0.12,
        esi: employee.baseSalary * 0.0175,
        loan: 0
      },
      grossSalary: employee.baseSalary + (employee.baseSalary * 0.6) + (employee.baseSalary * 0.1),
      netSalary: employee.baseSalary + (employee.baseSalary * 0.6) + (employee.baseSalary * 0.1) - (employee.baseSalary * 0.2375),
      workingDays: 22,
      leaves: {
        paid: 0,
        unpaid: 0
      },
      status: 'processed'
    }));

    await Payroll.insertMany(samplePayrolls);
    console.log(`Inserted ${samplePayrolls.length} payroll records`);

    // Create sample leaves
    const sampleLeaves = [
      {
        employeeId: employees[0]._id,
        leaveType: 'sick',
        startDate: new Date(currentYear, currentMonth - 1, 5),
        endDate: new Date(currentYear, currentMonth - 1, 7),
        numberOfDays: 3,
        reason: 'Fever and cold',
        status: 'approved'
      },
      {
        employeeId: employees[1]._id,
        leaveType: 'annual',
        startDate: new Date(currentYear, currentMonth - 1, 15),
        endDate: new Date(currentYear, currentMonth - 1, 20),
        numberOfDays: 6,
        reason: 'Family vacation',
        status: 'pending'
      },
      {
        employeeId: employees[2]._id,
        leaveType: 'casual',
        startDate: new Date(currentYear, currentMonth - 1, 10),
        endDate: new Date(currentYear, currentMonth - 1, 10),
        numberOfDays: 1,
        reason: 'Personal work',
        status: 'approved'
      }
    ];

    await Leave.insertMany(sampleLeaves);
    console.log(`Inserted ${sampleLeaves.length} leave records`);

    // Create increment settings
    const incrementSettings = new IncrementSettings({
      interval: 1,
      incrementType: 'percentage',
      incrementValue: 10,
      isActive: true
    });

    await incrementSettings.save();
    console.log('Created increment settings');

    console.log('✅ Sample data setup completed successfully!');
    console.log('\n📊 Dashboard should now display:');
    console.log(`- ${employees.length} employees`);
    console.log(`- ${samplePayrolls.length} payroll records for ${currentMonth}/${currentYear}`);
    console.log(`- ${sampleLeaves.length} leave records`);
    console.log('- Increment settings configured');

  } catch (error) {
    console.error('Error setting up sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

setupSampleData(); 