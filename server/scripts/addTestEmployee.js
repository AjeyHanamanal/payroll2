const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import models
const Employee = require('../models/Employee');

const addTestEmployee = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create a test employee
    const testEmployee = new Employee({
      employeeId: 'EMP001',
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test.employee@company.com',
      phone: '+91-9876543210',
      dateOfBirth: new Date('1990-01-01'),
      dateOfJoining: new Date('2023-01-01'),
      department: 'IT',
      designation: 'Software Developer',
      baseSalary: 50000,
      currentSalary: 50000,
      address: {
        street: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001'
      },
      bankDetails: {
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        ifscCode: 'TEST0001234'
      },
      status: 'active'
    });

    await testEmployee.save();
    console.log('✅ Test employee created successfully!');
    console.log('📝 Employee ID:', testEmployee._id);
    console.log('🔧 You can now test payroll generation with this employee');

  } catch (error) {
    console.error('Error creating test employee:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

addTestEmployee(); 