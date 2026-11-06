import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Share2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  Code,
  FileCode,
  Check,
  BookOpen
} from 'lucide-react';
import RadialGauge from '../components/RadialGauge';
import CompanyLogo from '../components/CompanyLogo';
import { useDataSync } from '../context/SyncContext';
import confetti from 'canvas-confetti';

export default function OpportunityDetails({ jobId, onBack, onNavigate, onPrepareRole }) {
  const { syncVersion, notifyMutation } = useDataSync();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('match_overview');
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(() => {
    try {
      const saved = localStorage.getItem('jobmatch_saved_opportunities');
      const list = saved ? JSON.parse(saved) : [];
      return list.includes(jobId || 'job_google_swe');
    } catch {
      return false;
    }
  });

  const toggleBookmark = () => {
    const id = jobId || 'job_google_swe';
    try {
      const saved = localStorage.getItem('jobmatch_saved_opportunities');
      const list = saved ? JSON.parse(saved) : [];
      let updated;
      if (list.includes(id)) {
        updated = list.filter(item => item !== id);
        setIsBookmarked(false);
      } else {
        updated = [...list, id];
        setIsBookmarked(true);
      }
      localStorage.setItem('jobmatch_saved_opportunities', JSON.stringify(updated));
    } catch {
      setIsBookmarked(prev => !prev);
    }
  };

  useEffect(() => {
    async function loadDeepDive() {
      try {
        const token = localStorage.getItem('jobmatch_token');
        const res = await fetch(`/api/matching/opportunity-deep-dive/${jobId || 'job_google_swe'}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
          if (resData.job?.has_applied) setApplied(true);
        }
      } catch (err) {
        console.error('Error fetching opportunity deep dive:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDeepDive();
  }, [jobId, syncVersion]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ job_opening_id: jobId || 'job_google_swe' })
      });
      if (res.ok) {
        setApplied(true);
        notifyMutation('APPLICATION_CREATED', { job_id: jobId });
        try {
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error applying:', err);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748B' }}>
        Synthesizing Agent 50 multi-factor match intelligence...
      </div>
    );
  }

  const job = data?.job || {};
  const match = data?.match_analysis || {};
  const compScores = match.component_scores || { skill_match: 92, project_relevance: 96, role_interest_fit: 90, location_fit: 100 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack || (() => onNavigate && onNavigate('student-matches'))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: '0.84375rem', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Opportunities & Matches</span>
        </button>

        {onPrepareRole && (
          <button
            onClick={() => onPrepareRole(job)}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78125rem' }}
          >
            <BookOpen size={14} color="#4F46E5" />
            <span>Prepare for this Role</span>
          </button>
        )}
      </div>

      {/* Main Job Banner Card */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
            <CompanyLogo
              src={job.company_logo}
              name={job.company_name}
              size={60}
              borderRadius="14px"
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>{job.title}</h1>
                <span className="badge badge-green">Eligible ✓</span>
              </div>

              <div style={{ fontSize: '0.875rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>{job.company_name}</span>
                <span>•</span>
                <span>{job.role_type}</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={13} /> {job.location}</span>
                <span>•</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>{job.ctc_display}</span>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                <span className="badge badge-blue">Software Development</span>
                <span className="badge badge-purple">Backend</span>
                <span className="badge badge-blue">Cloud</span>
                <span className="badge badge-gray">Engineering</span>
              </div>
            </div>
          </div>

          {/* Right Top Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={toggleBookmark}
                title={isBookmarked ? 'Saved' : 'Bookmark Opportunity'}
                className="btn btn-outline btn-sm" 
                style={{ padding: '8px', color: isBookmarked ? '#4F46E5' : '#64748B', backgroundColor: isBookmarked ? '#EEF2FF' : '#FFFFFF' }}
              >
                <Bookmark size={16} fill={isBookmarked ? '#4F46E5' : 'none'} />
              </button>

              <button
                onClick={handleApply}
                disabled={applied || applying}
                className={`btn btn-lg ${applied ? 'btn-secondary' : 'btn-primary'}`}
                style={{ borderRadius: '10px', padding: '10px 24px' }}
              >
                <span>{applied ? 'Application Submitted ✓' : applying ? 'Applying...' : 'Apply Now →'}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.71875rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} />
              <span>Application deadline: 25 Sep 2026</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #F1F5F9', marginTop: '20px', paddingTop: '14px', fontSize: '0.84375rem', fontWeight: 600 }}>
          <span
            onClick={() => setActiveTab('match_overview')}
            style={{ color: activeTab === 'match_overview' ? '#4F46E5' : '#64748B', borderBottom: activeTab === 'match_overview' ? '2px solid #4F46E5' : 'none', paddingBottom: '6px', cursor: 'pointer' }}
          >
            Match Overview
          </span>
          <span
            onClick={() => setActiveTab('job_details')}
            style={{ color: activeTab === 'job_details' ? '#4F46E5' : '#64748B', borderBottom: activeTab === 'job_details' ? '2px solid #4F46E5' : 'none', paddingBottom: '6px', cursor: 'pointer' }}
          >
            Job Details
          </span>
          <span
            onClick={() => setActiveTab('eligibility')}
            style={{ color: activeTab === 'eligibility' ? '#4F46E5' : '#64748B', borderBottom: activeTab === 'eligibility' ? '2px solid #4F46E5' : 'none', paddingBottom: '6px', cursor: 'pointer' }}
          >
            Eligibility
          </span>
          <span
            onClick={() => setActiveTab('skills')}
            style={{ color: activeTab === 'skills' ? '#4F46E5' : '#64748B', borderBottom: activeTab === 'skills' ? '2px solid #4F46E5' : 'none', paddingBottom: '6px', cursor: 'pointer' }}
          >
            Required & Preferred Skills
          </span>
          <span
            onClick={() => setActiveTab('company')}
            style={{ color: activeTab === 'company' ? '#4F46E5' : '#64748B', borderBottom: activeTab === 'company' ? '2px solid #4F46E5' : 'none', paddingBottom: '6px', cursor: 'pointer' }}
          >
            Company Insights
          </span>
        </div>
      </div>

      {/* Your Match Score Component Breakdown (Page 4 Core Feature) */}
      <div className="card" style={{ padding: '24px 28px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#4F46E5" />
              Your Match Score
            </h3>
            <p style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '2px' }}>
              A holistic evaluation based on your profile, skills, interests and past outcomes.
            </p>
          </div>

          <div className="font-script" style={{ color: '#4F46E5', fontSize: '1.25rem' }}>
            Great Fit! Keep Going! →
          </div>
        </div>

        {/* 5 Circular/Radial Gauges in a Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr', gap: '20px', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '24px' }}>
          {/* Main Overall Match */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: '16px' }}>
            <RadialGauge value={match.overall_match ?? 0} size={110} strokeWidth={10} color={match.overall_match >= 80 ? '#10B981' : match.overall_match >= 60 ? '#6366F1' : '#F59E0B'} />
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <span className={`badge ${match.overall_match >= 80 ? 'badge-green' : match.overall_match >= 60 ? 'badge-blue' : 'badge-yellow'}`} style={{ fontSize: '0.6875rem' }}>
                {match.overall_match >= 80 ? '★ High Fit' : match.overall_match >= 60 ? '✓ Good Fit' : '⚡ Emerging Fit'}
              </span>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>Overall Match</div>
            </div>
          </div>

          {/* Skill Match */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <RadialGauge value={compScores.skill_match ?? 0} size={80} strokeWidth={8} color="#06B6D4" />
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>Skill Match</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px', maxWidth: '120px' }}>Alignment with required stack</div>
          </div>

          {/* Project Relevance */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <RadialGauge value={compScores.project_relevance ?? 0} size={80} strokeWidth={8} color="#6366F1" />
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>Project Relevance</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px', maxWidth: '120px' }}>Hands-on stack demonstrated</div>
          </div>

          {/* Role / Interest Fit */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <RadialGauge value={compScores.role_interest_fit ?? 0} size={80} strokeWidth={8} color="#3B82F6" />
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>Role / Interest Fit</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px', maxWidth: '120px' }}>Matches your career preferences</div>
          </div>

          {/* Location Preference */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <RadialGauge value={compScores.location_fit ?? 0} size={80} strokeWidth={8} color="#F59E0B" />
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>Location Fit</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px', maxWidth: '120px' }}>Location & mobility fit</div>
          </div>
        </div>

        {/* 3 Columns: Skill Alignment, Relevant Projects, Preparation Gaps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginTop: '24px' }}>
          {/* Skill Alignment Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>Skill Alignment</h4>
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.625rem' }}>
                <span style={{ color: '#10B981', fontWeight: 600 }}>• Strong</span>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>• Partial</span>
                <span style={{ color: '#EF4444', fontWeight: 600 }}>• Gap</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(match.skill_alignment && match.skill_alignment.length > 0 ? match.skill_alignment : []).map((sk, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78125rem', padding: '4px 0', borderBottom: '1px solid #F8FAFC' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{sk.skill}</span>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: sk.status === 'Strong Match' ? '#10B981' : sk.status === 'Partial Match' ? '#D97706' : '#DC2626'
                  }}>
                    {sk.level || sk.status}
                  </span>
                </div>
              ))}
              {(!match.skill_alignment || match.skill_alignment.length === 0) && (
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>No specific required skills listed.</div>
              )}
            </div>
          </div>

          {/* Relevant Projects */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>
              Relevant Projects
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(match.relevant_projects && match.relevant_projects.length > 0 ? match.relevant_projects : []).map((proj, pIdx) => {
                const techList = Array.isArray(proj.tech_stack) ? proj.tech_stack : [];
                return (
                  <div key={pIdx} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>{proj.title}</span>
                      <Check size={14} color="#10B981" />
                    </div>
                    {proj.description && (
                      <p style={{ fontSize: '0.71875rem', color: '#64748B', marginTop: '4px' }}>
                        {proj.description}
                      </p>
                    )}
                    {techList.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {techList.slice(0, 5).map((t, tIdx) => (
                          <span key={tIdx} className="badge badge-gray" style={{ fontSize: '0.625rem' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {(!match.relevant_projects || match.relevant_projects.length === 0) && (
                <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '10px', padding: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                  No directly matching projects recorded on profile yet.
                </div>
              )}
            </div>
          </div>

          {/* Preparation Gaps */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              Preparation Gaps
            </h4>
            <p style={{ fontSize: '0.71875rem', color: '#64748B', marginBottom: '12px' }}>
              Focus on these skills to strengthen your profile for this opening.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(match.preparation_gaps && match.preparation_gaps.length > 0 ? match.preparation_gaps : []).map((gap, gIdx) => (
                <div key={gIdx} style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#92400E' }}>{gap.skill}</span>
                    <span className="badge badge-red" style={{ fontSize: '0.625rem' }}>{gap.impact || 'Gap'}</span>
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: '#B45309', marginTop: '4px' }}>
                    {gap.action || gap.reason}
                  </p>
                </div>
              ))}
              {(!match.preparation_gaps || match.preparation_gaps.length === 0) && (
                <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#065F46', fontWeight: 600 }}>
                  ✓ All required skills matched! No major preparation gaps.
                </div>
              )}

              <button
                onClick={() => onNavigate('student-preparation')}
                style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', marginTop: '4px' }}
              >
                Launch Skill Remediation Roadmap →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Why You Are a Strong Candidate + Alumni Success Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Why Strong Candidate */}
        <div className="card">
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#4F46E5" />
            Why You Are a Strong Candidate
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(match.why_strong_candidate && match.why_strong_candidate.length > 0 ? match.why_strong_candidate : [
              'Basic academic criteria verified for this position'
            ]).map((reason, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8125rem', color: '#334155' }}>
                <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alumni & Success Insights */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
          <RadialGauge 
            value={match.alumni_insights?.interview_conversion_rate ?? Math.min(95, Math.round((match.overall_match || 70) * 0.9))} 
            size={90} 
            strokeWidth={8} 
            color="#3B82F6" 
            label="Conversion" 
          />

          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Alumni & Success Insights</h4>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
              {match.alumni_insights?.historical_cohort_notes || 'Students with comparable skill alignment had high conversion rates in technical rounds.'}
            </p>
            <div style={{ marginTop: '8px', padding: '6px 12px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', fontSize: '0.75rem', color: '#065F46', fontWeight: 700 }}>
              🚀 {match.alumni_insights?.shortlist_multiplier || '1.3x'} more likely to be shortlisted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
