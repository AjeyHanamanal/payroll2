import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaUsers,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaEye,
  FaDownload,
  FaChartBar,
  FaChartPie
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const departmentData = stats.departmentStats?.map(dept => ({
    name: dept._id,
    employees: dept.count
  })) || [];

  const leaveStatusData = [
    { name: 'Pending', value: stats.leaveStats?.pending || 0, color: '#f59e0b' },
    { name: 'Approved', value: stats.leaveStats?.approved || 0, color: '#10b981' },
    { name: 'Rejected', value: stats.leaveStats?.rejected || 0, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/employees/new" className="btn btn-primary">
            <FaPlus />
            Add Employee
          </Link>
          <Link to="/payroll/generate" className="btn btn-success">
            <FaMoneyBillWave />
            Generate Payroll
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-value">{stats.employeeStats?.total || 0}</div>
          <div className="stat-label">Total Employees</div>
          <div className="stat-subtext">
            Active: {stats.employeeStats?.active || 0} | Inactive: {stats.employeeStats?.inactive || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-value">₹{(stats.payrollStats?.totalAmount || 0).toLocaleString()}</div>
          <div className="stat-label">Monthly Payroll</div>
          <div className="stat-subtext">
            {stats.payrollStats?.monthlyCount || 0} employees processed
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-value">
            {(stats.leaveStats?.pending || 0) + (stats.leaveStats?.approved || 0) + (stats.leaveStats?.rejected || 0)}
          </div>
          <div className="stat-label">Leave Requests</div>
          <div className="stat-subtext">
            {stats.leaveStats?.pending || 0} pending approval
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-value">
            {stats.recentActivities?.employees?.length || 0}
          </div>
          <div className="stat-label">Recent Activity</div>
          <div className="stat-subtext">
            New employees this month
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Employees by Department</h3>
            <FaChartBar className="text-gray-400" />
          </div>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="employees" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-placeholder">
              <FaChartBar />
              <p>No department data available</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Leave Status Distribution</h3>
            <FaChartPie className="text-gray-400" />
          </div>
          {leaveStatusData.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-placeholder">
              <FaChartPie />
              <p>No leave data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Employees</h3>
          <div className="space-y-3">
            {stats.recentActivities?.employees?.map((employee) => (
              <div key={employee._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{employee.department}</p>
                </div>
                <Link
                  to={`/employees/${employee._id}`}
                  className="btn btn-outline"
                >
                  <FaEye />
                  View
                </Link>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent employees</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payrolls</h3>
          <div className="space-y-3">
            {stats.recentActivities?.payrolls?.map((payroll) => (
              <div key={payroll._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">
                    {payroll.employeeId?.firstName} {payroll.employeeId?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payroll.month}/{payroll.year} - ₹{payroll.netSalary?.toLocaleString()}
                  </p>
                </div>
                <Link
                  to={`/payroll/${payroll._id}`}
                  className="btn btn-outline"
                >
                  <FaDownload />
                  Download
                </Link>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent payrolls</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leaves</h3>
          <div className="space-y-3">
            {stats.recentActivities?.leaves?.map((leave) => (
              <div key={leave._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">
                    {leave.employeeId?.firstName} {leave.employeeId?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {leave.leaveType} - {leave.numberOfDays} days
                  </p>
                </div>
                <span className={`badge badge-${leave.status === 'approved' ? 'success' : leave.status === 'pending' ? 'warning' : 'danger'}`}>
                  {leave.status}
                </span>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent leaves</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 