import React, { useState } from 'react';
import { Sparkles, ArrowRight, Building2, Users, GraduationCap, ShieldCheck, Target, Briefcase, Award, ArrowLeft } from 'lucide-react';

export default function PortalsPage({ onSelectPortal, onBackToLanding, initialRole }) {
  const [selectedPortal, setSelectedPortal] = useState(initialRole || 'STUDENT');
  const [hoveredPortal, setHoveredPortal] = useState(null);

  const isStudentActive = (hoveredPortal === 'STUDENT') || (!hoveredPortal && selectedPortal === 'STUDENT');
  const isTPActive = (hoveredPortal === 'T_AND_P') || (!hoveredPortal && selectedPortal === 'T_AND_P');
  const isHODActive = (hoveredPortal === 'HOD') || (!hoveredPortal && selectedPortal === 'HOD');

  const handleCardClick = (role) => {
    setSelectedPortal(role);
  };
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', color: '#0F172A', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header matching s img2 */}
      <header style={{
        maxWidth: '1580px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div 
          onClick={onBackToLanding}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <img 
            src="/career-sync-logo.png" 
            alt="CareerSync" 
            style={{ height: '48px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>

        {/* Right side tag and Back link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>
            People &nbsp;|&nbsp; Potential &nbsp;|&nbsp; Progress
          </div>
          {onBackToLanding && (
            <button 
              onClick={onBackToLanding}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '999px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Choose Your Portal Container */}
      <main style={{ maxWidth: '1580px', width: '100%', margin: '0 auto', padding: '24px 36px 60px', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
            WELCOME TO CAREERSYNC
          </div>
          <h1 style={{ fontSize: '3.25rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '12px' }}>
            Choose Your <span style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Portal</span>
          </h1>
          <p style={{ fontSize: '1.0625rem', color: '#64748B', maxWidth: '640px', margin: '0 auto' }}>
            Different goals. A common mission. Smarter placements for a brighter future.
          </p>
        </div>

        {/* 3 Tall Vertical Portal Cards matching s img2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px', textAlign: 'left', marginBottom: '48px' }}>
          {/* 1. Student Portal Card */}
          <div 
            onClick={() => handleCardClick('STUDENT')}
            onMouseEnter={() => setHoveredPortal('STUDENT')}
            onMouseLeave={() => setHoveredPortal(null)}
            className="card portal-selection-card" 
            style={{
              padding: '32px 28px',
              borderRadius: '24px',
              backgroundColor: '#FFFFFF',
              boxShadow: isStudentActive 
                ? '0 18px 45px rgba(37, 99, 235, 0.18)' 
                : '0 10px 35px rgba(15, 23, 42, 0.05)',
              border: isStudentActive ? '2.5px solid #2563EB' : '1.5px solid #E2E8F0',
              transform: isStudentActive ? 'translateY(-6px)' : 'translateY(0)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                boxShadow: isStudentActive ? '0 6px 16px rgba(37, 99, 235, 0.25)' : '0 4px 12px rgba(37, 99, 235, 0.15)',
                transition: 'all 0.2s ease'
              }}>
                <GraduationCap size={28} />
              </div>
              <div className="font-script" style={{ color: '#2563EB', fontSize: '1.25rem', lineHeight: 1.1, textAlign: 'right' }}>
                Your Future<br />Your Way
              </div>
            </div>

            <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              Student
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
              Discover opportunities that fit your skills, interests and aspirations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Target size={16} color="#2563EB" />
                <span>Personalized job matches</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Award size={16} color="#2563EB" />
                <span>Identify skill gaps</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Briefcase size={16} color="#2563EB" />
                <span>Track applications</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Star size={16} color="#2563EB" />
                <span>Be placement ready</span>
              </div>
            </div>

            {/* Student Cutout Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <img 
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150" 
                alt="Student" 
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563EB' }} 
              />
              <div>
                <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A' }}>Subbu K</div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B' }}>1RV23CS184 • Computer Science</div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPortal('STUDENT');
                if (onSelectPortal) onSelectPortal('STUDENT');
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)', borderRadius: '12px', fontSize: '0.9375rem', fontWeight: 700 }}
            >
              <span>Continue as Student</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* 2. T&P Cell Portal Card */}
          <div 
            onClick={() => handleCardClick('T_AND_P')}
            onMouseEnter={() => setHoveredPortal('T_AND_P')}
            onMouseLeave={() => setHoveredPortal(null)}
            className="card portal-selection-card" 
            style={{
              padding: '32px 28px',
              borderRadius: '24px',
              backgroundColor: '#FFFFFF',
              boxShadow: isTPActive 
                ? '0 18px 45px rgba(124, 58, 237, 0.18)' 
                : '0 10px 35px rgba(15, 23, 42, 0.05)',
              border: isTPActive ? '2.5px solid #7C3AED' : '1.5px solid #E2E8F0',
              transform: isTPActive ? 'translateY(-6px)' : 'translateY(0)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7C3AED',
                boxShadow: isTPActive ? '0 6px 16px rgba(124, 58, 237, 0.25)' : '0 4px 12px rgba(124, 58, 237, 0.15)',
                transition: 'all 0.2s ease'
              }}>
                <Building2 size={28} />
              </div>
              <div className="font-script" style={{ color: '#7C3AED', fontSize: '1.25rem', lineHeight: 1.1, textAlign: 'right' }}>
                Right Talent<br />Faster
              </div>
            </div>

            <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              Training & Placement Cell
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
              Manage opportunities, find the right candidates, and drive better outcomes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Briefcase size={16} color="#7C3AED" />
                <span>Add company opportunities</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Users size={16} color="#7C3AED" />
                <span>Get ranked candidate shortlists</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Award size={16} color="#7C3AED" />
                <span>Track placement progress</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Sparkles size={16} color="#7C3AED" />
                <span>Use data to improve outcomes</span>
              </div>
            </div>

            {/* T&P Officer Cutout Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150" 
                alt="T&P Officer" 
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #7C3AED' }} 
              />
              <div>
                <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A' }}>Aarav Sharma</div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B' }}>TP-OFFICER-01 • Placement Head</div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPortal('T_AND_P');
                if (onSelectPortal) onSelectPortal('T_AND_P');
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)', borderRadius: '12px', fontSize: '0.9375rem', fontWeight: 700 }}
            >
              <span>Continue as T&P Cell</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* 3. Head of Department Portal Card */}
          <div 
            onClick={() => handleCardClick('HOD')}
            onMouseEnter={() => setHoveredPortal('HOD')}
            onMouseLeave={() => setHoveredPortal(null)}
            className="card portal-selection-card" 
            style={{
              padding: '32px 28px',
              borderRadius: '24px',
              backgroundColor: '#FFFFFF',
              boxShadow: isHODActive 
                ? '0 18px 45px rgba(5, 150, 105, 0.18)' 
                : '0 10px 35px rgba(15, 23, 42, 0.05)',
              border: isHODActive ? '2.5px solid #059669' : '1.5px solid #E2E8F0',
              transform: isHODActive ? 'translateY(-6px)' : 'translateY(0)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                boxShadow: isHODActive ? '0 6px 16px rgba(5, 150, 105, 0.25)' : '0 4px 12px rgba(5, 150, 105, 0.15)',
                transition: 'all 0.2s ease'
              }}>
                <Users size={28} />
              </div>
              <div className="font-script" style={{ color: '#059669', fontSize: '1.25rem', lineHeight: 1.1, textAlign: 'right' }}>
                Stronger Students<br />Stronger Depts
              </div>
            </div>

            <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              Head of Department
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
              Understand your department's readiness, identify skill gaps, and make data-driven decisions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Award size={16} color="#059669" />
                <span>Department insights</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Sparkles size={16} color="#059669" />
                <span>Skill landscape</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <Target size={16} color="#059669" />
                <span>Students needing attention</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84375rem', color: '#334155' }}>
                <ShieldCheck size={16} color="#059669" />
                <span>Plan academic interventions</span>
              </div>
            </div>

            {/* HOD Cutout Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150" 
                alt="HOD" 
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #059669' }} 
              />
              <div>
                <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A' }}>Dr. Rajesh Kumar</div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B' }}>HOD-CSE-01 • Head of CSE Dept</div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPortal('HOD');
                if (onSelectPortal) onSelectPortal('HOD');
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', borderRadius: '12px', fontSize: '0.9375rem', fontWeight: 700 }}
            >
              <span>Continue as HOD</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Bottom Ecosystem Banner matching s img2 */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '20px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '48px'
        }}>
          <div className="font-script" style={{ color: '#818CF8', fontSize: '1.125rem' }}>
            From Campus to Career
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '36px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>10K+</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Students Empowered</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>200+</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Company Opportunities</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>95%</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Match Accuracy (Pilot)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Better</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Placement Outcomes</div>
              </div>
            </div>
          </div>

          <div className="font-script" style={{ color: '#818CF8', fontSize: '1.125rem' }}>
            People Potential Progress
          </div>
        </div>

        {/* Creator Attribution */}
        <div style={{
          textAlign: 'center',
          padding: '16px 0 8px',
          color: '#64748B',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <span>Crafted with</span>
          <span style={{ color: '#EF4444', fontSize: '1rem' }}>❤️</span>
          <span>by</span>
          <span style={{ fontWeight: 800, color: '#4F46E5', letterSpacing: '0.05em' }}>KOWSIK</span>
        </div>
      </main>
    </div>
  );
}

function Star(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke={props.color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  );
}
