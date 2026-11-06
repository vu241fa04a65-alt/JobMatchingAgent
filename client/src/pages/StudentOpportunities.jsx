import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Bookmark, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  MapPin, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown,
  Compass,
  ArrowUpRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from '../components/CompanyLogo';

export default function StudentOpportunities({ onViewJob, onApplyJob, onPrepareRole }) {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | recommended | saved | closing_soon
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedEligibility, setSelectedEligibility] = useState('ALL');
  const [sortBy, setSortBy] = useState('MATCH'); // MATCH | CTC | DEADLINE | RECENT
  
  // Bookmarked IDs persisted in localStorage
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('jobmatch_saved_opportunities');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Applied Job IDs tracked locally
  const [appliedJobIds, setAppliedJobIds] = useState(() => {
    try {
      const saved = localStorage.getItem('jobmatch_applied_job_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [applyingId, setApplyingId] = useState(null);
  const [applySuccessMsg, setApplySuccessMsg] = useState(null);

  // Fetch opportunities and applications from backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = localStorage.getItem('jobmatch_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Fetch Agent 50 matches (contains full real jobs with match scores and eligibility)
        const res = await fetch('/api/matching/student-matches', { headers });
        if (res.ok) {
          const data = await res.json();
          const items = data.matches || data.all_eligible || data.recommended || [];
          const flattened = items.map(m => {
            const j = m.job || m;
            return {
              ...j,
              is_eligible: m.is_eligible !== undefined ? m.is_eligible : (j.is_eligible !== undefined ? j.is_eligible : true),
              overall_match: m.overall_match ?? j.overall_match ?? 0,
              eligibility_reasons: m.eligibility_reasons || j.eligibility_reasons || [],
              why_strong_candidate: m.why_strong_candidate || j.why_strong_candidate || [],
              preparation_gaps: m.preparation_gaps || j.preparation_gaps || [],
              deadline: j.deadline_date || j.deadline
            };
          });
          setOpportunities(flattened);
        }

        // Fetch existing applications to sync applied status
        const appRes = await fetch('/api/applications/my-applications', { headers });
        if (appRes.ok) {
          const appData = await appRes.json();
          if (appData.applications && Array.isArray(appData.applications)) {
            const ids = appData.applications.map(a => a.job_opening_id);
            setAppliedJobIds(ids);
            try {
              localStorage.setItem('jobmatch_applied_job_ids', JSON.stringify(ids));
            } catch {
              // Ignore
            }
          }
        }
      } catch (err) {
        console.error('Error fetching opportunities:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleBookmark = (id, e) => {
    if (e) e.stopPropagation();
    setBookmarkedIds(prev => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter(item => item !== id);
      } else {
        next = [...prev, id];
      }
      try {
        localStorage.setItem('jobmatch_saved_opportunities', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleApply = async (job, e) => {
    if (e) e.stopPropagation();
    if (appliedJobIds.includes(job.id)) return;

    try {
      setApplyingId(job.id);
      const token = localStorage.getItem('jobmatch_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch('/api/applications/apply', {
        method: 'POST',
        headers,
        body: JSON.stringify({ job_opening_id: job.id })
      });

      if (res.ok) {
        const nextApplied = [...appliedJobIds, job.id];
        setAppliedJobIds(nextApplied);
        try {
          localStorage.setItem('jobmatch_applied_job_ids', JSON.stringify(nextApplied));
        } catch {
          // Ignore
        }
        setApplySuccessMsg(`Application for ${job.title} at ${job.company_name} submitted successfully!`);
        setTimeout(() => setApplySuccessMsg(null), 4500);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error applying to job:', err);
      alert('Error submitting application. Please try again.');
    } finally {
      setApplyingId(null);
    }
  };

  // Filter and Sort Logic
  const filteredOpportunities = opportunities.filter(job => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = job.title?.toLowerCase().includes(q);
      const matchCompany = job.company_name?.toLowerCase().includes(q);
      const matchSkills = job.required_skills?.some?.(s => s.toLowerCase().includes(q));
      const matchLocation = job.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany && !matchSkills && !matchLocation) return false;
    }

    // Tabs
    if (activeTab === 'recommended' && (job.overall_match || 0) < 75) return false;
    if (activeTab === 'saved' && !bookmarkedIds.includes(job.id)) return false;
    if (activeTab === 'closing_soon') {
      const deadline = new Date(job.deadline);
      const now = new Date();
      const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
      if (diffDays > 30 || diffDays < 0) return false;
    }

    // Company filter
    if (selectedCompany !== 'ALL' && job.company_name !== selectedCompany) return false;

    // Type filter
    if (selectedType !== 'ALL') {
      if (selectedType === 'FULL_TIME' && !job.role_type?.includes('Full')) return false;
      if (selectedType === 'INTERNSHIP' && !job.role_type?.includes('Intern')) return false;
    }

    // Eligibility filter
    if (selectedEligibility === 'ELIGIBLE' && !job.is_eligible) return false;
    if (selectedEligibility === 'INELIGIBLE' && job.is_eligible) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'MATCH') return (b.overall_match || 0) - (a.overall_match || 0);
    if (sortBy === 'CTC') return (b.ctc_max || 0) - (a.ctc_max || 0);
    if (sortBy === 'DEADLINE') return new Date(a.deadline) - new Date(b.deadline);
    if (sortBy === 'RECENT') return b.id - a.id;
    return 0;
  });

  const uniqueCompanies = Array.from(new Set(opportunities.map(j => j.company_name).filter(Boolean)));
  const totalEligible = opportunities.filter(j => j.is_eligible).length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Toast Notification */}
      {applySuccessMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '14px 22px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem',
          fontWeight: 600,
          zIndex: 1000,
          border: '1px solid #334155'
        }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{applySuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '28px',
        padding: '24px 28px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #FFFFFF 100%)',
        border: '1px solid #E0E7FF'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', backgroundColor: '#4F46E5', color: '#FFFFFF', fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            <Compass size={12} />
            <span>Opportunity Discovery</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Explore Career Opportunities
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '560px', margin: 0 }}>
            Browse verified campus drives, internships, and full-time hiring openings. Agent 50 evaluates your real-time eligibility and skill readiness for every role.
          </p>
        </div>

        {/* Header Stats */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4F46E5' }}>{opportunities.length}</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Total Openings</div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>{totalEligible}</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Eligible Drives</div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7C3AED' }}>{bookmarkedIds.length}</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Saved Roles</div>
          </div>
        </div>
      </div>

      {/* Discovery Filter Controls */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '28px', borderRadius: '18px' }}>
        {/* Search Bar & Primary Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={17} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search by role title, company name, skill (e.g. React, Python), or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 38px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                fontSize: '0.84375rem',
                color: '#0F172A',
                outline: 'none',
                backgroundColor: '#F8FAFC'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
              onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
            />
          </div>

          {/* Primary View Tabs */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'all' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'all' ? '#4F46E5' : '#64748B',
                fontWeight: activeTab === 'all' ? 700 : 500,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              All ({opportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('recommended')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'recommended' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'recommended' ? '#4F46E5' : '#64748B',
                fontWeight: activeTab === 'recommended' ? 700 : 500,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'recommended' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              ★ Recommended
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'saved' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'saved' ? '#4F46E5' : '#64748B',
                fontWeight: activeTab === 'saved' ? 700 : 500,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'saved' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Saved ({bookmarkedIds.length})
            </button>
            <button
              onClick={() => setActiveTab('closing_soon')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'closing_soon' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'closing_soon' ? '#4F46E5' : '#64748B',
                fontWeight: activeTab === 'closing_soon' ? 700 : 500,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'closing_soon' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              ⏳ Closing Soon
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Sorter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Company Filter */}
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.78125rem',
                color: '#334155',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                fontWeight: 600
              }}
            >
              <option value="ALL">All Companies</option>
              {uniqueCompanies.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.78125rem',
                color: '#334155',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                fontWeight: 600
              }}
            >
              <option value="ALL">All Job Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="INTERNSHIP">Internship</option>
            </select>

            {/* Eligibility Filter */}
            <select
              value={selectedEligibility}
              onChange={(e) => setSelectedEligibility(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.78125rem',
                color: '#334155',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                fontWeight: 600
              }}
            >
              <option value="ALL">All Eligibility</option>
              <option value="ELIGIBLE">Eligible Only (✓)</option>
              <option value="INELIGIBLE">Ineligible</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78125rem', color: '#64748B', fontWeight: 600 }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.78125rem',
                color: '#4F46E5',
                backgroundColor: '#FFFFFF',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="MATCH">Best Agent 50 Match</option>
              <option value="CTC">Highest CTC / Package</option>
              <option value="DEADLINE">Application Deadline</option>
              <option value="RECENT">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities List Container */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          <Sparkles size={28} color="#4F46E5" style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
          <div>Loading verified campus opportunities...</div>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '20px' }}>
          <Compass size={44} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
            No opportunities found
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '420px', margin: '0 auto 20px' }}>
            {activeTab === 'saved' 
              ? "You haven't bookmarked any opportunities yet. Click the bookmark icon on any card to save it here."
              : "Try adjusting your search query, clearing filters, or resetting eligibility options."}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveTab('all'); setSelectedCompany('ALL'); setSelectedType('ALL'); setSelectedEligibility('ALL'); }}
            className="btn btn-outline"
            style={{ borderRadius: '10px', padding: '8px 18px', fontSize: '0.8125rem' }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '22px' }}>
          {filteredOpportunities.map((job) => {
            const isBookmarked = bookmarkedIds.includes(job.id);
            const isApplied = appliedJobIds.includes(job.id);
            const matchScore = job.overall_match ?? 0;
            const isEligible = job.is_eligible !== false;

            return (
              <div 
                key={job.id}
                className="card"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  border: isEligible ? '1px solid #E2E8F0' : '1px solid #F1F5F9',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => onViewJob && onViewJob(job.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(79, 70, 229, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.03)';
                }}
              >
                <div>
                  {/* Card Top: Company Logo + Title + Bookmark */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CompanyLogo 
                        src={job.company_logo} 
                        name={job.company_name} 
                        size={46} 
                        borderRadius="12px" 
                      />
                      <div>
                        <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A', marginBottom: '3px', lineHeight: 1.2 }}>
                          {job.title}
                        </h3>
                        <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
                          {job.company_name}
                        </div>
                      </div>
                    </div>

                    {/* Bookmark Button */}
                    <button
                      onClick={(e) => toggleBookmark(job.id, e)}
                      title={isBookmarked ? 'Remove Bookmark' : 'Save Opportunity'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '8px',
                        color: isBookmarked ? '#4F46E5' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isBookmarked ? '#EEF2FF' : '#F8FAFC',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Bookmark size={18} fill={isBookmarked ? '#4F46E5' : 'none'} />
                    </button>
                  </div>

                  {/* Metadata Chips: Location, Role Type, CTC */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>
                      <MapPin size={13} color="#94A3B8" />
                      <span>{job.location || 'Bengaluru, India'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>
                      <Briefcase size={13} color="#94A3B8" />
                      <span>{job.role_type || 'Full-time'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                      <DollarSign size={13} color="#059669" />
                      <span>{job.ctc_display || '₹18–24 LPA'}</span>
                    </div>
                  </div>

                  {/* Agent 50 Match & Eligibility Section */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: isEligible ? '#F8FAFC' : '#FEF2F2',
                    border: isEligible ? '1px solid #E2E8F0' : '1px solid #FEE2E2',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    {/* Eligibility Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isEligible ? (
                        <>
                          <CheckCircle2 size={16} color="#10B981" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46' }}>Eligible for Campus Drive</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} color="#EF4444" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B' }}>Criteria Not Met</span>
                        </>
                      )}
                    </div>

                    {/* Radial Match Score Pill */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      backgroundColor: matchScore >= 80 ? '#ECFDF5' : '#FEF3C7',
                      color: matchScore >= 80 ? '#047857' : '#B45309',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      <Sparkles size={12} />
                      <span>{matchScore}% Match</span>
                    </div>
                  </div>

                  {/* Agent 50 Reasoning Hint */}
                  {job.explanation && (
                    <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      <strong style={{ color: '#4F46E5' }}>Agent 50:</strong> {job.explanation}
                    </div>
                  )}

                  {/* Required Skills Chips */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Required Skills
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(job.required_skills || ['Python', 'React', 'Cloud']).slice(0, 4).map((skill, sIdx) => (
                        <span key={sIdx} style={{ padding: '3px 9px', borderRadius: '6px', backgroundColor: '#F1F5F9', color: '#334155', fontSize: '0.71875rem', fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))}
                      {(job.required_skills?.length || 0) > 4 && (
                        <span style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: '#F8FAFC', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 600 }}>
                          +{job.required_skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Deadline & Action Buttons */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.75rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} />
                      <span>Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Open'}</span>
                    </div>
                    {onPrepareRole && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onPrepareRole(job); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4F46E5',
                          fontSize: '0.71875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <BookOpen size={12} />
                        <span>Prepare</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewJob && onViewJob(job.id); }}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '9px 12px', fontSize: '0.8125rem', borderRadius: '10px', justifyContent: 'center' }}
                    >
                      <span>View Details</span>
                      <ArrowUpRight size={14} />
                    </button>

                    {isApplied ? (
                      <button
                        disabled
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          fontSize: '0.8125rem',
                          borderRadius: '10px',
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #86EFAC',
                          color: '#15803D',
                          fontWeight: 700,
                          cursor: 'default',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Applied ✓</span>
                      </button>
                    ) : isEligible ? (
                      <button
                        onClick={(e) => handleApply(job, e)}
                        disabled={applyingId === job.id}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          fontSize: '0.8125rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                          justifyContent: 'center'
                        }}
                      >
                        <span>{applyingId === job.id ? 'Submitting...' : 'Apply Now'}</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          fontSize: '0.8125rem',
                          borderRadius: '10px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: '#94A3B8',
                          fontWeight: 600,
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span>Not Eligible</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
