import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaArrowLeft, FaCalculator, FaMoneyBillWave, FaCalendar, FaUser } from 'react-icons/fa';

const PayrollForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeData, setEmployeeData] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: {
      hra: 0,
      da: 0,
      ta: 0,
      other: 0
    },
    bonuses: {
      performance: 0,
      other: 0
    },
    deductions: {
      tax: 0,
      pf: 0,
      esi: 0,
      loan: 0,
      other: 0
    },
    workingDays: 22,
    leaves: {
      paid: 0,
      unpaid: 0
    },
    remarks: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeData(selectedEmployee);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/employees?limit=1000');
      setEmployees(response.data.employees || []);
      
      // Show warning if no employees exist
      if (!response.data.employees || response.data.employees.length === 0) {
        toast.warning('No employees found. Please add employees first before generating payroll.');
      }
    } catch (error) {
      toast.error('Failed to load employees');
      console.error('Error fetching employees:', error);
    }
  };

  const fetchEmployeeData = async (employeeId) => {
    try {
      const response = await axios.get(`/employees/${employeeId}`);
      const employee = response.data;
      setEmployeeData(employee);
      
      // Auto-fill basic salary
      setFormData(prev => ({
        ...prev,
        employeeId: employee._id,
        basicSalary: employee.currentSalary || 0
      }));
    } catch (error) {
      toast.error('Failed to load employee data');
      console.error('Error fetching employee data:', error);
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
          [child]: parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'employeeId' ? value : (parseFloat(value) || 0)
      }));
    }
  };

  const calculateGrossSalary = () => {
    const basic = formData.basicSalary || 0;
    const hra = formData.allowances.hra || 0;
    const da = formData.allowances.da || 0;
    const ta = formData.allowances.ta || 0;
    const otherAllowance = formData.allowances.other || 0;
    const performanceBonus = formData.bonuses.performance || 0;
    const otherBonus = formData.bonuses.other || 0;

    return basic + hra + da + ta + otherAllowance + performanceBonus + otherBonus;
  };

  const calculateDeductions = () => {
    const tax = formData.deductions.tax || 0;
    const pf = formData.deductions.pf || 0;
    const esi = formData.deductions.esi || 0;
    const loan = formData.deductions.loan || 0;
    const otherDeduction = formData.deductions.other || 0;

    return tax + pf + esi + loan + otherDeduction;
  };

  const calculateNetSalary = () => {
    return calculateGrossSalary() - calculateDeductions();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that an employee is selected
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    
    // Validate that there are employees to choose from
    if (employees.length === 0) {
      toast.error('No employees available. Please add employees first.');
      return;
    }
    
    setLoading(true);

    try {
      const payrollData = {
        ...formData,
        grossSalary: calculateGrossSalary(),
        netSalary: calculateNetSalary(),
        status: 'processed'
      };

      await axios.post('/payroll', payrollData);
      toast.success('Payroll generated successfully!');
      navigate('/payroll');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate payroll';
      toast.error(message);
      console.error('Payroll generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoCalculateAllowances = () => {
    const basic = formData.basicSalary || 0;
    setFormData(prev => ({
      ...prev,
      allowances: {
        hra: basic * 0.4, // 40% of basic
        da: basic * 0.2,  // 20% of basic
        ta: 5000,         // Fixed TA
        other: prev.allowances.other
      }
    }));
  };

  const autoCalculateDeductions = () => {
    const basic = formData.basicSalary || 0;
    setFormData(prev => ({
      ...prev,
      deductions: {
        tax: basic * 0.1,    // 10% tax
        pf: basic * 0.12,    // 12% PF
        esi: basic * 0.0175, // 1.75% ESI
        loan: prev.deductions.loan,
        other: prev.deductions.other
      }
    }));
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/payroll')}
            className="btn btn-outline"
          >
            <FaArrowLeft />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Generate Payroll</h1>
            <p className="text-gray-600">Create payroll for an employee</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaUser />
              Employee Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Select Employee</label>
                <select
                  name="employeeId"
                  className="form-select"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  required
                  disabled={employees.length === 0}
                >
                  <option value="">
                    {employees.length === 0 ? 'No employees available' : 'Choose an employee'}
                  </option>
                  {employees.map(employee => (
                    <option key={employee._id} value={employee._id}>
                      {employee.employeeId} - {employee.firstName} {employee.lastName} ({employee.department})
                    </option>
                  ))}
                </select>
                {employees.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    💡 No employees found. Please <button 
                      type="button" 
                      onClick={() => navigate('/employees/add')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      add employees first
                    </button> before generating payroll.
                  </p>
                )}
              </div>

              {employeeData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Employee Details</h4>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {employeeData.firstName} {employeeData.lastName}<br/>
                    <strong>Department:</strong> {employeeData.department}<br/>
                    <strong>Designation:</strong> {employeeData.designation}<br/>
                    <strong>Current Salary:</strong> ₹{employeeData.currentSalary?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payroll Period */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCalendar />
              Payroll Period
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Month</label>
                <select
                  name="month"
                  className="form-select"
                  value={formData.month}
                  onChange={handleChange}
                  required
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  name="year"
                  className="form-input"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="2020"
                  max="2030"
                />
              </div>
            </div>
          </div>

          {/* Basic Salary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaMoneyBillWave />
              Basic Salary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Basic Salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="basicSalary"
                    className="form-input pl-8"
                    value={formData.basicSalary}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Working Days</label>
                <input
                  type="number"
                  name="workingDays"
                  className="form-input"
                  value={formData.workingDays}
                  onChange={handleChange}
                  required
                  min="1"
                  max="31"
                />
              </div>
            </div>
          </div>

          {/* Allowances */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Allowances</h3>
            <div className="mb-4">
              <button
                type="button"
                onClick={autoCalculateAllowances}
                className="btn btn-outline"
              >
                <FaCalculator />
                Auto Calculate Allowances
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="form-label">HRA</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="allowances.hra"
                    className="form-input pl-8"
                    value={formData.allowances.hra}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">DA</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="allowances.da"
                    className="form-input pl-8"
                    value={formData.allowances.da}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">TA</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="allowances.ta"
                    className="form-input pl-8"
                    value={formData.allowances.ta}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Other Allowances</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="allowances.other"
                    className="form-input pl-8"
                    value={formData.allowances.other}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bonuses */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bonuses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Performance Bonus</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="bonuses.performance"
                    className="form-input pl-8"
                    value={formData.bonuses.performance}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Other Bonuses</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="bonuses.other"
                    className="form-input pl-8"
                    value={formData.bonuses.other}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deductions</h3>
            <div className="mb-4">
              <button
                type="button"
                onClick={autoCalculateDeductions}
                className="btn btn-outline"
              >
                <FaCalculator />
                Auto Calculate Deductions
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="form-group">
                <label className="form-label">Tax</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="deductions.tax"
                    className="form-input pl-8"
                    value={formData.deductions.tax}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PF</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="deductions.pf"
                    className="form-input pl-8"
                    value={formData.deductions.pf}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ESI</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="deductions.esi"
                    className="form-input pl-8"
                    value={formData.deductions.esi}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Loan</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="deductions.loan"
                    className="form-input pl-8"
                    value={formData.deductions.loan}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Other Deductions</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="deductions.other"
                    className="form-input pl-8"
                    value={formData.deductions.other}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Leave Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Paid Leaves</label>
                <input
                  type="number"
                  name="leaves.paid"
                  className="form-input"
                  value={formData.leaves.paid}
                  onChange={handleChange}
                  min="0"
                  max="31"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unpaid Leaves</label>
                <input
                  type="number"
                  name="leaves.unpaid"
                  className="form-input"
                  value={formData.leaves.unpaid}
                  onChange={handleChange}
                  min="0"
                  max="31"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea
              name="remarks"
              className="form-input"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              rows="3"
              placeholder="Any additional notes or remarks..."
            />
          </div>

          {/* Salary Summary */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Gross Salary</p>
                <p className="text-2xl font-bold text-green-600">₹{calculateGrossSalary().toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600">₹{calculateDeductions().toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Net Salary</p>
                <p className="text-2xl font-bold text-blue-600">₹{calculateNetSalary().toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/payroll')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedEmployee}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FaSave />
                  Generate Payroll
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayrollForm; 