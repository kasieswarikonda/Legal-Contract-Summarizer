import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import AuthLayout from '../../layouts/AuthLayout';

export default function Login(){
  const {login} = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({email: '', password: ''});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function submit(event){
    event.preventDefault(); setError('');
    if (!form.email || !form.password) return setError('Email and password are required');
    setSubmitting(true);
    try { await login(form); navigate('/dashboard'); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to sign in'); }
    finally { setSubmitting(false); }
  }
  return (
    <AuthLayout><form className="auth-card" onSubmit={submit}><p className="eyebrow">LegalAI access</p><h1>Welcome back</h1><p className="muted">Sign in to continue to LegalAI.</p>{error && <p className="form-error">{error}</p>}<label>Email<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} autoComplete="email" /></label><label>Password<input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} autoComplete="current-password" /></label><button disabled={submitting}>{submitting ? 'Signing in...' : 'Login'}</button><p className="form-footer">Don't have an account? <Link to="/register">Sign Up</Link></p></form></AuthLayout>
  )
}
