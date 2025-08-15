import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaBuilding, FaCalendar, FaMoneyBillWave } from 'react-icons/fa';

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    dateOfJoining: '',
    department: '',
    designation: '',
    baseSalary: '',
    currentSalary: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    bankDetails: {
      accountNumber: '',
      bankName: '',
      ifscCode: ''
    },
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [departments] = useState([
    'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'IT', 'Customer Support'
  ]);

  const [designations] = useState([
    'Software Engineer', 'Senior Developer', 'Tech Lead', 'Manager', 'Director', 'Analyst', 'Specialist', 'Coordinator'
  ]);

  useEffect(() => {
    if (isEditing) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(`/employees/${id}`);
      const employee = response.data;
      
      // Format dates for input fields
      const formattedEmployee = {
        ...employee,
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
        dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : ''
      };
      
      setFormData(formattedEmployee);
    } catch (error) {
      toast.error('Failed to load employee data');
      navigate('/employees');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await axios.put(`/employees/${id}`, formData);
        toast.success('Employee updated successfully');
      } else {
        await axios.post('/employees', formData);
        toast.success('Employee added successfully');
      }
      navigate('/employees');
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const generateEmployeeId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${timestamp}${random}`;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employees')}
            className="btn btn-outline"
          >
            <FaArrowLeft />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Employee' : 'Add New Employee'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update employee information' : 'Create a new employee record'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaUser />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="employeeId"
                    className="form-input flex-1"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                    placeholder="EMP001"
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, employeeId: generateEmployeeId() }))}
                      className="btn btn-outline"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john.doe@company.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91-9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="form-input"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaBuilding />
              Employment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Date of Joining</label>
                <input
                  type="date"
                  name="dateOfJoining"
                  className="form-input"
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  name="department"
                  className="form-select"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Designation</label>
                <select
                  name="designation"
                  className="form-select"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Designation</option>
                  {designations.map(designation => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Base Salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="baseSalary"
                    className="form-input pl-8"
                    value={formData.baseSalary}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Current Salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="currentSalary"
                    className="form-input pl-8"
                    value={formData.currentSalary}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  className="form-input"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="address.city"
                  className="form-input"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  name="address.state"
                  className="form-input"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                />
              </div>

              <div className="form-group">
                <label className="form-label">ZIP Code</label>
                <input
                  type="text"
                  name="address.zipCode"
                  className="form-input"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  name="bankDetails.accountNumber"
                  className="form-input"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleChange}
                  placeholder="1234567890"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input
                  type="text"
                  name="bankDetails.bankName"
                  className="form-input"
                  value={formData.bankDetails.bankName}
                  onChange={handleChange}
                  placeholder="HDFC Bank"
                />
              </div>

              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input
                  type="text"
                  name="bankDetails.ifscCode"
                  className="form-input"
                  value={formData.bankDetails.ifscCode}
                  onChange={handleChange}
                  placeholder="HDFC0001234"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FaSave />
                  {isEditing ? 'Update Employee' : 'Create Employee'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm; 