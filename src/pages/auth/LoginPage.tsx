// ============================================================
// HALAMAN : LoginPage
// PERAN   : semua
// ROUTE   : /login
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/index';
import './LoginPage.css';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states - Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const { login: authLogin, register: authRegister } = useAuth();
  const navigate = useNavigate();

  const getRedirectPathByRole = (role: Role) => {
    switch (role) {
      case 'kasir': return '/kasir/dashboard';
      case 'dapur': return '/dapur/antrian';
      case 'manajer': return '/manajer/dashboard';
      default: return '/pelanggan/home';
    }
  };

  const handleTabChange = (newTab: 'login' | 'signup') => {
    setError('');
    setTab(newTab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const role = await authLogin(loginEmail.trim(), loginPassword);
      navigate(getRedirectPathByRole(role), { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authRegister(regName.trim(), regEmail.trim(), regPassword, 'pelanggan');
      navigate('/pelanggan/home', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav className="auth-navbar">
        <span className="auth-navbar-logo">EtaCafe</span>
      </nav>
      <div className="auth-nav-divider"></div>

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <main className="auth-main-content">
        {/* Background hero photo (Full cover tanpa terpotong) */}
        <div className="auth-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80"
            alt="Coffee shop background"
          />
          <div className="auth-hero-overlay" />
        </div>

        {/* Floating auth card */}
        <div className="auth-card">
          {/* Tabs: Login / Sign Up */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => handleTabChange('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Error message */}
          {error && <div className="auth-error">{error}</div>}

          {/* ─── LOGIN FORM ─── */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="login-email">
                  Username or email
                </label>
                <input
                  className="auth-input"
                  type="text"
                  id="login-email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder=""
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="login-password">
                  Password
                </label>
                <div className="auth-input-row">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="login-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder=""
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-eye"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="auth-forgot">Forgot password?</div>

              <button className="btn-auth" type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>
          )}

          {/* ─── REGISTER FORM ─── */}
          {tab === 'signup' && (
            <form onSubmit={handleRegisterSubmit}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="reg-name">
                  Full Name
                </label>
                <input
                  className="auth-input"
                  type="text"
                  id="reg-name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="reg-email">
                  Email or Phone
                </label>
                <input
                  className="auth-input"
                  type="text"
                  id="reg-email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="reg-password">
                  Password
                </label>
                <div className="auth-input-row">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    id="reg-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="toggle-eye"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button className="btn-auth" type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Sign Up'}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="auth-footer">
        <div className="auth-footer-copy">
          @ 2026 EtaCafe. All Rights Reserved
        </div>
      </footer>
    </div>
  );
}
