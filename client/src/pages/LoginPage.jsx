import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Building2, 
  Shield, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  X, 
  KeyRound, 
  Mail,
  ArrowLeft,
  Info,
  Users
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

  const handleRoleSelect = (newRole) => {
    setSelectedRole(newRole);
    const creds = defaultCredentials[newRole] || defaultCredentials.STUDENT;
    setIdentifier(creds.id);
    setPassword(creds.pass);
    setError('');
  };

  const cycleRole = () => {
    const order = ['STUDENT', 'T_AND_P', 'HOD'];
    const next = order[(order.indexOf(selectedRole) + 1) % order.length];
    handleRoleSelect(next);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam) {
      const normalized = roleParam.toUpperCase().replace('-', '_');
      if (normalized === 'TP' || normalized === 'T_AND_P' || normalized === 'T&P') {
        handleRoleSelect('T_AND_P');
        return;
      } else if (normalized === 'HOD') {
        handleRoleSelect('HOD');
        return;
      } else if (normalized === 'STUDENT') {
        handleRoleSelect('STUDENT');
        return;
      }
    }
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

  // Role metadata configurations matching the mockup design
  const roleConfig = {
    STUDENT: {
      label: 'USN / Student Email',
      placeholder: '1RV23CS184',
      sampleId: '1RV23CS184 (Subbu K) or 1RV22IS015 (Siri C)',
      cursiveTitle: 'Student',
      themeColor: '#0EA5E9',
      btnGradient: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #0284C7 100%)',
      btnShadow: '0 8px 24px rgba(14, 165, 233, 0.35)',
      desc: 'Access your personalized matches, skill roadmap and Agent 50 insights.',
      icon: GraduationCap
    },
    T_AND_P: {
      label: 'Employee ID / Official Email',
      placeholder: 'TP-OFFICER-01',
      sampleId: 'TP-OFFICER-01 (Aarav Sharma)',
      cursiveTitle: 'T&P Officer',
      themeColor: '#7C3AED',
      btnGradient: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #6D28D9 100%)',
      btnShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
      desc: 'Manage drives, candidate ranking, unmatched cohorts, and placement operations.',
      icon: Building2
    },
    HOD: {
      label: 'Faculty ID / Official Email',
      placeholder: 'HOD-CSE-01',
      sampleId: 'HOD-CSE-01 (Dr. Rajesh Kumar)',
      cursiveTitle: 'HOD',
      themeColor: '#059669',
      btnGradient: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #047857 100%)',
      btnShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
      desc: 'Read-only departmental placement statistics, readiness, and skill gaps.',
      icon: Shield
    }
  };

  const currentRole = roleConfig[selectedRole] || roleConfig.STUDENT;

  return (
    <div className="student-auth-viewport">
      {/* ====================================================================
          LEFT COLUMN: BRANDING, HEADLINE & SEAMLESS 3D BACKGROUND ARTWORK
          ==================================================================== */}
      <section className="student-auth-left">
        {/* Content Block */}
        <div className="student-left-content">
          {/* Original CareerSync Brand Logo */}
          <div 
            onClick={onBackToLanding} 
            className="student-brand-logo"
            title="Return to CareerSync Home"
          >
            <img 
              src="/career-sync-logo.png" 
              alt="CareerSync" 
              className="student-brand-img"
            />
          </div>

          <div className="student-brand-subtag">
            Empowered Departments. Stronger Futures.
          </div>

          {/* Hero Headline */}
          <h1 className="student-auth-headline">
            Your Next Opportunity<br />
            <span className="student-auth-headline-purple">Starts Here.</span>
          </h1>

          <p className="student-auth-desc">
            AI-powered placement intelligence for students, training & placement cells, and academic departments.
          </p>
        </div>

        {/* 3D Graduation Cap on Books & Campus Background Scene — Seamless without any extra box */}
        <div className="student-left-art-container">
          <img 
            src="/student-book-clean.png" 
            alt="CareerSync Student Placement Readiness" 
            className="student-grad-cap-img"
          />
        </div>
      </section>

      {/* ====================================================================
          ORGANIC S-CURVE WAVE DIVIDER — Seamless overshoot through top edge
          ==================================================================== */}
      <div className="student-organic-wave-divider" aria-hidden="true">
        <svg 
          className="student-wave-svg" 
          viewBox="0 0 1000 1000" 
          preserveAspectRatio="none"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layer 1: Ethereal Soft Pastel Periwinkle Wave */}
          <path 
            className="student-wave-path-back" 
            d="M505 -40 C 475 40, 405 160, 390 250 C 375 380, 445 510, 440 650 C 435 780, 380 890, 370 1000 L 360 1040 L 1000 1040 L 1000 -40 Z" 
          />
          {/* Layer 2: Delicate Lavender Veil */}
          <path 
            className="student-wave-path-mid" 
            d="M530 -40 C 500 40, 430 160, 415 250 C 400 380, 470 510, 465 650 C 460 780, 405 890, 395 1000 L 385 1040 L 1000 1040 L 1000 -40 Z" 
          />
          {/* Layer 3: Solid Right Section Backdrop */}
          <path 
            className="student-wave-path-front" 
            d="M555 -40 C 525 40, 455 160, 440 250 C 425 380, 495 510, 490 650 C 485 780, 430 890, 420 1000 L 410 1040 L 1000 1040 L 1000 -40 Z" 
          />
        </svg>
      </div>

      {/* ====================================================================
          RIGHT COLUMN: WHITE FLOATING STUDENT LOGIN CARD
          ==================================================================== */}
      <section className="student-auth-right">
        <div className="student-auth-card">
          {/* Card Top Navigation Row */}
          <div className="student-card-top-row">
            <button
              type="button"
              onClick={onBackToLanding}
              className="student-card-back-btn"
              title="Return to Portals"
            >
              <ArrowLeft size={16} />
              <span>Back to Portals</span>
            </button>

            <div 
              className="student-portal-cursive-badge"
              onClick={cycleRole}
              title="Click to switch portal (Student • T&P Officer • HOD)"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cycleRole(); }}
              style={{
                color: currentRole.themeColor
              }}
            >
              <span className="student-portal-cursive-text">{currentRole.cursiveTitle}</span>
            </div>
          </div>

          {/* Card Header */}
          <div className="student-card-header">
            <h2 className="student-card-title">Account Sign In</h2>
            <p className="student-card-sub">{currentRole.desc}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '12px 16px',
              borderRadius: '14px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }} role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* USN / Student Email */}
            <div className="student-form-group">
              <div className="student-form-label-row">
                <label className="student-form-label" htmlFor="student-identifier">
                  <Mail size={15} color={currentRole.themeColor} />
                  <span>{currentRole.label}</span>
                </label>
              </div>
              <div className="student-input-box">
                <User size={18} className="student-input-icon" />
                <input
                  id="student-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={currentRole.placeholder}
                  className="student-input-field"
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="student-form-group">
              <div className="student-form-label-row">
                <label className="student-form-label" htmlFor="student-password">
                  <Lock size={15} color={currentRole.themeColor} />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRecoverySubmitted(false);
                    setShowRecoveryModal(true);
                  }}
                  className="student-forgot-btn"
                  style={{ color: currentRole.themeColor }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="student-input-box">
                <Lock size={18} className="student-input-icon" />
                <input
                  id="student-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••••"
                  className="student-input-field"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="student-password-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Vibrant Purple/Indigo Gradient Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="student-signin-btn"
              style={{
                background: currentRole.btnGradient,
                boxShadow: currentRole.btnShadow
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ====================================================================
          INSTITUTIONAL PASSWORD RECOVERY MODAL
          ==================================================================== */}
      {showRecoveryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
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
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  <KeyRound size={18} />
                </div>
                <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Password Assistance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {!recoverySubmitted ? (
              <form onSubmit={handleRecoverySubmit}>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, marginBottom: '16px' }}>
                  Student account credentials are managed through the RVCE Training & Placement active directory. Enter your USN or student email to receive assistance.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    USN or Student Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      placeholder="e.g. 1RV23CS184 or student@rvce.edu.in"
                      className="form-input"
                      style={{ paddingLeft: '38px', borderRadius: '10px' }}
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
                      padding: '9px 16px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
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
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle2 size={26} />
                </div>
                <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  Instructions Dispatched
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
                  If <strong>{recoveryIdentifier}</strong> is registered in the institutional directory, verification guidance has been forwarded to your registered contact.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
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
