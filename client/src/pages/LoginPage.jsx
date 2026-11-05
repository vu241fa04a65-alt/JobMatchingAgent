import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  X, 
  KeyRound, 
  Mail,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const defaultCredentials = {
  STUDENT: { id: '1RV23CS184', pass: 'Student@123' },
  T_AND_P: { id: 'TP-OFFICER-01', pass: 'TPCell@123' },
  HOD: { id: 'HOD-CSE-01', pass: 'HOD@123' }
};

export default function LoginPage({ initialRole = 'STUDENT', onLoginSuccess, onBackToLanding }) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(initialRole || 'STUDENT');
  
  // Predefined authorized credentials populated for instant authorized access
  const initialCreds = defaultCredentials[initialRole] || defaultCredentials.STUDENT;
  const [identifier, setIdentifier] = useState(initialCreds.id);
  const [password, setPassword] = useState(initialCreds.pass);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Institutional Password Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoverySubmitted, setRecoverySubmitted] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
      const creds = defaultCredentials[initialRole] || defaultCredentials.STUDENT;
      setIdentifier(creds.id);
      setPassword(creds.pass);
    }
    setError('');
  }, [initialRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your USN or registered campus email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(identifier.trim(), password, selectedRole);
      if (selectedRole === 'STUDENT') {
        onLoginSuccess('student-dashboard');
      } else {
        onLoginSuccess('tp-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials or contact T&P administration.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) return;
    setRecoveryLoading(true);
    setTimeout(() => {
      setRecoveryLoading(false);
      setRecoverySubmitted(true);
    }, 600);
  };

  return (
    <div className="login-page-root">
      <div className="container">
        {/* ====================================================================
            LEFT BRANDING PANEL
            ==================================================================== */}
        <section className="left">
          <div className="left-content">
            <div 
              className="logo" 
              onClick={onBackToLanding} 
              title="Return to CareerSync Home"
            >
              <div className="logo-icon">C</div>
              <div className="logo-name">
                Career<span>Sync</span>
              </div>
            </div>

            <div className="tagline">
              Empowered Departments. Stronger Futures.
            </div>

            <h1 className="hero-title">
              Your Next Opportunity
              <span>Starts Here.</span>
            </h1>

            <p className="hero-description">
              AI-powered placement intelligence for students,
              training & placement cells, and academic departments.
            </p>

            <div className="illustration">
              <img
                src="/student-grad-clean.png"
                alt="Graduation illustration"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        </section>

        {/* ====================================================================
            RIGHT LOGIN PANEL
            ==================================================================== */}
        <section className="right">
          <div className="login-card">
            <div className="card-top">
              <button 
                type="button" 
                className="back" 
                onClick={onBackToLanding}
                title="Return to Portals"
              >
                ← &nbsp; Back to Portals
              </button>

              <div className="portal-badge">
                👥 Student Career Portal
              </div>
            </div>

            <div className="login-heading">
              <h1>Account Sign In</h1>
              <p>
                Access your personalized matches, skill roadmap
                and Agent 50 insights.
              </p>
            </div>

            <div className="student-box">
              <div className="student-icon">🎓</div>

              <div className="student-info">
                <small>STUDENT PORTAL</small>
                <strong>Student Login</strong>
              </div>

              <div className="student-arrow">→</div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                padding: '11px 16px',
                borderRadius: '16px',
                fontSize: '0.85rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }} role="alert">
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} id="loginForm">
              <div className="form-group">
                <div className="form-label">
                  <label htmlFor="usn">USN / Student Email</label>
                </div>

                <div className="input-box">
                  <span className="icon">✉</span>
                  <input
                    type="text"
                    id="usn"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your USN or email"
                    disabled={loading}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label">
                  <label htmlFor="password">Password</label>
                  <button 
                    type="button" 
                    className="forgot"
                    onClick={() => {
                      setRecoverySubmitted(false);
                      setShowRecoveryModal(true);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="input-box">
                  <span className="icon">🔒</span>

                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "◎" : "◉"}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="signin" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In &nbsp; →</span>
                )}
              </button>
            </form>

            <div className="account-info">
              <strong>ⓘ &nbsp; Predefined Authorized Account Format:</strong>
              <br />
              • Identifier: 1RV23CS184 (Subbu K) or 1RV22S015 (Siri C)
            </div>
          </div>
        </section>

        {/* ====================================================================
            AURORA DIVIDER
            ==================================================================== */}
        <div className="aurora" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* ====================================================================
          INSTITUTIONAL PASSWORD RECOVERY MODAL
          ==================================================================== */}
      {showRecoveryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(16, 23, 71, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }} onClick={() => setShowRecoveryModal(false)}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '26px',
            padding: '30px',
            boxShadow: '0 25px 60px rgba(16, 23, 71, 0.25)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#eeebff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5831e9' }}>
                  <KeyRound size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#101747', margin: 0 }}>
                  Password Assistance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8191c0', padding: '4px' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {!recoverySubmitted ? (
              <form onSubmit={handleRecoverySubmit}>
                <p style={{ fontSize: '0.85rem', color: '#46588d', lineHeight: 1.6, marginBottom: '18px' }}>
                  Student account credentials are managed through the RVCE Training & Placement active directory. Enter your USN or student email to receive assistance.
                </p>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#101747', marginBottom: '6px' }}>
                    USN or Student Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8191c0' }} />
                    <input
                      type="text"
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      placeholder="e.g. 1RV23CS184 or student@rvce.edu.in"
                      style={{
                        width: '100%',
                        height: '48px',
                        paddingLeft: '42px',
                        paddingRight: '14px',
                        borderRadius: '14px',
                        border: '1.5px solid #dfe2f7',
                        outline: 'none',
                        fontSize: '0.875rem'
                      }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: '1px solid #dfe2f7',
                      background: '#FFFFFF',
                      color: '#46588d',
                      fontWeight: 650,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(100deg, #8138e9, #405ef4)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      'Request Reset Link'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#101747', marginBottom: '8px' }}>
                  Instructions Dispatched
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#46588d', lineHeight: 1.6, marginBottom: '20px' }}>
                  If <strong>{recoveryIdentifier}</strong> is registered in the institutional directory, verification guidance has been forwarded to your registered contact.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  style={{
                    padding: '10px 26px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(100deg, #8138e9, #405ef4)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
