import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AuthDebug = () => {
  const { user, isAuthenticated, login } = useAuth();
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      const result = await login('admin', 'admin123');
      setTestResult(`Login result: ${result}`);
    } catch (error) {
      setTestResult(`Login error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDashboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/dashboard');
      setTestResult(`Dashboard success: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      setTestResult(`Dashboard error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthStatus = () => {
    const token = localStorage.getItem('token');
    setTestResult(`Auth Status:
- isAuthenticated: ${isAuthenticated}
- user: ${JSON.stringify(user, null, 2)}
- token: ${token ? 'Present' : 'Missing'}
- token length: ${token ? token.length : 0}`);
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold mb-4">Authentication Debug</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Current Status:</h3>
          <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          <p>User: {user ? user.username : 'None'}</p>
        </div>

        <div className="space-y-2">
          <button 
            onClick={testLogin} 
            disabled={loading}
            className="btn btn-primary"
          >
            Test Login
          </button>
          
          <button 
            onClick={testDashboard} 
            disabled={loading || !isAuthenticated}
            className="btn btn-success"
          >
            Test Dashboard API
          </button>
          
          <button 
            onClick={testAuthStatus} 
            className="btn btn-outline"
          >
            Check Auth Status
          </button>
        </div>

        {testResult && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDebug; 