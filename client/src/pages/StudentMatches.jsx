import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  Filter,
  ArrowRight,
  Briefcase,
  SlidersHorizontal,
  Star,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import RadialGauge from '../components/RadialGauge';
import DonutChart from '../components/DonutChart';
import CompanyLogo from '../components/CompanyLogo';
import confetti from 'canvas-confetti';
import { useDataSync } from '../context/SyncContext';

export default function StudentMatches({ onSelectJob, onViewJob, onNavigate }) {
  const { syncVersion, notifyMutation } = useDataSync();
  const selectJob = onSelectJob || onViewJob;
  const navigateTo = onNavigate || (() => {});
  const [activeTab, setActiveTab] = useState('recommended'); // 'recommended', 'all_eligible', 'closing_soon'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [minCtc, setMinCtc] = useState(0);
  const [onlyEligible, setOnlyEligible] = useState(true);

  // Apply state
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [appliedMap, setAppliedMap] = useState({});

  useEffect(() => {
    async function fetchMatches() {
      try {
        const token = localStorage.getItem('jobmatch_token');
        const res = await fetch('/api/matching/student-matches', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
          // populate appliedMap
          const initialMap = {};
          (resData.all_eligible || []).forEach(m => {
            if (m.job.application_status) initialMap[m.job.id] = m.job.application_status;
          });
          setAppliedMap(initialMap);
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [syncVersion]);

  const handleApply = async (jobId, jobTitle) => {
    setApplyingJobId(jobId);
    try {
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job_opening_id: jobId })
      });

      if (res.ok) {
        setAppliedMap(prev => ({ ...prev, [jobId]: 'UNDER_REVIEW' }));
        notifyMutation('APPLICATION_CREATED', { job_id: jobId, title: jobTitle });
        // celebrate
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error applying:', err);
    } finally {
      setApplyingJobId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748B' }}>
        Calculating personalized Agent 50 matches...
      </div>
    );
  }

  // Pick dataset based on tab
  let sourceList = data?.all_eligible || [];
  if (activeTab === 'recommended') sourceList = data?.recommended || [];
  else if (activeTab === 'closing_soon') sourceList = data?.closing_soon || [];

  // Filter application
  const filteredMatches = sourceList.filter(m => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.job.title.toLowerCase().includes(q);
      const matchComp = (m.job.company_name || '').toLowerCase().includes(q);
      const matchSkill = (m.job.required_skills || []).some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchComp && !matchSkill) return false;
    }

    if (roleTypeFilter !== 'All' && m.job.role_type !== roleTypeFilter) return false;
    if (locationFilter !== 'All' && !m.job.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (companyFilter !== 'All' && m.job.company_name !== companyFilter) return false;
    if (minCtc > 0 && m.job.ctc_min < minCtc) return false;
    if (onlyEligible && !m.is_eligible) return false;

    return true;
  });

  const counts = data?.counts || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Header with Donut */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            My <span style={{ color: '#4F46E5' }}>Matches</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            AI-ranked opportunities tailored to your profile, interests and career goals.
          </p>
        </div>

        {/* Donut Snapshot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <DonutChart
            size={72}
            strokeWidth={8}
            totalCount={counts.eligible_count || 18}
            totalLabel=""
            showLegend={false}
            data={[
              { count: counts.high_fit || 6, color: '#3B82F6' },
              { count: counts.good_fit || 8, color: '#8B5CF6' },
              { count: counts.emerging_fit || 4, color: '#CBD5E1' }
            ]}
          />
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>
              {counts.eligible_count || 18} Eligible Opportunities
            </div>
            <div className="font-script" style={{ color: '#818CF8', fontSize: '1rem', marginTop: '2px' }}>
              Find Your Fit • Apply • Grow
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Matches List + Right Filter Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Tabs & Opportunity Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
            <button
              onClick={() => setActiveTab('recommended')}
              className={`btn btn-sm ${activeTab === 'recommended' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px' }}
            >
              <span>Recommended ({counts.recommended_count || 6})</span>
            </button>

            <button
              onClick={() => setActiveTab('all_eligible')}
              className={`btn btn-sm ${activeTab === 'all_eligible' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px' }}
            >
              <span>All Eligible ({counts.eligible_count || 18})</span>
            </button>

            <button
              onClick={() => setActiveTab('closing_soon')}
              className={`btn btn-sm ${activeTab === 'closing_soon' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px' }}
            >
              <span>Closing Soon ({counts.closing_soon_count || 4})</span>
            </button>
          </div>

          {/* Opportunity Cards List */}
          {filteredMatches.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
              <Briefcase size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>No opportunities match current filters</div>
              <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>Try resetting or broadening your filter criteria.</p>
            </div>
          ) : (
            filteredMatches.map((m) => {
              const job = m.job;
              const hasApplied = !!appliedMap[job.id];
              const isTopMatch = m.overall_match >= 90;

              return (
                <div
                  key={job.id}
                  className="card"
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    position: 'relative',
                    border: isTopMatch ? '1.5px solid #818CF8' : '1px solid #E2E8F0'
                  }}
                >
                  {/* Top Match Ribbon */}
                  {isTopMatch && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: '1px solid #A7F3D0'
                    }}>
                      <Star size={11} fill="#059669" />
                      <span>Top Match</span>
                    </div>
                  )}

                  {/* Left: Company Logo + Title + Tags */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1 }}>
                    <CompanyLogo
                      src={job.company_logo}
                      name={job.company_name}
                      size={52}
                      borderRadius="12px"
                    />

                    <div style={{ flex: 1 }}>
                      <h3
                        onClick={() => selectJob && selectJob(job.id)}
                        style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A', cursor: 'pointer', display: 'inline-block' }}
                      >
                        {job.title}
                      </h3>
                      <div style={{ fontSize: '0.8125rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>{job.company_name}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={12} /> {job.location}</span>
                        <span>•</span>
                        <span>{job.role_type}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 700, color: '#059669' }}>{job.ctc_display}</span>
                      </div>

                      {/* Skills Badges */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {(job.required_skills || []).slice(0, 4).map((sk, idx) => (
                          <span key={idx} className="badge badge-blue">
                            {sk}
                          </span>
                        ))}
                        {(job.required_skills || []).length > 4 && (
                          <span className="badge badge-gray">
                            +{(job.required_skills || []).length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Radial Gauge + Explainability Reasons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '220px' }}>
                    <RadialGauge
                      value={m.overall_match}
                      size={72}
                      strokeWidth={7}
                      color="auto"
                      label="Match"
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.6875rem' }}>
                      {(m.why_strong_candidate || []).slice(0, 3).map((reason, rIdx) => (
                        <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                          <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            {reason}
                          </span>
                        </div>
                      ))}
                      {m.is_eligible && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
                          <CheckCircle2 size={12} color="#10B981" />
                          <span>Eligible</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '110px' }}>
                    <button
                      onClick={() => selectJob && selectJob(job.id)}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%' }}
                    >
                      <span>View Details</span>
                      <ChevronRight size={13} />
                    </button>

                    <button
                      onClick={() => handleApply(job.id, job.title)}
                      disabled={hasApplied || applyingJobId === job.id}
                      className={`btn btn-sm ${hasApplied ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ width: '100%' }}
                    >
                      <span>
                        {hasApplied ? 'Applied ✓' : applyingJobId === job.id ? 'Applying...' : 'Apply'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Bottom Notice */}
          <div style={{
            backgroundColor: '#EEF2FF',
            border: '1px solid #C7D2FE',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#4F46E5" />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E1B4B' }}>
                  Not finding enough high-fit opportunities?
                </div>
                <div style={{ fontSize: '0.71875rem', color: '#4338CA' }}>
                  Check your preparation gaps and upskill for better matches.
                </div>
              </div>
            </div>

            <button
              onClick={() => navigateTo('preparation-center')}
              className="btn btn-primary btn-sm"
              style={{ borderRadius: '999px' }}
            >
              <span>Go to Preparation</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Filter Drawer */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
            <Filter size={16} color="#4F46E5" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Filters</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Search */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Search</label>
              <input
                type="text"
                placeholder="Search jobs, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.78125rem', padding: '7px 10px' }}
              />
            </div>

            {/* Role Type */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Role Type</label>
              <select
                value={roleTypeFilter}
                onChange={(e) => setRoleTypeFilter(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.78125rem', padding: '7px 10px' }}
              >
                <option value="All">All Roles</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.78125rem', padding: '7px 10px' }}
              >
                <option value="All">All Locations</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>

            {/* Minimum CTC */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                <span>Min CTC</span>
                <span style={{ color: '#4F46E5' }}>{minCtc > 0 ? `≥ ₹${minCtc} LPA` : 'Any'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="2"
                value={minCtc}
                onChange={(e) => setMinCtc(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#4F46E5' }}
              />
            </div>

            {/* Only Eligible Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                Show only eligible
              </label>
              <input
                type="checkbox"
                checked={onlyEligible}
                onChange={(e) => setOnlyEligible(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#4F46E5' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleTypeFilter('All');
                  setLocationFilter('All');
                  setCompanyFilter('All');
                  setMinCtc(0);
                  setOnlyEligible(true);
                }}
                className="btn btn-outline btn-sm"
                style={{ flex: 1, fontSize: '0.75rem' }}
              >
                Clear
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1, fontSize: '0.75rem' }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
