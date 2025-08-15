import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaDownload, FaEdit, FaMoneyBillWave, FaCalendar, FaUser, FaCalculator } from 'react-icons/fa';

const PayrollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayroll();
  }, [id]);

  const fetchPayroll = async () => {
    try {
      const response = await axios.get(`/payroll/${id}`);
      setPayroll(response.data);
    } catch (error) {
      toast.error('Failed to load payroll data');
      navigate('/payroll');
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async (format) => {
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

  if (!payroll) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Payroll not found</p>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Payroll Details</h1>
            <p className="text-gray-600">
              {getMonthName(payroll.month)} {payroll.year} - {payroll.employeeId?.firstName} {payroll.employeeId?.lastName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {payroll.status === 'processed' && (
            <>
              <button
                onClick={() => downloadPayslip('pdf')}
                className="btn btn-success"
              >
                <FaDownload />
                Download PDF
              </button>
              <button
                onClick={() => downloadPayslip('excel')}
                className="btn btn-success"
              >
                <FaDownload />
                Download Excel
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/payroll/${id}/edit`)}
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
              {payroll.employeeId?.firstName} {payroll.employeeId?.lastName}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Employee ID</label>
            <p className="text-gray-900 font-mono">{payroll.employeeId?.employeeId}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Department</label>
            <p className="text-gray-900">{payroll.employeeId?.department}</p>
          </div>
        </div>
      </div>

      {/* Payroll Period */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FaCalendar className="text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Payroll Period</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Month</label>
            <p className="text-gray-900 font-semibold">{getMonthName(payroll.month)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Year</label>
            <p className="text-gray-900 font-semibold">{payroll.year}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1">{getStatusBadge(payroll.status)}</div>
          </div>
        </div>
      </div>

      {/* Salary Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FaMoneyBillWave className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Earnings</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Basic Salary</span>
              <span className="font-semibold">₹{payroll.basicSalary?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">HRA</span>
              <span className="font-semibold">₹{payroll.allowances?.hra?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">DA</span>
              <span className="font-semibold">₹{payroll.allowances?.da?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">TA</span>
              <span className="font-semibold">₹{payroll.allowances?.ta?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Other Allowances</span>
              <span className="font-semibold">₹{payroll.allowances?.other?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Performance Bonus</span>
              <span className="font-semibold">₹{payroll.bonuses?.performance?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Other Bonuses</span>
              <span className="font-semibold">₹{payroll.bonuses?.other?.toLocaleString()}</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg font-bold text-green-600">
              <span>Gross Salary</span>
              <span>₹{payroll.grossSalary?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FaCalculator className="text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Deductions</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-semibold text-red-600">₹{payroll.deductions?.tax?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PF</span>
              <span className="font-semibold text-red-600">₹{payroll.deductions?.pf?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ESI</span>
              <span className="font-semibold text-red-600">₹{payroll.deductions?.esi?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loan</span>
              <span className="font-semibold text-red-600">₹{payroll.deductions?.loan?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Other Deductions</span>
              <span className="font-semibold text-red-600">₹{payroll.deductions?.other?.toLocaleString()}</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg font-bold text-red-600">
              <span>Total Deductions</span>
              <span>₹{((payroll.grossSalary || 0) - (payroll.netSalary || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Salary */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Net Salary</h3>
          <p className="text-4xl font-bold text-green-600">₹{payroll.netSalary?.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-2">
            {payroll.workingDays} working days | {payroll.leaves?.paid || 0} paid leaves | {payroll.leaves?.unpaid || 0} unpaid leaves
          </p>
        </div>
      </div>

      {/* Additional Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Working Days</label>
            <p className="text-gray-900">{payroll.workingDays} days</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Paid Leaves</label>
            <p className="text-gray-900">{payroll.leaves?.paid || 0} days</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Unpaid Leaves</label>
            <p className="text-gray-900">{payroll.leaves?.unpaid || 0} days</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Remarks</label>
            <p className="text-gray-900">{payroll.remarks || 'No remarks'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDetail; 