import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Email and password are required.');
    setSubmitting(true);
    try { await login(form); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Invalid email or password.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚖</div>
          LegalAI
        </div>
        <h2>Welcome back</h2>
        <p className="sub">Sign in to continue to LegalAI</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
          </div>
          <button className="auth-btn" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/register">Sign up</Link></p>
      </div>
    </div>
  );
}
