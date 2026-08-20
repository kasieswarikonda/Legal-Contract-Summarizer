import React from 'react';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Navbar from '../components/common/Navbar';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';

function ProtectedRoute({children}){
  const {loading, isAuthenticated} = useAuth();
  if (loading) return <div className="loading-screen">Loading your workspace...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({children}){
  const {loading, isAuthenticated} = useAuth();
  if (loading) return <div className="loading-screen">Loading your workspace...</div>;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function AppRoutes(){
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login/></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register/></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
