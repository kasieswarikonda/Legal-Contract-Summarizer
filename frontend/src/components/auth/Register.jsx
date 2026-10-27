import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || form.password.length < 8)
      return setError('Enter your name, a valid email, and a password of at least 8 characters.');
    if (form.password !== form.confirmPassword)
      return setError('Passwords do not match.');
    setSubmitting(true);
    try { await register(form); navigate('/dashboard'); }
    catch (err) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0] || 'Could not create account.');
    }
    finally { setSubmitting(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚖</div>
          LegalAI
        </div>
        <h2>Create account</h2>
        <p className="sub">Start analyzing contracts with AI</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="auth-field">
            <label>Full Name</label>
            <input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          </div>
          <div className="auth-field">
            <label>Confirm Password</label>
            <input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} autoComplete="new-password" />
          </div>
          <button className="auth-btn" disabled={submitting}>{submitting ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
