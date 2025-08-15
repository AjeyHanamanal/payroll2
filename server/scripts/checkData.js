const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import models
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');

const checkData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check employees
    const employees = await Employee.find({});
    console.log(`\n📊 Employees found: ${employees.length}`);
    employees.forEach(emp => {
      console.log(`  - ${emp.employeeId}: ${emp.firstName} ${emp.lastName} (${emp.department})`);
    });

    // Check payrolls
    const payrolls = await Payroll.find({}).populate('employeeId', 'firstName lastName employeeId');
    console.log(`\n💰 Payrolls found: ${payrolls.length}`);
    payrolls.forEach(payroll => {
      const employee = payroll.employeeId;
      console.log(`  - ${payroll._id}: ${employee?.firstName} ${employee?.lastName} - ${payroll.month}/${payroll.year} (${payroll.status})`);
    });

    if (payrolls.length === 0) {
      console.log('\n⚠️  No payroll records found! You need to generate a payroll first.');
      console.log('💡 Try adding a test employee and generating a payroll through the web interface.');
    }

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkData(); 