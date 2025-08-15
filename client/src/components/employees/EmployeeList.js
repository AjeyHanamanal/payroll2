import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaFilter, FaUsers } from 'react-icons/fa';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [currentPage, searchTerm, departmentFilter, statusFilter]);

  const fetchEmployees = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        department: departmentFilter,
        status: statusFilter
      };

      const response = await axios.get('/employees', { params });
      setEmployees(response.data.employees);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load employees');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/employees/departments/list');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`/employees/${id}`);
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } catch (error) {
        toast.error('Failed to delete employee');
        console.error('Error deleting employee:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'badge-success',
      inactive: 'badge-warning',
      terminated: 'badge-danger'
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

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <FaUsers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600">Manage your employee database</p>
          </div>
        </div>
        <Link to="/employees/new" className="btn btn-primary">
          <FaPlus />
          Add Employee
        </Link>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-value">{employees.length}</div>
          <div className="stat-label">Total Employees</div>
          <div className="stat-subtext">Currently displayed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaFilter />
          </div>
          <div className="stat-value">{departments.length}</div>
          <div className="stat-label">Departments</div>
          <div className="stat-subtext">Available for filtering</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaSearch />
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
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">&nbsp;</label>
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('');
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

      {/* Employee Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                  <td className="font-mono text-sm">{employee.employeeId}</td>
                  <td>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {employee.department}
                    </span>
                  </td>
                  <td>{employee.designation}</td>
                  <td className="text-blue-600 hover:text-blue-800">
                    <a href={`mailto:${employee.email}`}>{employee.email}</a>
                  </td>
                  <td>{employee.phone}</td>
                  <td>{getStatusBadge(employee.status)}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to={`/employees/${employee._id}`}
                        className="btn btn-outline"
                        title="View"
                      >
                        <FaEye />
                      </Link>
                      <Link
                        to={`/employees/${employee._id}/edit`}
                        className="btn btn-outline"
                        title="Edit"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleDelete(employee._id)}
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

        {employees.length === 0 && (
          <div className="text-center py-12">
            <FaUsers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No employees found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or add a new employee</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList; 