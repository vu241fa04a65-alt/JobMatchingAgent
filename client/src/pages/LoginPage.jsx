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
  TrendingUp,
  Star,
  ChevronRight
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
      setError('Please enter your URN or student email.');
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
      setError(err.message || 'Authentication failed. Please check your credentials.');
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
      label: 'URN / Student Email',
      placeholder: '1RV23CS184',
      sampleId: '1RV23CS184 (Subbu K) or 1RV23CS1815 (Siri C)',
      portalTitle: 'Student / Center Portal',
      bannerTag: 'STUDENT PORTAL',
      bannerTitle: 'Student Login',
      desc: 'Access your personalized dashboard, find matching and acquire insights.',
      icon: GraduationCap,
      iconBg: '#312E81'
    },
    T_AND_P: {
      label: 'Employee ID / Official Email',
      placeholder: 'TP-OFFICER-01',
      sampleId: 'TP-OFFICER-01 (Aarav Sharma)',
      portalTitle: 'T&P / Placement Portal',
      bannerTag: 'TRAINING & PLACEMENT',
      bannerTitle: 'T&P Officer Login',
      desc: 'Access your placement drives, candidate rankings, and corporate relationships.',
      icon: Building2,
      iconBg: '#4C1D95'
    },
    HOD: {
      label: 'Faculty ID / Official Email',
      placeholder: 'HOD-CSE-01',
      sampleId: 'HOD-CSE-01 (Dr. Rajesh Kumar)',
      portalTitle: 'Department / HOD Portal',
      bannerTag: 'DEPARTMENT INTELLIGENCE',
      bannerTitle: 'HOD Login',
      desc: 'Access departmental placement insights, student readiness, and curriculum analytics.',
      icon: Shield,
      iconBg: '#064E3B'
    }
  };

  const currentRole = roleConfig[selectedRole] || roleConfig.STUDENT;
  const RoleIcon = currentRole.icon;

  return (
    <div className="campus-login-viewport">
      {/* Background Dark Overlay for crisp contrast */}
      <div className="campus-login-overlay" />

      {/* Main Split Grid Area */}
      <main className="campus-login-content">
        {/* ==================================================================
            LEFT COLUMN: BRANDING, HEADLINE, FROSTED BADGES
            ================================================================== */}
        <section className="campus-brand-col">
          {/* Brand Logo */}
          <div 
            onClick={onBackToLanding} 
            className="campus-brand-logo-wrap"
            title="Return to CareerSync Home"
          >
            <img 
              src="/career-sync-logo.png" 
              alt="CareerSync" 
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>

          <div className="campus-brand-subtag">
            Empowered Departments. Stronger Futures.
          </div>

          {/* Hero Headline with Mint-Green "Opportunity" */}
          <h1 className="campus-hero-title">
            Your Next<br />
            <span className="opportunity-highlight-green">Opportunity</span><br />
            Starts Here.
          </h1>

          <p className="campus-hero-desc">
            AI-powered placement intelligence for students, training & placement cells, and academic departments.
          </p>

          {/* 3 Frosted Glass Badges */}
          <div className="campus-badges-row">
            <div className="campus-frosted-pill">
              <GraduationCap size={16} color="#FFFFFF" />
              <span>Smarter Matching</span>
            </div>
            <div className="campus-frosted-pill">
              <TrendingUp size={16} color="#86EFAC" />
              <span>Better Opportunities</span>
            </div>
            <div className="campus-frosted-pill">
              <Star size={16} color="#FBBF24" fill="#FBBF24" />
              <span>Brighter Future</span>
            </div>
          </div>
        </section>

        {/* ==================================================================
            RIGHT COLUMN: FROSTED GLASS LOGIN CARD
            ================================================================== */}
        <section className="campus-card-col">
          <div className="campus-glass-card">
            {/* Top Navigation */}
            <div className="glass-top-row">
              <button
                type="button"
                onClick={onBackToLanding}
                className="glass-back-link"
                title="Return to Portals"
              >
                <ArrowLeft size={15} />
                <span>Back to Portals</span>
              </button>

              <div className="glass-center-portal-pill">
                <GraduationCap size={14} color="#166534" />
                <span>{currentRole.portalTitle}</span>
              </div>
            </div>

            {/* Header */}
            <div className="glass-card-header">
              <h2 className="glass-card-title">Account Sign In</h2>
              <p className="glass-card-subtitle">{currentRole.desc}</p>
            </div>

            {/* Active Role Banner */}
            <div className="glass-role-container">
              <div className="glass-role-icon" style={{ backgroundColor: currentRole.iconBg }}>
                <RoleIcon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="glass-role-sub">{currentRole.bannerTag}</div>
                <div className="glass-role-main">{currentRole.bannerTitle}</div>
              </div>
              <ChevronRight size={18} color="#9CA3AF" />
            </div>

            {/* Error Alert */}
            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.8125rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }} role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* URN / Student Email */}
              <div className="glass-form-group">
                <label className="glass-field-label" htmlFor="login-identifier">
                  {currentRole.label}
                </label>
                <div className="glass-input-box">
                  <User size={16} className="glass-field-icon" />
                  <input
                    id="login-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={currentRole.placeholder}
                    className="glass-text-input"
                    disabled={loading}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="glass-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="glass-field-label" htmlFor="login-password" style={{ margin: 0 }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoverySubmitted(false);
                      setShowRecoveryModal(true);
                    }}
                    className="glass-forgot-btn"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="glass-input-box">
                  <Lock size={16} className="glass-field-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••••"
                    className="glass-text-input"
                    disabled={loading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="glass-pw-toggle"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Deep Forest Moss Green Button */}
              <button
                type="submit"
                disabled={loading}
                className="glass-green-signin-btn"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Predefined Authorized Account Format Banner */}
            <div className="glass-predefined-banner">
              <div className="glass-predefined-title">
                <Info size={14} color="#166534" />
                <span>Predefined Authorized Account Format:</span>
              </div>
              <div className="glass-predefined-text">
                • Identifier: <strong>{currentRole.sampleId}</strong>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ==================================================================
          BOTTOM FOOTER BAR
          ================================================================== */}
      <footer className="campus-bottom-bar">
        <div className="bottom-brand-tag">
          <img src="/career-sync-icon.png" alt="" style={{ height: '16px', opacity: 0.9 }} />
          <span>CareerSync</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>Bridging Students and Opportunities</span>
        </div>
        <div className="bottom-motto-tag">
          LEARN &nbsp;•&nbsp; GROW &nbsp;•&nbsp; SUCCEED
        </div>
      </footer>

      {/* ==================================================================
          INSTITUTIONAL PASSWORD RECOVERY MODAL
          ================================================================== */}
      {showRecoveryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
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
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
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
                  Institutional student credentials are managed by the campus Training & Placement directory. Enter your URN or student email to request assistance.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    URN or Campus Email
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
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading || !recoveryIdentifier.trim()}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#1E3A2F', borderColor: '#1E3A2F' }}
                  >
                    {recoveryLoading ? 'Routing Request...' : 'Send Guidance'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircle2 size={24} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Request Received
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, marginBottom: '16px' }}>
                  Instructions have been routed for <strong>{recoveryIdentifier}</strong> to your registered college email.
                </p>
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.75rem', color: '#64748B', textAlign: 'left', marginBottom: '16px' }}>
                  Need immediate help? Contact the T&P Cell Helpdesk at <strong>placement@rvce.edu.in</strong>.
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', borderRadius: '8px', padding: '10px', backgroundColor: '#1E3A2F', borderColor: '#1E3A2F' }}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
