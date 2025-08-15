import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaArrowLeft, FaCalendar, FaUser, FaFileAlt } from 'react-icons/fa';

const LeaveForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    numberOfDays: 0,
    reason: '',
    status: 'pending',
    remarks: ''
  });

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'annual', label: 'Annual Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchEmployees();
    if (isEditing) {
      fetchLeave();
    }
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/employees?limit=1000');
      setEmployees(response.data.employees);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  const fetchLeave = async () => {
    try {
      const response = await axios.get(`/leaves/${id}`);
      const leave = response.data;
      
      // Format dates for input fields
      const formattedLeave = {
        ...leave,
        startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : '',
        endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : ''
      };
      
      setFormData(formattedLeave);
      setSelectedEmployee(leave.employeeId);
    } catch (error) {
      toast.error('Failed to load leave data');
      navigate('/leaves');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate number of days when dates change
    if (name === 'startDate' || name === 'endDate') {
      if (formData.startDate && formData.endDate) {
        calculateDays();
      }
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      
      setFormData(prev => ({
        ...prev,
        numberOfDays: diffDays
      }));
    }
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    setSelectedEmployee(employeeId);
    setFormData(prev => ({
      ...prev,
      employeeId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await axios.put(`/leaves/${id}`, formData);
        toast.success('Leave request updated successfully');
      } else {
        await axios.post('/leaves', formData);
        toast.success('Leave request submitted successfully');
      }
      navigate('/leaves');
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? `${employee.employeeId} - ${employee.firstName} ${employee.lastName}` : '';
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leaves')}
            className="btn btn-outline"
          >
            <FaArrowLeft />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Leave Request' : 'New Leave Request'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update leave request details' : 'Submit a new leave request'}
            </p>
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
            <div className="form-group">
              <label className="form-label">Select Employee</label>
              <select
                name="employeeId"
                className="form-select"
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                required
                disabled={isEditing}
              >
                <option value="">Choose an employee</option>
                {employees.map(employee => (
                  <option key={employee._id} value={employee._id}>
                    {employee.employeeId} - {employee.firstName} {employee.lastName} ({employee.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leave Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCalendar />
              Leave Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select
                  name="leaveType"
                  className="form-select"
                  value={formData.leaveType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  className="form-input"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  className="form-input"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Number of Days</label>
                <input
                  type="number"
                  name="numberOfDays"
                  className="form-input"
                  value={formData.numberOfDays}
                  onChange={handleChange}
                  required
                  min="0.5"
                  max="365"
                  step="0.5"
                />
                <small className="text-gray-500">Use 0.5 for half day</small>
              </div>

              {isEditing && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Reason and Remarks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaFileAlt />
              Additional Information
            </h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Reason for Leave</label>
                <textarea
                  name="reason"
                  className="form-input"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Please provide a detailed reason for your leave request..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Remarks (Optional)</label>
                <textarea
                  name="remarks"
                  className="form-input"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Any additional comments or notes..."
                />
              </div>
            </div>
          </div>

          {/* Leave Summary */}
          {formData.startDate && formData.endDate && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-semibold text-gray-900">{getEmployeeName(formData.employeeId)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Leave Type</p>
                  <p className="font-semibold text-gray-900">
                    {leaveTypes.find(type => type.value === formData.leaveType)?.label || 'Not specified'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{formData.numberOfDays} day(s)</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Period</p>
                <p className="font-semibold text-gray-900">
                  {formData.startDate} to {formData.endDate}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/leaves')}
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
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <FaSave />
                  {isEditing ? 'Update Leave Request' : 'Submit Leave Request'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm; 