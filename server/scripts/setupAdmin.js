const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config({ path: './config.env' });

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create default admin user
    const admin = new Admin({
      username: 'admin',
      email: 'admin@payroll.com',
      password: 'admin123',
      role: 'admin'
    });

    await admin.save();
    console.log('Default admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

setupAdmin(); 