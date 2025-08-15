import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaCog, FaCalculator, FaUsers, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [incrementSettings, setIncrementSettings] = useState({
    interval: 1,
    incrementType: 'percentage',
    incrementValue: 10,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, settingsRes] = await Promise.all([
        axios.get('/admin/dashboard'),
        axios.get('/admin/increment-settings')
      ]);

      setStats(statsRes.data);
      if (settingsRes.data) {
        setIncrementSettings(settingsRes.data);
      }
    } catch (error) {
      toast.error('Failed to load admin data');
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrementChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIncrementSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveIncrementSettings = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.post('/admin/increment-settings', incrementSettings);
      toast.success('Increment settings saved successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save settings';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyIncrements = async () => {
    if (!window.confirm('This will apply salary increments to all eligible employees. Continue?')) {
      return;
    }

    setSaving(true);
    try {
      await axios.post('/admin/apply-increments');
      toast.success('Salary increments applied successfully');
      fetchData(); // Refresh stats
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to apply increments';
      toast.error(message);
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
          <FaCog className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600">Manage system configuration and settings</p>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-value">{stats?.employeeStats?.total || 0}</div>
          <div className="stat-label">Total Employees</div>
          <div className="stat-subtext">
            Active: {stats?.employeeStats?.active || 0} | Inactive: {stats?.employeeStats?.inactive || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-value">₹{(stats?.payrollStats?.totalAmount || 0).toLocaleString()}</div>
          <div className="stat-label">Total Payroll</div>
          <div className="stat-subtext">
            {stats?.payrollStats?.monthlyCount || 0} records this month
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-value">{stats?.departmentStats?.length || 0}</div>
          <div className="stat-label">Departments</div>
          <div className="stat-subtext">
            Active departments
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaCalculator />
          </div>
          <div className="stat-value">
            {incrementSettings.isActive ? 'Active' : 'Inactive'}
          </div>
          <div className="stat-label">Increment System</div>
          <div className="stat-subtext">
            {incrementSettings.incrementType === 'percentage' ? `${incrementSettings.incrementValue}%` : `₹${incrementSettings.incrementValue}`} every {incrementSettings.interval} year(s)
          </div>
        </div>
      </div>

      {/* Increment Settings */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <FaCalculator className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Salary Increment Settings</h2>
        </div>

        <form onSubmit={handleSaveIncrementSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-group">
              <label className="form-label">Increment Interval (Years)</label>
              <input
                type="number"
                name="interval"
                className="form-input"
                value={incrementSettings.interval}
                onChange={handleIncrementChange}
                min="1"
                max="10"
                required
              />
              <small className="text-gray-500">How often increments should be applied</small>
            </div>

            <div className="form-group">
              <label className="form-label">Increment Type</label>
              <select
                name="incrementType"
                className="form-select"
                value={incrementSettings.incrementType}
                onChange={handleIncrementChange}
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
              <small className="text-gray-500">Type of increment to apply</small>
            </div>

            <div className="form-group">
              <label className="form-label">Increment Value</label>
              <div className="relative">
                {incrementSettings.incrementType === 'percentage' && (
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                )}
                {incrementSettings.incrementType === 'fixed' && (
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                )}
                <input
                  type="number"
                  name="incrementValue"
                  className={`form-input ${incrementSettings.incrementType === 'percentage' || incrementSettings.incrementType === 'fixed' ? 'pl-8' : ''}`}
                  value={incrementSettings.incrementValue}
                  onChange={handleIncrementChange}
                  min="0"
                  step={incrementSettings.incrementType === 'percentage' ? '0.1' : '1000'}
                  required
                />
              </div>
              <small className="text-gray-500">
                {incrementSettings.incrementType === 'percentage' 
                  ? 'Percentage increase (e.g., 10 for 10%)' 
                  : 'Fixed amount in rupees'
                }
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  name="isActive"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={incrementSettings.isActive}
                  onChange={handleIncrementChange}
                />
                <label className="ml-2 text-sm text-gray-700">
                  Enable automatic increments
                </label>
              </div>
              <small className="text-gray-500">Enable or disable the increment system</small>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <div className="spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Settings
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleApplyIncrements}
              disabled={saving || !incrementSettings.isActive}
              className="btn btn-success"
            >
              {saving ? (
                <>
                  <div className="spinner"></div>
                  Applying...
                </>
              ) : (
                <>
                  <FaCalculator />
                  Apply Increments Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Department Statistics */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FaUsers className="text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Department Statistics</h3>
        </div>
        {stats?.departmentStats && stats.departmentStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employee Count</th>
                  <th>Average Salary</th>
                </tr>
              </thead>
              <tbody>
                {stats.departmentStats.map((dept) => (
                  <tr key={dept._id}>
                    <td className="font-semibold">{dept._id}</td>
                    <td>{dept.count}</td>
                    <td>₹{(dept.avgSalary || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No department data available</p>
        )}
      </div>

      {/* System Information */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FaCog className="text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">System Version</label>
            <p className="text-gray-900">Payroll Management System v1.0.0</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Database</label>
            <p className="text-gray-900">MongoDB</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Backend</label>
            <p className="text-gray-900">Node.js + Express</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Frontend</label>
            <p className="text-gray-900">React.js</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 