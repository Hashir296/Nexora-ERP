import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, login } from '../redux/authSlice';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { user, loading, error, requiresOtp, demoOtp } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: 'admin@nexora.local', password: 'Admin@123', otp: '' });

  if (user) return <Navigate to="/app" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      if (result.payload.requiresOtp) toast('Enter OTP to continue');
      else toast.success('Welcome back');
    } else toast.error(result.payload || 'Login failed');
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <p style={{ opacity: 0.8, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12 }}>Enterprise platform</p>
        <h1>Nexora ERP runs the business, not just the modules.</h1>
        <p>Core platform + plugins. Light, fast, and connected to your live MongoDB data — including an AI assistant that answers from real records.</p>
      </div>
      <div className="auth-panel">
        <form className="auth-card form" onSubmit={onSubmit}>
          <h2>Sign in</h2>
          <p className="sub">Use the seeded admin account or register a new company.</p>
          <label>
            Email
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required type="email" />
          </label>
          <label>
            Password
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required type="password" />
          </label>
          {requiresOtp ? (
            <label>
              OTP {demoOtp ? `(demo: ${demoOtp})` : ''}
              <input value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} />
            </label>
          ) : null}
          {error ? <div className="badge danger">{error}</div> : null}
          <button className="btn" disabled={loading} type="submit">{loading ? 'Signing in…' : 'Sign in'}</button>
          <p className="sub" style={{ marginTop: '0.75rem' }}>
            New company? <Link to="/register">Create workspace</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
