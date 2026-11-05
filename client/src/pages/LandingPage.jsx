import React, { useState } from 'react';
import { Sparkles, ArrowRight, Building2, Users, GraduationCap, ShieldCheck, Play, CheckCircle2, Target, Bot, BarChart3, X } from 'lucide-react';

export default function LandingPage({ onGetStarted, onSelectPortal, onOpenLogin }) {
  const [activeNav, setActiveNav] = useState('home');
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  const scrollToSection = (sectionId) => {
    setActiveNav(sectionId);
    if (sectionId === 'portals' || sectionId === 'features') {
      if (onGetStarted) onGetStarted();
      else if (onSelectPortal) onSelectPortal();
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePortalClick = (role) => {
    if (onSelectPortal) onSelectPortal(role);
    else if (onGetStarted) onGetStarted();
    else if (onOpenLogin) onOpenLogin(role);
  };

  const logos = [
    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
    { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
    { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
    { name: 'TCS', logo: '/tcs-logo.webp' },
    { name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg' },
    { name: 'Accenture', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg' },
    { name: 'Deloitte', logo: '/deloitte-logo.png' },
    { name: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.png' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', color: '#0F172A', overflowX: 'hidden' }}>
      {/* Top Navbar matching s img1 */}
      <nav style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 50
      }}>
        {/* Brand Logo - CareerSync */}
        <div 
          onClick={() => scrollToSection('hero')} 
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <img 
            src="/career-sync-logo.png" 
            alt="CareerSync" 
            style={{ height: '46px', width: 'auto', objectFit: 'contain', display: 'block' }} 
          />
        </div>

        {/* Navigation Items (Only Home, About, Features) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', gap: '28px', fontSize: '0.875rem', fontWeight: 600 }}>
            <span 
              onClick={() => scrollToSection('hero')}
              style={{ 
                color: activeNav === 'hero' || activeNav === 'home' ? '#4F46E5' : '#475569', 
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                borderBottom: activeNav === 'hero' || activeNav === 'home' ? '2px solid #4F46E5' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              Home
            </span>
            <span 
              onClick={() => {
                setActiveNav('about');
                if (onGetStarted) onGetStarted();
              }}
              style={{ 
                color: activeNav === 'about' ? '#4F46E5' : '#475569', 
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                borderBottom: activeNav === 'about' ? '2px solid #4F46E5' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              About
            </span>
            <span 
              onClick={() => {
                setActiveNav('features');
                if (onGetStarted) onGetStarted();
              }}
              style={{ 
                color: activeNav === 'portals' || activeNav === 'features' ? '#4F46E5' : '#475569', 
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                borderBottom: activeNav === 'portals' || activeNav === 'features' ? '2px solid #4F46E5' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              Features
            </span>
          </div>

          <button
            onClick={() => {
              if (onGetStarted) onGetStarted();
              else if (onSelectPortal) onSelectPortal();
            }}
            className="btn btn-primary"
            style={{ borderRadius: '999px', padding: '10px 22px' }}
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section matching s img1 */}
      <section id="hero" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 24px 64px',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gap: '48px',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '0.78125rem', fontWeight: 700, marginBottom: '20px' }}>
            <span style={{ backgroundColor: '#4F46E5', color: 'white', padding: '2px 8px', borderRadius: '999px', fontSize: '0.6875rem' }}>Agent 50</span>
            <span>Job Matching Agent</span>
          </div>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '20px' }}>
            Smarter Matches.<br />
            <span style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Brighter Futures.
            </span>
          </h1>

          <p style={{ fontSize: '1.125rem', color: '#64748B', lineHeight: 1.6, marginBottom: '32px', maxWidth: '520px' }}>
            An AI-powered placement intelligence platform that connects students, companies and institutions — based on skills, interests and real outcomes.
          </p>

          {/* CTAs matching s img1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
            <button
              onClick={() => {
                if (onGetStarted) onGetStarted();
                else if (onSelectPortal) onSelectPortal();
              }}
              className="btn btn-primary btn-lg"
              style={{ borderRadius: '999px' }}
            >
              <span>Get Started</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => setShowOverviewModal(true)}
              className="btn btn-outline btn-lg"
              style={{ borderRadius: '999px' }}
            >
              <Play size={16} fill="#4F46E5" color="#4F46E5" />
              <span>Watch Overview</span>
            </button>
          </div>

          {/* Stat Pillars */}
          <div style={{ display: 'flex', gap: '32px', borderTop: '1px solid #F1F5F9', paddingTop: '24px' }}>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0F172A' }}>10K+</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Students Empowered</div>
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0F172A' }}>200+</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Company Opportunities</div>
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0F172A' }}>95%</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Match Accuracy (Pilot)</div>
            </div>
          </div>
        </div>

        {/* Hero Ecosystem Central Glowing Orb with Connected Nodes */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '460px',
            height: '420px',
            position: 'relative',
            background: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.12) 0%, rgba(255,255,255,0) 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Center Glowing Sphere */}
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #6366F1, #4338CA, #1E1B4B)',
              boxShadow: '0 20px 40px rgba(79, 70, 229, 0.4), inset 0 2px 6px rgba(255,255,255,0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              textAlign: 'center',
              zIndex: 10,
              padding: '12px'
            }}>
              <Sparkles size={24} style={{ marginBottom: '4px' }} />
              <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>CareerSync</div>
              <div style={{ fontSize: '0.625rem', color: '#C7D2FE', marginTop: '2px' }}>Skills → Opportunities → Better Outcomes</div>
            </div>

            {/* Satellite 1: Students */}
            <div 
              onClick={() => handlePortalClick('STUDENT')}
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                <GraduationCap size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>Students</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Skills • Interests • Projects</div>
              </div>
            </div>

            {/* Satellite 2: Companies */}
            <div 
              onClick={() => handlePortalClick('T_AND_P')}
              style={{
                position: 'absolute',
                top: '30px',
                right: '10px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>Companies</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>JD • Eligibility • Talent</div>
              </div>
            </div>

            {/* Satellite 3: Institutions */}
            <div 
              onClick={() => handlePortalClick('HOD')}
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '40px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>Institutions</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>T&P Cell • HODs • Analytics</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Leading Companies matching s img1 bottom */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>
          Trusted by leading companies for campus placements
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', opacity: 0.85 }}>
          {logos.map((l, i) => (
            <img key={i} src={l.logo} alt={l.name} style={{ height: '26px', objectFit: 'contain' }} />
          ))}
        </div>
      </section>

      {/* Interactive Product Overview Modal */}
      {showOverviewModal && (
        <div className="modal-overlay" onClick={() => setShowOverviewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A' }}>CareerSync & Agent 50 Overview</h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>How intelligent multi-factor matching transforms campus recruitment</p>
                </div>
              </div>
              <button onClick={() => setShowOverviewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            {/* 4 Feature Highlights Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '18px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={16} />
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Agent 50 Matching Engine</h4>
                </div>
                <p style={{ fontSize: '0.78125rem', color: '#64748B', lineHeight: 1.5 }}>
                  Calculates 5-factor deterministic matching: Skills, Project Relevance, Role Fit, Location Preference, and Placement Readiness.
                </p>
              </div>

              <div style={{ padding: '18px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} />
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>SantraAI Assistant</h4>
                </div>
                <p style={{ fontSize: '0.78125rem', color: '#64748B', lineHeight: 1.5 }}>
                  Role-grounded placement AI for students, T&P officers, and HODs to analyze skill gaps, candidate readiness, and schedules.
                </p>
              </div>

              <div style={{ padding: '18px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} />
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>AI JD Structuring</h4>
                </div>
                <p style={{ fontSize: '0.78125rem', color: '#64748B', lineHeight: 1.5 }}>
                  Paste raw company emails or JDs and AI extracts company name, role, salary, branches, and required technical skills instantly.
                </p>
              </div>

              <div style={{ padding: '18px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={16} />
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Placement & HOD Analytics</h4>
                </div>
                <p style={{ fontSize: '0.78125rem', color: '#64748B', lineHeight: 1.5 }}>
                  Real-time visibility into department placement rates, student readiness cohorts, and skill remediation pathways.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
              <button onClick={() => setShowOverviewModal(false)} className="btn btn-outline">
                Close
              </button>
              <button
                onClick={() => {
                  setShowOverviewModal(false);
                  if (onGetStarted) onGetStarted();
                  else if (onSelectPortal) onSelectPortal();
                }}
                className="btn btn-primary"
              >
                <span>Choose Portal & Get Started</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
