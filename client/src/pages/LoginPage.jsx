import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
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
  Target, 
  Mail,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage({ initialRole = 'STUDENT', onLoginSuccess, onBackToLanding }) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(initialRole || 'STUDENT');
  
  // Security Hardening: Never prefill credentials on public login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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

  // Role metadata configurations
  const roleConfig = {
    STUDENT: {
      label: 'USN / Student Email',
      placeholder: 'Enter USN (e.g. 1RV23CS184) or email',
      color: '#4F46E5',
      accentBg: '#EEF2FF',
      portalTitle: 'Student Career Portal',
      bannerTag: 'Student Portal',
      bannerTitle: 'Student Login',
      desc: 'Access your personalized matches, skill roadmap and Agent 50 insights.',
      icon: GraduationCap
    },
    T_AND_P: {
      label: 'Employee ID / Official Email',
      placeholder: 'Enter Employee ID (e.g. TP-OFFICER-01) or email',
      color: '#7C3AED',
      accentBg: '#F5F3FF',
      portalTitle: 'Training & Placement Portal',
      bannerTag: 'Training & Placement Portal',
      bannerTitle: 'T&P Officer Login',
      desc: 'Manage drives, candidate ranking, unmatched cohorts, and placement operations.',
      icon: Building2
    },
    HOD: {
      label: 'Faculty ID / Official Email',
      placeholder: 'Enter Faculty ID (e.g. HOD-CSE-01) or email',
      color: '#059669',
      accentBg: '#ECFDF5',
      portalTitle: 'Department Intelligence Portal',
      bannerTag: 'Department Intelligence Portal',
      bannerTitle: 'HOD Login',
      desc: 'Read-only departmental placement statistics, readiness, and skill gaps.',
      icon: Shield
    }
  };

  const currentRole = roleConfig[selectedRole] || roleConfig.STUDENT;
  const RoleIcon = currentRole.icon;

  return (
    <div className="login-split-container">
      {/* ====================================================================
          LEFT BRANDING PANEL (Dark Navy, Value Props, Agent 50 Nexus Graphic)
          ==================================================================== */}
      <div className="login-branding-panel">
        <div className="branding-ambient-glow" />

        {/* 1. Top Logo */}
        <div className="branding-header">
          <div
            onClick={onBackToLanding}
            className="branding-logo-wrapper"
            title="Return to CareerSync Portals"
          >
            <img 
              src="/career-sync-logo.png" 
              alt="CareerSync" 
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>
        </div>

        {/* 2. Headline & Value Hierarchy */}
        <div className="branding-content-block">
          <div className="branding-script-label">
            Empowered Departments. Stronger Futures.
          </div>
          <h1 className="branding-headline">
            Your Next Opportunity<br />
            <span className="branding-headline-highlight">Starts Here.</span>
          </h1>
          <p className="branding-subtext">
            AI-powered placement intelligence for students, training & placement cells, and academic departments.
          </p>

          {/* Value Badges */}
          <div className="branding-badges-row">
            <div className="branding-badge-pill">
              <Sparkles size={16} color="#818CF8" />
              <span className="branding-badge-text">Smarter Matching</span>
            </div>
            <div className="branding-badge-pill">
              <Building2 size={16} color="#34D399" />
              <span className="branding-badge-text">Better Opportunities</span>
            </div>
            <div className="branding-badge-pill">
              <GraduationCap size={16} color="#FBBF24" />
              <span className="branding-badge-text">Brighter Futures</span>
            </div>
          </div>
        </div>

        {/* 3. Sophisticated Agent 50 AI Matching Illustration */}
        <div className="matching-nexus-card">
          <div className="nexus-header">
            <div className="nexus-title-chip">
              <Target size={14} color="#818CF8" />
              <span>Agent 50 Matching Nexus</span>
            </div>
            <div className="nexus-status-indicator">
              <span className="nexus-pulse-dot" />
              <span>Active Engine</span>
            </div>
          </div>

          <div className="nexus-flow-grid">
            {/* Student Skills Column */}
            <div className="nexus-column">
              <div className="nexus-node-pill" title="Candidate Skill Signal">
                <span className="nexus-node-label">DSA & Algorithms</span>
                <span className="nexus-node-metric">96%</span>
              </div>
              <div className="nexus-node-pill" title="Candidate Skill Signal">
                <span className="nexus-node-label">React & Node.js</span>
                <span className="nexus-node-metric">94%</span>
              </div>
              <div className="nexus-node-pill" title="Candidate Skill Signal">
                <span className="nexus-node-label">System Architecture</span>
                <span className="nexus-node-metric">91%</span>
              </div>
            </div>

            {/* Center Nexus Engine */}
            <div className="nexus-center-core" title="Agent 50 Multi-Factor Deterministic Engine">
              <div className="nexus-core-icon">
                <Sparkles size={17} />
              </div>
              <div className="nexus-core-title">AGENT 50</div>
              <div className="nexus-core-subtitle">5-Factor Engine</div>
            </div>

            {/* Campus Opportunities Column */}
            <div className="nexus-column">
              <div className="nexus-role-pill" title="Target Role Match">
                <span className="nexus-node-label">Software Engineer</span>
                <span className="nexus-role-tag tag-eligible">Eligible</span>
              </div>
              <div className="nexus-role-pill" title="Target Role Match">
                <span className="nexus-node-label">Frontend SDE</span>
                <span className="nexus-role-tag tag-eligible">Top Match</span>
              </div>
              <div className="nexus-role-pill" title="Target Role Match">
                <span className="nexus-node-label">Cloud Specialist</span>
                <span className="nexus-role-tag tag-shortlist">Shortlist</span>
              </div>
            </div>
          </div>

          <div className="nexus-footer-strip">
            <span className="nexus-footer-caption">Deterministic skill-to-role scoring</span>
            <span className="nexus-footer-score">
              <CheckCircle2 size={13} color="#34D399" />
              95% Match Precision
            </span>
          </div>
        </div>

        {/* 4. Campus Footer Card */}
        <div className="branding-footer-card">
          <div>
            <div className="footer-college-name">RV COLLEGE OF ENGINEERING</div>
            <div className="footer-college-motto">"Academic Excellence Leads to Brighter Futures."</div>
          </div>
          <div className="footer-online-dot" title="Campus Placement Network Online" />
        </div>
      </div>

      {/* ====================================================================
          RIGHT COLUMN: LOGIN CARD
          ==================================================================== */}
      <div className="login-card-viewport">
        <div className="login-auth-card">
          {/* Top Bar: Back to Portals & Portal Indicator */}
          <div className="login-top-bar">
            <button
              type="button"
              onClick={onBackToLanding}
              className="login-back-btn"
              title="Return to choose your portal"
            >
              <ArrowLeft size={14} />
              <span>Back to Portals</span>
            </button>

            <div className="login-portal-chip">
              <span className="login-portal-chip-ai">AI</span>
              <span className="login-portal-chip-title">{currentRole.portalTitle}</span>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Account Sign In
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px', lineHeight: 1.5 }}>
              {currentRole.desc}
            </p>
          </div>

          {/* Active Portal Role Banner */}
          <div className="login-role-banner" style={{ backgroundColor: currentRole.accentBg, borderColor: `${currentRole.color}25` }}>
            <div className="login-role-iconbox" style={{ backgroundColor: currentRole.color }}>
              <RoleIcon size={22} />
            </div>
            <div>
              <div className="login-role-tag" style={{ color: currentRole.color }}>
                {currentRole.bannerTag}
              </div>
              <div className="login-role-title">
                {currentRole.bannerTitle}
              </div>
            </div>
          </div>

          {/* Error Alert Feedback */}
          {error && (
            <div className="login-error-alert" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit}>
            {/* Identifier Field */}
            <div className="login-form-group">
              <label className="login-form-label" htmlFor="user-identifier">
                {currentRole.label}
              </label>
              <div className="login-input-wrapper">
                <User size={16} className="login-input-icon" />
                <input
                  id="user-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={currentRole.placeholder}
                  className={`login-input-field ${error && !identifier.trim() ? 'input-error' : ''}`}
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="login-form-label" htmlFor="user-password" style={{ margin: 0 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRecoverySubmitted(false);
                    setShowRecoveryModal(true);
                  }}
                  className="login-forgot-link"
                >
                  Forgot password?
                </button>
              </div>
              <div className="login-input-wrapper">
                <Lock size={16} className="login-input-icon" />
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your password"
                  className={`login-input-field ${error && !password ? 'input-error' : ''}`}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button with Polished Loading Feedback */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary login-submit-btn"
              style={{
                backgroundColor: currentRole.color,
                background: selectedRole === 'T_AND_P' 
                  ? 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' 
                  : selectedRole === 'HOD' 
                  ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
                  : undefined
              }}
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
        </div>
      </div>

      {/* ====================================================================
          INSTITUTIONAL PASSWORD RECOVERY MODAL
          ==================================================================== */}
      {showRecoveryModal && (
        <div className="recovery-modal-overlay" onClick={() => setShowRecoveryModal(false)}>
          <div className="recovery-modal-card" onClick={(e) => e.stopPropagation()}>
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
                  Student and institutional credentials are authenticated against the RVCE Training & Placement active directory. Enter your USN or registered email to request credential assistance.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    USN or Campus Email
                  </label>
                  <div className="login-input-wrapper">
                    <Mail size={16} className="login-input-icon" />
                    <input
                      type="text"
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      placeholder="e.g. 1RV23CS184 or student@rvce.edu.in"
                      className="login-input-field"
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
                    style={{ padding: '8px 18px', borderRadius: '8px' }}
                  >
                    {recoveryLoading ? 'Routing Request...' : 'Send Guidance'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircle2 size={24} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Request Received
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, marginBottom: '16px' }}>
                  If an active account exists for <strong>{recoveryIdentifier}</strong>, password reset verification has been dispatched to your official campus email.
                </p>
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.75rem', color: '#64748B', textAlign: 'left', marginBottom: '16px' }}>
                  Need immediate help? Contact the T&P Cell Helpdesk at <strong>placement@rvce.edu.in</strong> or visit the Dean's Office (Placement Block).
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', borderRadius: '8px', padding: '10px' }}
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
