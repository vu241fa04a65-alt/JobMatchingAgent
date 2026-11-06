import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Calendar,
  ChevronRight,
  BookOpen,
  Award,
  ArrowRight,
  Eye
} from 'lucide-react';
import DonutChart from '../components/DonutChart';
import RadialGauge from '../components/RadialGauge';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/SyncContext';

export default function TPDashboard({ onNavigate, onSelectStudent }) {
  const { user } = useAuth();
  const { syncVersion } = useDataSync();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isHOD = user?.role === 'HOD';

  useEffect(() => {
    async function loadMetrics() {
      try {
        const token = localStorage.getItem('jobmatch_token');
        const res = await fetch('/api/institution/dashboard-metrics', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [syncVersion]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748B' }}>
        Loading institutional placement intelligence...
      </div>
    );
  }

  const metrics = data?.metrics || {
    total_students: 1248,
    active_learners: 892,
    placement_ready: 320,
    partner_companies: 85,
    overall_readiness_percentage: 68
  };

  const logos = [
    { name: 'Google', logo: '/logos/google.svg' },
    { name: 'Microsoft', logo: '/logos/microsoft.svg' },
    { name: 'Amazon', logo: '/logos/amazon.svg' },
    { name: 'Infosys', logo: '/logos/infosys.svg' },
    { name: 'TCS', logo: '/logos/tcs.svg' },
    { name: 'Adobe', logo: '/logos/adobe.svg' },
    { name: 'Deloitte', logo: '/logos/deloitte.svg' },
    { name: 'Cisco', logo: '/logos/cisco.svg' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner (Page 10 Top) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Welcome, RV College of Engineering!
            </h1>
            {isHOD && (
              <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={12} />
                <span>HOD View (Read-Only)</span>
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Track student progress, enhance employability, and build stronger industry connections.
          </p>
        </div>

        <div className="font-script" style={{ color: '#4F46E5', fontSize: '1.25rem', textAlign: 'right' }}>
          "Skilled Students. Stronger Tomorrow."
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{metrics.total_students.toLocaleString()}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Total Students</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>↑ 12% this semester</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{metrics.active_learners.toLocaleString()}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Active Learners</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>↑ 18% this month</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{metrics.placement_ready.toLocaleString()}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Placement Ready</div>
            <div style={{ fontSize: '0.6875rem', color: '#8B5CF6', fontWeight: 600 }}>↑ 25% improvement</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{metrics.partner_companies}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Partner Companies</div>
            <div style={{ fontSize: '0.6875rem', color: '#3B82F6', fontWeight: 600 }}>↑ 10 new this year</div>
          </div>
        </div>
      </div>

      {/* Row 1: Student Progress Trend, Skill Readiness Donut, Placement Readiness Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px' }}>
        {/* Student Progress Overview (Line Chart simulation) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Student Progress Overview</h3>
              <p style={{ fontSize: '0.71875rem', color: '#64748B' }}>Learners and placement readiness trajectory</p>
            </div>
            <span style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 600 }}>Last 6 Months</span>
          </div>

          <div style={{ height: '160px', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '10px 0' }}>
            {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((m, i) => {
              const h1 = [40, 52, 60, 72, 85, 95][i];
              const h2 = [25, 35, 48, 58, 70, 82][i];
              const h3 = [15, 20, 28, 38, 48, 55][i];

              return (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: '100%', justifyContent: 'center' }}>
                    <div style={{ width: '8px', height: `${h1}%`, backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ width: '8px', height: `${h2}%`, backgroundColor: '#8B5CF6', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ width: '8px', height: `${h3}%`, backgroundColor: '#10B981', borderRadius: '4px 4px 0 0' }} />
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '6px' }}>{m}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.6875rem', marginTop: '8px', color: '#475569' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} /> Active Learners</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} /> Skills Completed</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} /> Placement Ready</span>
          </div>
        </div>

        {/* Skill Readiness Distribution */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Skill Readiness</h3>
            <span style={{ fontSize: '0.71875rem', color: '#4F46E5', fontWeight: 700 }}>Distribution</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
            <DonutChart
              size={120}
              strokeWidth={12}
              totalCount={1248}
              totalLabel="Students"
              showLegend={true}
              data={[
                { label: 'Advanced (22%)', count: 275, color: '#10B981' },
                { label: 'Intermediate (48%)', count: 599, color: '#3B82F6' },
                { label: 'Beginner (24%)', count: 299, color: '#8B5CF6' },
                { label: 'Not Started (6%)', count: 75, color: '#CBD5E1' }
              ]}
            />
          </div>
        </div>

        {/* Placement Readiness Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Placement Readiness</h3>
            <button
              onClick={() => onNavigate('tp-students')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.71875rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
            <DonutChart
              size={120}
              strokeWidth={12}
              totalCount={1248}
              totalLabel="68% Ready"
              showLegend={true}
              data={[
                { label: '320 Ready', count: 320, color: '#10B981' },
                { label: '430 In Prep', count: 430, color: '#3B82F6' },
                { label: '310 Needs Attention', count: 310, color: '#F59E0B' },
                { label: '188 Not Started', count: 188, color: '#CBD5E1' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Recent Student Activity, Upcoming Events, Top Skills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Recent Student Activity */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Recent Student Activity</h3>
            <button
              onClick={() => onNavigate('tp-students')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.71875rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data?.recent_activity || []).map((act, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={act.avatar} alt={act.student_name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{act.student_name}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{act.activity}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Upcoming Events</h3>
            <span style={{ fontSize: '0.71875rem', color: '#4F46E5', fontWeight: 700 }}>Calendar</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
              <div style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '6px 10px', borderRadius: '8px', textAlign: 'center', fontWeight: 800, fontSize: '0.6875rem' }}>
                SEP<br />15
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Tech Career Guidance Session</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>10:00 AM • Auditorium</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
              <div style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', padding: '6px 10px', borderRadius: '8px', textAlign: 'center', fontWeight: 800, fontSize: '0.6875rem' }}>
                SEP<br />20
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Placement Preparation Workshop</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>2:00 PM • Seminar Hall</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
              <div style={{ backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '6px 10px', borderRadius: '8px', textAlign: 'center', fontWeight: 800, fontSize: '0.6875rem' }}>
                SEP<br />28
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Industry Interaction: Microsoft</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>11:00 AM • Main Block</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Skills Among RVCE Students */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '14px' }}>Top Skills Among Students</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data?.top_skills_among_students || [
              { skill: 'Data Structures & Algorithms', percentage: 78, color: '#3B82F6' },
              { skill: 'Web Development', percentage: 65, color: '#8B5CF6' },
              { skill: 'Cloud Computing (AWS)', percentage: 62, color: '#06B6D4' },
              { skill: 'System Design', percentage: 58, color: '#F59E0B' },
              { skill: 'Machine Learning', percentage: 52, color: '#A855F7' }
            ]).map((sk, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78125rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{sk.skill}</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{sk.percentage}%</span>
                </div>
                <div style={{ height: '5px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${sk.percentage}%`, height: '100%', backgroundColor: sk.color, borderRadius: '999px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Industry Collaborations Logos */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
          Industry Placement Partners & Collaborations
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          {logos.map((l, idx) => (
            <img key={idx} src={l.logo} alt={l.name} style={{ height: '24px', objectFit: 'contain', opacity: 0.85 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
