import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, register } from '../redux/authSlice';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
  });

  if (user) return <Navigate to="/app" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) toast.success('Workspace created');
    else toast.error(result.payload || 'Registration failed');
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <h1>Launch your company workspace in minutes.</h1>
        <p>Organization, HR, CRM, Sales, Finance, Projects, and AI — modular plugins on one core.</p>
      </div>
      <div className="auth-panel">
        <form className="auth-card form" onSubmit={onSubmit}>
          <h2>Register</h2>
          <p className="sub">Creates your company + admin account.</p>
          <label>Full name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Work email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Company name<input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></label>
          <label>Password<input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error ? <div className="badge danger">{error}</div> : null}
          <button className="btn" disabled={loading} type="submit">{loading ? 'Creating…' : 'Create workspace'}</button>
          <p className="sub">Already have an account? <Link to="/login">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
