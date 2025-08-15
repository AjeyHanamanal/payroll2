import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaEdit, FaCalendar, FaUser, FaFileAlt, FaCheck, FaTimes } from 'react-icons/fa';

const LeaveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeave();
  }, [id]);

  const fetchLeave = async () => {
    try {
      const response = await axios.get(`/leaves/${id}`);
      setLeave(response.data);
    } catch (error) {
      toast.error('Failed to load leave data');
      navigate('/leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await axios.put(`/leaves/${id}`, { status });
      toast.success(`Leave request ${status} successfully`);
      fetchLeave(); // Refresh data
    } catch (error) {
      toast.error('Failed to update leave status');
      console.error('Error updating leave status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Leave request not found</p>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Leave Request Details</h1>
            <p className="text-gray-600">
              {leave.employeeId?.firstName} {leave.employeeId?.lastName} - {getLeaveTypeLabel(leave.leaveType)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {leave.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange('approved')}
                className="btn btn-success"
              >
                <FaCheck />
                Approve
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                className="btn btn-danger"
              >
                <FaTimes />
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/leaves/${id}/edit`)}
            className="btn btn-primary"
          >
            <FaEdit />
            Edit
          </button>
        </div>
      </div>

      {/* Employee Information */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FaUser className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Employee Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Employee Name</label>
            <p className="text-gray-900 font-semibold">
              {leave.employeeId?.firstName} {leave.employeeId?.lastName}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Employee ID</label>
            <p className="text-gray-900 font-mono">{leave.employeeId?.employeeId}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Department</label>
            <p className="text-gray-900">{leave.employeeId?.department}</p>
          </div>
        </div>
      </div>

      {/* Leave Details */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FaCalendar className="text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Leave Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Leave Type</label>
            <p className="text-gray-900 font-semibold">{getLeaveTypeLabel(leave.leaveType)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Start Date</label>
            <p className="text-gray-900">{formatDate(leave.startDate)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">End Date</label>
            <p className="text-gray-900">{formatDate(leave.endDate)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Duration</label>
            <p className="text-gray-900 font-semibold">{leave.numberOfDays} day(s)</p>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FaFileAlt className="text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Status Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Current Status</label>
            <div className="mt-1">{getStatusBadge(leave.status)}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Request Date</label>
            <p className="text-gray-900">{formatDate(leave.createdAt)}</p>
          </div>
          {leave.approvedBy && (
            <div>
              <label className="text-sm font-medium text-gray-500">Approved By</label>
              <p className="text-gray-900">{leave.approvedBy}</p>
            </div>
          )}
          {leave.approvedAt && (
            <div>
              <label className="text-sm font-medium text-gray-500">Approved Date</label>
              <p className="text-gray-900">{formatDate(leave.approvedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reason and Remarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FaFileAlt className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Reason for Leave</h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-900 whitespace-pre-wrap">{leave.reason}</p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FaFileAlt className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Remarks</h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-900 whitespace-pre-wrap">{leave.remarks || 'No remarks provided'}</p>
          </div>
        </div>
      </div>

      {/* Leave Summary */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Leave Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Employee</p>
              <p className="text-lg font-semibold text-gray-900">
                {leave.employeeId?.firstName} {leave.employeeId?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Leave Type</p>
              <p className="text-lg font-semibold text-gray-900">
                {getLeaveTypeLabel(leave.leaveType)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-lg font-semibold text-gray-900">{leave.numberOfDays} day(s)</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">Period</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveDetail; 