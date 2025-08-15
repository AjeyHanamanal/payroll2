import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaFilter, FaCalendar, FaCheck, FaTimes } from 'react-icons/fa';

const LeaveList = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLeaves();
  }, [currentPage, searchTerm, leaveTypeFilter, statusFilter]);

  const fetchLeaves = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        leaveType: leaveTypeFilter,
        status: statusFilter
      };

      const response = await axios.get('/leaves', { params });
      setLeaves(response.data.leaves);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load leave requests');
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await axios.delete(`/leaves/${id}`);
        toast.success('Leave request deleted successfully');
        fetchLeaves();
      } catch (error) {
        toast.error('Failed to delete leave request');
        console.error('Error deleting leave:', error);
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`/leaves/${id}`, { status });
      toast.success(`Leave request ${status} successfully`);
      fetchLeaves();
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
      month: 'short',
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

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-red-600">
            <FaCalendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
            <p className="text-gray-600">Manage employee leave requests</p>
          </div>
        </div>
        <Link to="/leaves/new" className="btn btn-primary">
          <FaPlus />
          New Leave Request
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="stat-card">
          <div className="stat-icon">
            <FaCalendar />
          </div>
          <div className="stat-value">{leaves.length}</div>
          <div className="stat-label">Total Requests</div>
          <div className="stat-subtext">Currently displayed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaCheck />
          </div>
          <div className="stat-value">
            {leaves.filter(leave => leave.status === 'approved').length}
          </div>
          <div className="stat-label">Approved</div>
          <div className="stat-subtext">Leave requests approved</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaTimes />
          </div>
          <div className="stat-value">
            {leaves.filter(leave => leave.status === 'rejected').length}
          </div>
          <div className="stat-label">Rejected</div>
          <div className="stat-subtext">Leave requests rejected</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaFilter />
          </div>
          <div className="stat-value">{totalPages}</div>
          <div className="stat-label">Total Pages</div>
          <div className="stat-subtext">Navigate through results</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="form-input pl-12"
                placeholder="Search employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select
              className="form-select"
              value={leaveTypeFilter}
              onChange={(e) => setLeaveTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="annual">Annual Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">&nbsp;</label>
            <button
              onClick={() => {
                setSearchTerm('');
                setLeaveTypeFilter('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="btn btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Leave Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Period</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                  <td>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {leave.employeeId?.firstName} {leave.employeeId?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {leave.employeeId?.employeeId} - {leave.employeeId?.department}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {getLeaveTypeLabel(leave.leaveType)}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="font-medium">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="font-medium">{leave.numberOfDays} day(s)</div>
                    </div>
                  </td>
                  <td>
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 truncate" title={leave.reason}>
                        {leave.reason}
                      </p>
                    </div>
                  </td>
                  <td>{getStatusBadge(leave.status)}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to={`/leaves/${leave._id}`}
                        className="btn btn-outline"
                        title="View Details"
                      >
                        <FaEye />
                      </Link>
                      <Link
                        to={`/leaves/${leave._id}/edit`}
                        className="btn btn-outline"
                        title="Edit"
                      >
                        <FaEdit />
                      </Link>
                      {leave.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(leave._id, 'approved')}
                            className="btn btn-success"
                            title="Approve"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => handleStatusChange(leave._id, 'rejected')}
                            className="btn btn-danger"
                            title="Reject"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(leave._id)}
                        className="btn btn-danger"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-outline"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-outline"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {leaves.length === 0 && (
          <div className="text-center py-12">
            <FaCalendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No leave requests found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or create a new leave request</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveList; 