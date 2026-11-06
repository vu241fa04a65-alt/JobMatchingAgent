import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, ArrowRight, TrendingUp, Clock, CheckCircle2, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import RadialGauge from '../components/RadialGauge';
import DonutChart from '../components/DonutChart';
import RadarChart from '../components/RadarChart';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/SyncContext';

export default function StudentDashboard({ onNavigate, onSelectJob }) {
  const { user } = useAuth();
  const { syncVersion } = useDataSync();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem('jobmatch_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [matchesRes, profileRes] = await Promise.all([
          fetch('/api/matching/student-matches', { headers }),
          fetch('/api/students/profile', { headers })
        ]);

        const matchesData = await matchesRes.json();
        const profileData = await profileRes.json();

        setData({
          matches: matchesData,
          profile: profileData
        });
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [syncVersion]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748B' }}>
        Loading student placement intelligence...
      </div>
    );
  }

  const readinessScore = data?.profile?.readiness?.overall_readiness_score || 82;
  const counts = data?.matches?.counts || { total_opportunities: 18, high_fit: 6, good_fit: 8, emerging_fit: 4 };

  const now = new Date();
  const currentHours = now.getHours();
  const timeGreeting = currentHours < 12 ? 'Good morning' : currentHours < 17 ? 'Good afternoon' : 'Good evening';
  const displayDateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Greeting Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {timeGreeting}, {user?.full_name?.split(' ')[0] || 'Subbu'}! 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Here's your placement journey and Agent 50 career intelligence at a glance.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          padding: '8px 16px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <Calendar size={16} color="#4F46E5" />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#0F172A' }}>{displayDateStr}</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>Make progress today!</div>
          </div>
        </div>
      </div>

      {/* 4 Top Metric Cards (Page 3 Top) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        {/* Metric 1: Placement Readiness */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <RadialGauge value={readinessScore} size={76} strokeWidth={7} color="#10B981" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>Placement Readiness</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>Based on skills, projects & assessments</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <TrendingUp size={12} />
              <span>↑ 6% from last month</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Eligible Opportunities */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <DonutChart
            size={76}
            strokeWidth={8}
            totalCount={counts.total_opportunities || 18}
            totalLabel=""
            showLegend={false}
            data={[
              { count: counts.high_fit || 6, color: '#3B82F6' },
              { count: counts.good_fit || 8, color: '#8B5CF6' },
              { count: counts.emerging_fit || 4, color: '#CBD5E1' }
            ]}
          />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>Eligible Opportunities</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>Across 12 top companies</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.625rem', color: '#64748B', fontWeight: 600 }}>
              <span style={{ color: '#3B82F6' }}>• {counts.high_fit || 6} High Fit</span>
              <span style={{ color: '#8B5CF6' }}>• {counts.good_fit || 8} Good Fit</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Active Applications */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <DonutChart
            size={76}
            strokeWidth={8}
            totalCount={4}
            totalLabel=""
            showLegend={false}
            data={[
              { count: 2, color: '#F59E0B' },
              { count: 1, color: '#3B82F6' },
              { count: 1, color: '#10B981' }
            ]}
          />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>Active Applications</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>Track your interview pipeline</div>
            <div style={{ fontSize: '0.6875rem', color: '#3B82F6', fontWeight: 700, marginTop: '4px' }}>
              1 Interview Scheduled
            </div>
          </div>
        </div>

        {/* Metric 4: Profile Completeness */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <RadialGauge value={92} size={76} strokeWidth={7} color="#EC4899" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>Profile Completeness</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>Keep updated for best matches</div>
            <button
              onClick={() => onNavigate('student-profile')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', marginTop: '4px', padding: 0 }}
            >
              Update Profile →
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Opportunity Fit Donut, Top Skill Gaps, Radar Strengths */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '18px' }}>
        {/* Opportunity Fit Distribution */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Opportunity Fit Distribution</h3>
              <p style={{ fontSize: '0.71875rem', color: '#64748B' }}>A breakdown of your 18 eligible openings</p>
            </div>
            <button
              onClick={() => onNavigate('student-matches')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <DonutChart
              size={130}
              strokeWidth={14}
              totalCount={18}
              totalLabel="Opportunities"
              showLegend={true}
              data={[
                { count: 6, label: 'High Fit (80–100%)', color: '#3B82F6' },
                { count: 8, label: 'Good Fit (60–80%)', color: '#8B5CF6' },
                { count: 4, label: 'Emerging Fit (40–60%)', color: '#CBD5E1' }
              ]}
            />
          </div>
        </div>

        {/* Top Skill Gaps (With Company Badges) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Top Skill Gaps</h3>
              <p style={{ fontSize: '0.71875rem', color: '#64748B' }}>Skills to focus on for better match scores</p>
            </div>
            <button
              onClick={() => onNavigate('student-preparation')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View Details →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Docker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>Docker</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Required by 6 companies</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>Google</span>
                <span className="badge badge-blue" style={{ fontSize: '0.625rem' }}>Amazon</span>
                <span className="badge badge-gray" style={{ fontSize: '0.625rem' }}>+4</span>
              </div>
            </div>

            {/* AWS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>AWS Cloud</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Required by 4 companies</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.625rem' }}>Amazon</span>
                <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>Microsoft</span>
                <span className="badge badge-gray" style={{ fontSize: '0.625rem' }}>+2</span>
              </div>
            </div>

            {/* System Design */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>System Design</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Required by 3 companies</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>Google</span>
                <span className="badge badge-red" style={{ fontSize: '0.625rem' }}>Adobe</span>
                <span className="badge badge-gray" style={{ fontSize: '0.625rem' }}>+1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Strengths (Radar Chart) */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '2px' }}>Your Strengths</h3>
          <p style={{ fontSize: '0.71875rem', color: '#64748B', marginBottom: '12px' }}>Top skills contributing to matches</p>
          <RadarChart size={170} />
        </div>
      </div>

      {/* Bottom Row: Recent Activity, Upcoming Deadlines, Keep Learning Promo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', gap: '18px' }}>
        {/* Recent Activity */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '14px' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
                <CheckCircle2 size={15} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>Applied to Software Engineer</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Google • 2 hours ago</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                <CheckCircle2 size={15} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>Assessment completed</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Aptitude - Agent 49 • 1 day ago</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', flexShrink: 0 }}>
                <Sparkles size={15} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>New match available</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Data Analyst at Amazon • 2 days ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Upcoming Deadlines</h3>
            <button
              onClick={() => onNavigate('student-matches')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logos/google.svg" alt="Google" style={{ height: '20px', width: '20px' }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Google (SWE)</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>14 Sep 2026</div>
                </div>
              </div>
              <span className="badge badge-red" style={{ fontSize: '0.6875rem' }}>3 days left</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logos/microsoft.svg" alt="Microsoft" style={{ height: '20px', width: '20px' }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Microsoft (SDE)</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>16 Sep 2026</div>
                </div>
              </div>
              <span className="badge badge-amber" style={{ fontSize: '0.6875rem' }}>5 days left</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logos/amazon.svg" alt="Amazon" style={{ height: '20px', width: '20px' }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Amazon (Data Analyst)</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>18 Sep 2026</div>
                </div>
              </div>
              <span className="badge badge-amber" style={{ fontSize: '0.6875rem' }}>7 days left</span>
            </div>
          </div>
        </div>

        {/* Keep Learning Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div>
            <div className="font-script" style={{ color: '#FBBF24', fontSize: '1.25rem', marginBottom: '4px' }}>
              Stay Skilled. Stay Ready. Go Further.
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
              Keep Learning. Keep Growing.
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#E0E7FF', lineHeight: 1.4, maxWidth: '280px' }}>
              Bridge your skill gaps and get closer to your dream role with personalized roadmaps.
            </p>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => onNavigate('student-preparation')}
              className="btn"
              style={{ backgroundColor: '#FFFFFF', color: '#4F46E5', borderRadius: '999px', padding: '8px 18px', fontSize: '0.8125rem' }}
            >
              <span>Go to Preparation</span>
              <ArrowRight size={14} />
            </button>

            <div style={{ fontSize: '0.6875rem', color: '#C7D2FE', textAlign: 'right' }}>
              <div>200+ Resources</div>
              <div>AI Curated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
