import React from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';

export default function AppRoutes(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/" element={<Dashboard/>} />
      </Routes>
    </BrowserRouter>
  )
}
