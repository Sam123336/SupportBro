import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClientPortal from './pages/ClientPortal';
import EngineerPortal from './pages/EngineerPortal';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Navbar />
            <main className="min-h-screen">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/client" 
                    element={
                      <ProtectedRoute allowedRoles={['client']}>
                        <ClientPortal />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/engineer" 
                    element={
                      <ProtectedRoute allowedRoles={['engineer']}>
                        <EngineerPortal />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
            <footer className="bg-white border-t border-gray-200 mt-auto">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <p className="text-center text-gray-500 text-sm">
                  &copy; 2025 Support Ticket System. All rights reserved.
                </p>
              </div>
            </footer>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
