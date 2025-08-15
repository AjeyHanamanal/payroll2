import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaDownload, FaEye, FaFilter, FaMoneyBillWave, FaCalendar } from 'react-icons/fa';

const PayrollList = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPayrolls();
  }, [currentPage, searchTerm, monthFilter, yearFilter, statusFilter]);

  const fetchPayrolls = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        month: monthFilter,
        year: yearFilter,
        status: statusFilter
      };

      const response = await axios.get('/payroll', { params });
      setPayrolls(response.data.payrolls);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load payroll records');
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      try {
        await axios.delete(`/payroll/${id}`);
        toast.success('Payroll record deleted successfully');
        fetchPayrolls();
      } catch (error) {
        toast.error('Failed to delete payroll record');
        console.error('Error deleting payroll:', error);
      }
    }
  };

  const downloadPayslip = async (id, format) => {
    try {
      const response = await axios.get(`/payroll/download/${format}/${id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Payslip downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to download payslip');
      console.error('Error downloading payslip:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      processed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger'
    };
    return <span className={`badge ${statusClasses[status]}`}>{status}</span>;
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || month;
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
          <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-blue-600">
            <FaMoneyBillWave className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Records</h1>
            <p className="text-gray-600">Manage and view employee payroll records</p>
          </div>
        </div>
        <Link to="/payroll/generate" className="btn btn-primary">
          <FaPlus />
          Generate Payroll
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="stat-card">
          <div className="stat-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-value">{payrolls.length}</div>
          <div className="stat-label">Total Records</div>
          <div className="stat-subtext">Currently displayed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaCalendar />
          </div>
          <div className="stat-value">
            ₹{payrolls.reduce((sum, payroll) => sum + (payroll.netSalary || 0), 0).toLocaleString()}
          </div>
          <div className="stat-label">Total Net Salary</div>
          <div className="stat-subtext">Sum of all records</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaFilter />
          </div>
          <div className="stat-value">{totalPages}</div>
          <div className="stat-label">Total Pages</div>
          <div className="stat-subtext">Navigate through results</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaDownload />
          </div>
          <div className="stat-value">
            {payrolls.filter(p => p.status === 'processed').length}
          </div>
          <div className="stat-label">Processed</div>
          <div className="stat-subtext">Ready for download</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <label className="form-label">Month</label>
            <select
              className="form-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="">All Months</option>
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
            <select
              className="form-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
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
              <option value="processed">Processed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">&nbsp;</label>
            <button
              onClick={() => {
                setSearchTerm('');
                setMonthFilter('');
                setYearFilter('');
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

      {/* Payroll Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Basic Salary</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Working Days</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((payroll) => (
                <tr key={payroll._id} className="hover:bg-gray-50 transition-colors">
                  <td>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {payroll.employeeId?.firstName} {payroll.employeeId?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payroll.employeeId?.employeeId} - {payroll.employeeId?.department}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="font-medium">{getMonthName(payroll.month)} {payroll.year}</div>
                    </div>
                  </td>
                  <td className="text-green-600 font-medium">
                    ₹{payroll.basicSalary?.toLocaleString()}
                  </td>
                  <td className="text-blue-600 font-medium">
                    ₹{payroll.grossSalary?.toLocaleString()}
                  </td>
                  <td className="text-red-600 font-medium">
                    ₹{((payroll.grossSalary || 0) - (payroll.netSalary || 0)).toLocaleString()}
                  </td>
                  <td className="text-green-600 font-bold">
                    ₹{payroll.netSalary?.toLocaleString()}
                  </td>
                  <td>
                    <div className="text-sm">
                      <div>{payroll.workingDays} days</div>
                      <div className="text-gray-500">
                        {payroll.leaves?.paid || 0} paid, {payroll.leaves?.unpaid || 0} unpaid
                      </div>
                    </div>
                  </td>
                  <td>{getStatusBadge(payroll.status)}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to={`/payroll/${payroll._id}`}
                        className="btn btn-outline"
                        title="View Details"
                      >
                        <FaEye />
                      </Link>
                      {payroll.status === 'processed' && (
                        <>
                          <button
                            onClick={() => downloadPayslip(payroll._id, 'pdf')}
                            className="btn btn-outline"
                            title="Download PDF"
                          >
                            <FaDownload />
                          </button>
                          <button
                            onClick={() => downloadPayslip(payroll._id, 'excel')}
                            className="btn btn-outline"
                            title="Download Excel"
                          >
                            <FaDownload />
                          </button>
                        </>
                      )}
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

        {payrolls.length === 0 && (
          <div className="text-center py-12">
            <FaMoneyBillWave className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No payroll records found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or generate a new payroll</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollList; 