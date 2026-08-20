import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function Navbar(){
  const {user, isAuthenticated, logout} = useAuth();
  const navigate = useNavigate();
  async function handleLogout(){
    await logout();
    navigate('/login');
  }
  return <header className="navbar"><Link className="brand" to={isAuthenticated ? '/dashboard' : '/login'}><span className="brand-mark" aria-hidden="true">◈</span>LegalAI</Link><nav>{isAuthenticated ? <><span className="user-name">{user.name}</span><button className="link-button" onClick={handleLogout}>Logout</button></> : <><Link to="/login">Login</Link><Link className="nav-cta" to="/register">Sign Up</Link></>}</nav></header>;
}
