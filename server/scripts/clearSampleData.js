const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import models
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');
const IncrementSettings = require('../models/IncrementSettings');

const clearSampleData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear all sample data
    console.log('Clearing sample data...');
    
    // Delete all employees (this will also delete related payrolls and leaves due to cascading)
    const employeeResult = await Employee.deleteMany({});
    console.log(`Deleted ${employeeResult.deletedCount} employees`);
    
    // Delete all payrolls
    const payrollResult = await Payroll.deleteMany({});
    console.log(`Deleted ${payrollResult.deletedCount} payroll records`);
    
    // Delete all leaves
    const leaveResult = await Leave.deleteMany({});
    console.log(`Deleted ${leaveResult.deletedCount} leave records`);
    
    // Delete increment settings
    const incrementResult = await IncrementSettings.deleteMany({});
    console.log(`Deleted ${incrementResult.deletedCount} increment settings`);

    console.log('✅ All sample data cleared successfully!');
    console.log('📝 Note: Admin user is still available for login');
    console.log('🔧 You can now add real employees, payrolls, and leaves through the web interface');

  } catch (error) {
    console.error('Error clearing sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

clearSampleData(); 