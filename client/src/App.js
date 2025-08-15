import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import EmployeeList from './components/employees/EmployeeList';
import EmployeeForm from './components/employees/EmployeeForm';
import EmployeeDetail from './components/employees/EmployeeDetail';
import PayrollList from './components/payroll/PayrollList';
import PayrollForm from './components/payroll/PayrollForm';
import PayrollDetail from './components/payroll/PayrollDetail';
import LeaveList from './components/leaves/LeaveList';
import LeaveForm from './components/leaves/LeaveForm';
import LeaveDetail from './components/leaves/LeaveDetail';
import AdminSettings from './components/admin/AdminSettings';
import Layout from './components/layout/Layout';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <PrivateRoute>
                  <Layout>
                    <EmployeeList />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/employees/new"
              element={
                <PrivateRoute>
                  <Layout>
                    <EmployeeForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <EmployeeDetail />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/employees/:id/edit"
              element={
                <PrivateRoute>
                  <Layout>
                    <EmployeeForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <PrivateRoute>
                  <Layout>
                    <PayrollList />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/payroll/generate"
              element={
                <PrivateRoute>
                  <Layout>
                    <PayrollForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/payroll/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <PayrollDetail />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/leaves"
              element={
                <PrivateRoute>
                  <Layout>
                    <LeaveList />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/leaves/new"
              element={
                <PrivateRoute>
                  <Layout>
                    <LeaveForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/leaves/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <LeaveDetail />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <Layout>
                    <AdminSettings />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 