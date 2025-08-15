import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaArrowLeft, FaUser, FaBuilding, FaMapMarkerAlt, FaUniversity, FaCalendar, FaPhone, FaEnvelope } from 'react-icons/fa';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      const [employeeRes, payrollsRes, leavesRes] = await Promise.all([
        axios.get(`/employees/${id}`),
        axios.get(`/payroll?employeeId=${id}&limit=5`),
        axios.get(`/leaves?employeeId=${id}&limit=5`)
      ]);

      setEmployee(employeeRes.data);
      setPayrolls(payrollsRes.data.payrolls || []);
      setLeaves(leavesRes.data.leaves || []);
    } catch (error) {
      toast.error('Failed to load employee data');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'badge-success',
      inactive: 'badge-warning',
      terminated: 'badge-danger'
    };
    return <span className={`badge ${statusClasses[status]}`}>{status}</span>;
  };

  const getLeaveTypeLabel = (type) => {
    const leaveTypes = {
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      annual: 'Annual Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      other: 'Other'
    };
    return leaveTypes[type] || type;
  };

  const getLeaveStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
    };
    return <span className={`badge ${statusClasses[status]}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Employee not found</p>
      </div>
    );
  }

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
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-gray-600">{employee.employeeId} - {employee.designation}</p>
          </div>
        </div>
        <Link
          to={`/employees/${id}/edit`}
          className="btn btn-primary"
        >
          <FaEdit />
          Edit Employee
        </Link>
      </div>

      {/* Employee Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FaUser className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Employee ID</label>
              <p className="text-gray-900 font-mono">{employee.employeeId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-gray-900">{employee.firstName} {employee.lastName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">
                <a href={`mailto:${employee.email}`} className="text-blue-600 hover:text-blue-800">
                  {employee.email}
                </a>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900">
                <a href={`tel:${employee.phone}`} className="text-blue-600 hover:text-blue-800">
                  {employee.phone}
                </a>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="text-gray-900">{formatDate(employee.dateOfBirth)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(employee.status)}</div>
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FaBuilding className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Employment Details</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Department</label>
              <p className="text-gray-900">{employee.department}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Designation</label>
              <p className="text-gray-900">{employee.designation}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Joining</label>
              <p className="text-gray-900">{formatDate(employee.dateOfJoining)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Base Salary</label>
              <p className="text-gray-900 font-semibold">₹{employee.baseSalary?.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Current Salary</label>
              <p className="text-gray-900 font-semibold text-green-600">₹{employee.currentSalary?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FaMapMarkerAlt className="text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Address</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Street</label>
              <p className="text-gray-900">{employee.address?.street || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">City</label>
              <p className="text-gray-900">{employee.address?.city || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">State</label>
              <p className="text-gray-900">{employee.address?.state || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">ZIP Code</label>
              <p className="text-gray-900">{employee.address?.zipCode || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FaUniversity className="text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Bank Name</label>
            <p className="text-gray-900">{employee.bankDetails?.bankName || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Account Number</label>
            <p className="text-gray-900 font-mono">{employee.bankDetails?.accountNumber || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">IFSC Code</label>
            <p className="text-gray-900 font-mono">{employee.bankDetails?.ifscCode || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Recent Payrolls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaCalendar className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Payrolls</h3>
          </div>
          <Link to="/payroll" className="btn btn-outline">
            View All
          </Link>
        </div>
        {payrolls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Gross Salary</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll._id}>
                    <td>{payroll.month}/{payroll.year}</td>
                    <td>₹{payroll.basicSalary?.toLocaleString()}</td>
                    <td>₹{payroll.grossSalary?.toLocaleString()}</td>
                    <td className="font-semibold text-green-600">₹{payroll.netSalary?.toLocaleString()}</td>
                    <td>{getStatusBadge(payroll.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No payroll records found</p>
        )}
      </div>

      {/* Recent Leaves */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaCalendar className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Leave Requests</h3>
          </div>
          <Link to="/leaves" className="btn btn-outline">
            View All
          </Link>
        </div>
        {leaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Period</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave._id}>
                    <td>{getLeaveTypeLabel(leave.leaveType)}</td>
                    <td>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</td>
                    <td>{leave.numberOfDays} day(s)</td>
                    <td>{getLeaveStatusBadge(leave.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No leave requests found</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetail; 