import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import AuthLayout from '../../layouts/AuthLayout';

export default function Register(){
  const {register} = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({name: '', email: '', password: '', confirmPassword: ''});
  const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false);
  async function submit(event){
    event.preventDefault(); setError('');
    if (!form.name || !form.email || form.password.length < 8) return setError('Enter a name, valid email, and password of at least 8 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords must match');
    setSubmitting(true);
    try { await register(form); navigate('/dashboard'); }
    catch (requestError) { setError(requestError.response?.data?.message || Object.values(requestError.response?.data?.errors || {})[0] || 'Unable to create account'); }
    finally { setSubmitting(false); }
  }
  return (
    <AuthLayout><form className="auth-card" onSubmit={submit}><p className="eyebrow">Start securely</p><h1>Create your account</h1><p className="muted">Keep your contract workspace private and organized.</p>{error && <p className="form-error">{error}</p>}<label>Full Name<input value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoComplete="name" /></label><label>Email<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} autoComplete="email" /></label><label>Password<input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} autoComplete="new-password" /></label><label>Confirm Password<input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} autoComplete="new-password" /></label><button disabled={submitting}>{submitting ? 'Creating account...' : 'Sign Up'}</button><p className="form-footer">Already have an account? <Link to="/login">Login</Link></p></form></AuthLayout>
  )
}
