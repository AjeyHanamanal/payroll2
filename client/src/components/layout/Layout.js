import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaHome,
  FaUsers,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FaHome },
    { name: 'Employees', href: '/employees', icon: FaUsers },
    { name: 'Payroll', href: '/payroll', icon: FaMoneyBillWave },
    { name: 'Leaves', href: '/leaves', icon: FaCalendarAlt },
    { name: 'Admin Settings', href: '/admin', icon: FaCog },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="app-container">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black bg-opacity-50"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Payroll System</h1>
        </div>
        
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="nav-icon" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{user?.username}</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Logout"
            >
              <FaSignOutAlt className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars className="h-6 w-6" />
            </button>
            <h1 className="header-title">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{user?.username}</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout; 