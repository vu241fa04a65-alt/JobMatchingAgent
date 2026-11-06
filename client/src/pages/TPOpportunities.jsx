import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  Lock,
  Eye,
  Search,
  Filter,
  ExternalLink,
  Bot,
  Building2,
  Globe,
  Edit3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from '../components/CompanyLogo';
import CompanyLogoUpload from '../components/CompanyLogoUpload';

export default function TPOpportunities({ onNavigate, onViewCandidates, onSelectJobForCandidates }) {
  const { user } = useAuth();
  const isHOD = user?.role === 'HOD';

  // Active Tab: 'drives' (Opportunities) or 'companies' (Company Directory)
  const [activeTab, setActiveTab] = useState('drives');

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Companies Directory State
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companySearch, setCompanySearch] = useState('');
  const [companyIndustryFilter, setCompanyIndustryFilter] = useState('All');
  const [companyTierFilter, setCompanyTierFilter] = useState('All');

  // Opportunity Modal State
  const [showModal, setShowModal] = useState(false);
  const [rawJdText, setRawJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedSuccess, setAnalyzedSuccess] = useState(false);

  // Opportunity Form Fields
  const [formData, setFormData] = useState({
    company_name: '',
    title: '',
    role_type: 'Full-time',
    work_mode: 'Hybrid',
    location: '',
    ctc_min: '',
    ctc_max: '',
    min_cgpa: 7.0,
    eligible_branches: ['CSE', 'ISE', 'ECE'],
    required_skills: ['Python', 'Data Structures', 'Algorithms', 'SQL'],
    preferred_skills: ['Docker', 'Cloud (AWS)'],
    description: '',
    logo_url: null,
    image_data: null,
    image_filename: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Add Company Modal State
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    tier: 'Tier 1',
    industry: 'Technology',
    headquarters: 'Bengaluru, India',
    website: '',
    description: '',
    logo_url: null,
    image_data: null,
    image_filename: null
  });
  const [submittingCompany, setSubmittingCompany] = useState(false);
  const [companyFeedback, setCompanyFeedback] = useState('');

  // Edit Company Modal State
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editCompanyFormData, setEditCompanyFormData] = useState({
    name: '',
    tier: 'Tier 1',
    industry: 'Technology',
    headquarters: 'Bengaluru, India',
    website: '',
    description: '',
    logo_url: null,
    image_data: null,
    image_filename: null,
    remove_logo: false
  });
  const [updatingCompany, setUpdatingCompany] = useState(false);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/jobs', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/companies', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadCompanies();
  }, []);

  const handleAnalyzeJD = async () => {
    if (!rawJdText || !rawJdText.trim()) {
      alert('Please paste a job description text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzedSuccess(false);
    try {
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/jobs/analyze-jd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ raw_text: rawJdText, company_name: formData.company_name })
      });

      if (res.ok) {
        const data = await res.json();
        const s = data.structured;

        // Check if company already has a known logo in directory
        const matchingCompany = companies.find(c =>
          c.name.toLowerCase() === (s.company_name || formData.company_name || '').toLowerCase()
        );

        setFormData(prev => ({
          ...prev,
          company_name: s.company_name || prev.company_name || '',
          title: s.title || 'Software Development Engineer',
          role_type: s.role_type || 'Full-time',
          work_mode: s.work_mode || 'Hybrid',
          location: s.location || 'Bengaluru, India',
          ctc_min: (s.ctc_min !== null && s.ctc_min !== undefined) ? s.ctc_min : '',
          ctc_max: (s.ctc_max !== null && s.ctc_max !== undefined) ? s.ctc_max : '',
          min_cgpa: s.min_cgpa !== undefined ? s.min_cgpa : 7.0,
          eligible_branches: Array.isArray(s.eligible_branches) && s.eligible_branches.length > 0 ? s.eligible_branches : ['CSE', 'ISE', 'ECE'],
          required_skills: Array.isArray(s.required_skills) && s.required_skills.length > 0 ? s.required_skills : ['Python', 'Java', 'Data Structures', 'Algorithms'],
          preferred_skills: Array.isArray(s.preferred_skills) ? s.preferred_skills : ['Docker', 'Cloud (AWS)'],
          description: rawJdText,
          logo_url: matchingCompany?.logo_url || prev.logo_url
        }));
        setAnalyzedSuccess(true);
      }
    } catch (err) {
      console.error('Error analyzing JD:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    if (isHOD) return;

    setSubmitting(true);
    setFeedback('');
    try {
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create opportunity');

      await Promise.all([loadJobs(), loadCompanies()]);
      setShowModal(false);
      setFeedback('New Company Opportunity successfully structured and published!');
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCompanySubmit = async (e) => {
    e.preventDefault();
    if (isHOD) return;

    setSubmittingCompany(true);
    setCompanyFeedback('');
    try {
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(companyFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register company');

      await Promise.all([loadCompanies(), loadJobs()]);
      setShowAddCompanyModal(false);
      setCompanyFormData({
        name: '',
        tier: 'Tier 1',
        industry: 'Technology',
        headquarters: 'Bengaluru, India',
        website: '',
        description: '',
        logo_url: null,
        image_data: null,
        image_filename: null
      });
      setFeedback(`Company "${data.company?.name || 'New Company'}" registered successfully!`);
    } catch (err) {
      setCompanyFeedback(err.message);
    } finally {
      setSubmittingCompany(false);
    }
  };

  const handleOpenEditModal = (comp) => {
    setEditingCompany(comp);
    setEditCompanyFormData({
      name: comp.name || '',
      tier: comp.tier || 'Tier 1',
      industry: comp.industry || 'Technology',
      headquarters: comp.headquarters || 'Bengaluru, India',
      website: comp.website || '',
      description: comp.description || '',
      logo_url: comp.logo_url || null,
      image_data: null,
      image_filename: null,
      remove_logo: false
    });
    setCompanyFeedback('');
    setShowEditCompanyModal(true);
  };

  const handleEditCompanySubmit = async (e) => {
    e.preventDefault();
    if (isHOD || !editingCompany) return;

    setUpdatingCompany(true);
    setCompanyFeedback('');
    try {
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch(`/api/companies/${editingCompany.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editCompanyFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update company');

      await Promise.all([loadCompanies(), loadJobs()]);
      setShowEditCompanyModal(false);
      setEditingCompany(null);
      setFeedback(`Company "${data.company?.name || 'Company'}" updated successfully!`);
    } catch (err) {
      setCompanyFeedback(err.message);
    } finally {
      setUpdatingCompany(false);
    }
  };

  // Filtered companies list
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = !companySearch ||
      c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
      (c.headquarters && c.headquarters.toLowerCase().includes(companySearch.toLowerCase())) ||
      (c.industry && c.industry.toLowerCase().includes(companySearch.toLowerCase()));
    const matchesIndustry = companyIndustryFilter === 'All' || c.industry === companyIndustryFilter;
    const matchesTier = companyTierFilter === 'All' || c.tier === companyTierFilter;
    return matchesSearch && matchesIndustry && matchesTier;
  });

  const industriesList = ['Technology', 'Finance & Banking', 'Consulting', 'E-Commerce', 'Healthcare', 'Automotive', 'Manufacturing', 'Analytics & AI'];

  if (loading && companiesLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748B' }}>
        Loading company directory and opportunities...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Events, Companies & Opportunities
            </h1>
            {isHOD && (
              <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={12} />
                <span>HOD View (Read Only)</span>
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Manage partner companies, logos, campus placement drives, and AI candidate matching.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!isHOD ? (
            <>
              <button
                onClick={() => {
                  setCompanyFeedback('');
                  setShowAddCompanyModal(true);
                }}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                <span>Add New Company</span>
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={16} />
                <span>Create Opportunity with AI</span>
              </button>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              color: '#92400E',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              <Lock size={13} />
              <span>HOD Mutation Disabled</span>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: '10px', fontSize: '0.8125rem', border: '1px solid #A7F3D0' }}>
          ✓ {feedback}
        </div>
      )}

      {/* View Switcher Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '2px'
      }}>
        <button
          onClick={() => setActiveTab('drives')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            fontWeight: 800,
            fontSize: '0.875rem',
            border: 'none',
            background: 'none',
            color: activeTab === 'drives' ? '#4F46E5' : '#64748B',
            borderBottom: activeTab === 'drives' ? '3px solid #4F46E5' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Briefcase size={16} />
          <span>Placement Drives & Opportunities</span>
          <span style={{
            fontSize: '0.6875rem',
            backgroundColor: activeTab === 'drives' ? '#EEF2FF' : '#F1F5F9',
            color: activeTab === 'drives' ? '#4F46E5' : '#64748B',
            padding: '2px 8px',
            borderRadius: '999px',
            fontWeight: 700
          }}>
            {jobs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            fontWeight: 800,
            fontSize: '0.875rem',
            border: 'none',
            background: 'none',
            color: activeTab === 'companies' ? '#4F46E5' : '#64748B',
            borderBottom: activeTab === 'companies' ? '3px solid #4F46E5' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Building2 size={16} />
          <span>Company Directory</span>
          <span style={{
            fontSize: '0.6875rem',
            backgroundColor: activeTab === 'companies' ? '#EEF2FF' : '#F1F5F9',
            color: activeTab === 'companies' ? '#4F46E5' : '#64748B',
            padding: '2px 8px',
            borderRadius: '999px',
            fontWeight: 700
          }}>
            {companies.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PLACEMENT DRIVES & OPPORTUNITIES */}
      {activeTab === 'drives' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '18px' }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              className="card"
              style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {/* Synchronized Company Logo with fallback */}
                    <CompanyLogo
                      src={job.company_logo}
                      name={job.company_name}
                      size={46}
                      borderRadius="10px"
                    />

                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{job.title}</h3>
                      <div style={{ fontSize: '0.8125rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>{job.company_name}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                      </div>
                    </div>
                  </div>

                  <span className="badge badge-purple">{job.role_type}</span>
                </div>

                {/* Package & Eligibility */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px', fontSize: '0.8125rem', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 800, color: '#059669' }}>
                    {job.ctc_display}
                  </div>
                  <div style={{ color: '#64748B' }}>
                    Min CGPA: <span style={{ fontWeight: 700, color: '#0F172A' }}>{job.min_cgpa}</span>
                  </div>
                  <div style={{ color: '#64748B' }}>
                    Batches: <span style={{ fontWeight: 700, color: '#0F172A' }}>{(job.eligible_grad_years || []).join(', ')}</span>
                  </div>
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {(job.required_skills || []).slice(0, 4).map((sk, idx) => (
                    <span key={idx} className="badge badge-blue" style={{ fontSize: '0.6875rem' }}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', marginTop: '16px', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  <span>Deadline: {job.deadline_date}</span>
                </div>

                <button
                  onClick={() => {
                    const handler = onViewCandidates || onSelectJobForCandidates;
                    if (typeof handler === 'function') {
                      handler(job.id);
                    } else if (typeof onNavigate === 'function') {
                      onNavigate('tp-candidate-ranking');
                    }
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Sparkles size={13} />
                  <span>Rank Candidates</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: COMPANY DIRECTORY */}
      {activeTab === 'companies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Filters Bar */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search company by name, location, or industry..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <select
                value={companyTierFilter}
                onChange={(e) => setCompanyTierFilter(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.8125rem', width: 'auto' }}
              >
                <option value="All">All Tiers</option>
                <option value="Tier 1">Tier 1 (Dream)</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Mass">Mass Recruiter</option>
              </select>

              <select
                value={companyIndustryFilter}
                onChange={(e) => setCompanyIndustryFilter(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.8125rem', width: 'auto' }}
              >
                <option value="All">All Industries</option>
                {industriesList.map((ind, i) => (
                  <option key={i} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Companies Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            {filteredCompanies.map((comp) => (
              <div
                key={comp.id}
                className="card"
                style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Synchronized Logo with Fallback */}
                      <CompanyLogo
                        src={comp.logo_url}
                        name={comp.name}
                        size={52}
                        borderRadius="12px"
                      />

                      <div>
                        <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A' }}>
                          {comp.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>
                            {comp.tier || 'Tier 1'}
                          </span>
                          <span className="badge badge-blue" style={{ fontSize: '0.625rem' }}>
                            {comp.industry || 'Technology'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isHOD && (
                      <button
                        onClick={() => handleOpenEditModal(comp)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '6px 10px', fontSize: '0.71875rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Edit company profile or logo"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '12px', lineHeight: 1.45 }}>
                    {comp.description || 'Verified partner company participating in campus placement drives.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px', fontSize: '0.75rem', color: '#64748B', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#94A3B8" />
                      <span>{comp.headquarters || 'India'}</span>
                    </span>

                    {comp.website && (
                      <a
                        href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}
                      >
                        <Globe size={13} />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.71875rem', color: '#334155', fontWeight: 700 }}>
                    {comp.active_openings_count || 0} active opening{(comp.active_openings_count || 0) === 1 ? '' : 's'}
                  </div>

                  {!isHOD && (
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          company_name: comp.name,
                          logo_url: comp.logo_url
                        }));
                        setShowModal(true);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.71875rem' }}
                    >
                      <span>Post Role</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW COMPANY MODAL */}
      {showAddCompanyModal && !isHOD && (
        <div className="modal-overlay" onClick={() => setShowAddCompanyModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: '#0F172A' }}>Register New Partner Company</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Add corporate profile, logo, and tiering to RVCE placement network</p>
                </div>
              </div>
              <button onClick={() => setShowAddCompanyModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            {companyFeedback && (
              <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '0.78125rem', marginBottom: '14px' }}>
                ⚠ {companyFeedback}
              </div>
            )}

            <form onSubmit={handleAddCompanySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Optional Company Logo Upload Field */}
              <CompanyLogoUpload
                companyName={companyFormData.name || 'New Company'}
                currentLogoUrl={companyFormData.logo_url}
                onLogoChange={({ dataUrl, filename, removed }) => {
                  setCompanyFormData(prev => ({
                    ...prev,
                    image_data: removed ? null : dataUrl,
                    image_filename: removed ? null : filename,
                    logo_url: removed ? null : prev.logo_url
                  }));
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Company Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nvidia, Google, Stripe"
                    value={companyFormData.name}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Industry <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={companyFormData.industry}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                    className="form-input"
                  >
                    {industriesList.map((ind, i) => (
                      <option key={i} value={ind}>{ind}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Placement Tier</label>
                  <select
                    value={companyFormData.tier}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, tier: e.target.value })}
                    className="form-input"
                  >
                    <option value="Tier 1">Tier 1 (Dream & Super Dream)</option>
                    <option value="Tier 2">Tier 2 (Core / IT)</option>
                    <option value="Mass">Mass Recruiter</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Headquarters / Office Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, India"
                    value={companyFormData.headquarters}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, headquarters: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Website URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={companyFormData.website}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Description / Company Overview</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of company domain, culture, and key tech stack..."
                  value={companyFormData.description}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, description: e.target.value })}
                  className="form-input"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCompany}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {submittingCompany ? 'Registering...' : 'Register Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT COMPANY MODAL */}
      {showEditCompanyModal && editingCompany && !isHOD && (
        <div className="modal-overlay" onClick={() => setShowEditCompanyModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CompanyLogo
                  src={editCompanyFormData.logo_url}
                  name={editCompanyFormData.name}
                  size={38}
                  borderRadius="10px"
                />
                <div>
                  <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: '#0F172A' }}>
                    Edit Company: {editingCompany.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Update company logo, branding, and details</p>
                </div>
              </div>
              <button onClick={() => setShowEditCompanyModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            {companyFeedback && (
              <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '0.78125rem', marginBottom: '14px' }}>
                ⚠ {companyFeedback}
              </div>
            )}

            <form onSubmit={handleEditCompanySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Optional Company Logo Upload with Replace & Remove */}
              <CompanyLogoUpload
                companyName={editCompanyFormData.name || editingCompany.name}
                currentLogoUrl={editCompanyFormData.logo_url}
                onLogoChange={({ dataUrl, filename, removed }) => {
                  if (removed) {
                    setEditCompanyFormData(prev => ({
                      ...prev,
                      logo_url: null,
                      image_data: null,
                      image_filename: null,
                      remove_logo: true
                    }));
                  } else {
                    setEditCompanyFormData(prev => ({
                      ...prev,
                      image_data: dataUrl,
                      image_filename: filename,
                      remove_logo: false
                    }));
                  }
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Company Name</label>
                  <input
                    type="text"
                    required
                    value={editCompanyFormData.name}
                    onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Industry</label>
                  <select
                    value={editCompanyFormData.industry}
                    onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, industry: e.target.value })}
                    className="form-input"
                  >
                    {industriesList.map((ind, i) => (
                      <option key={i} value={ind}>{ind}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Placement Tier</label>
                  <select
                    value={editCompanyFormData.tier}
                    onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, tier: e.target.value })}
                    className="form-input"
                  >
                    <option value="Tier 1">Tier 1 (Dream & Super Dream)</option>
                    <option value="Tier 2">Tier 2 (Core / IT)</option>
                    <option value="Mass">Mass Recruiter</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Headquarters / Location</label>
                  <input
                    type="text"
                    value={editCompanyFormData.headquarters}
                    onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, headquarters: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Website URL</label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={editCompanyFormData.website}
                  onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, website: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Company Description</label>
                <textarea
                  rows={3}
                  value={editCompanyFormData.description}
                  onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, description: e.target.value })}
                  className="form-input"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditCompanyModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCompany}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {updatingCompany ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE OPPORTUNITY WITH AI MODAL */}
      {showModal && !isHOD && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Create Opportunity with AI JD Analysis</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Paste unstructured job description or enter details</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* AI Paste Section */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
              <label style={{ fontSize: '0.78125rem', fontWeight: 800, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Bot size={15} color="#4F46E5" />
                <span>Paste Raw Job Description (AI Structuring Engine)</span>
              </label>
              <textarea
                rows={4}
                value={rawJdText}
                onChange={(e) => setRawJdText(e.target.value)}
                placeholder="Paste the company's hiring announcement, email, or JD text here. e.g. 'Google is hiring Software Engineers in Bengaluru for 30-45 LPA, requiring Python, DSA, SQL, Docker with CGPA >= 8.0'..."
                className="form-input"
                style={{ fontSize: '0.8125rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleAnalyzeJD}
                  disabled={isAnalyzing}
                  className="btn btn-primary btn-sm"
                >
                  <Sparkles size={14} />
                  <span>{isAnalyzing ? 'Analyzing with AI...' : 'Analyze with AI'}</span>
                </button>

                {analyzedSuccess && (
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} />
                    <span>Structured successfully by AI!</span>
                  </span>
                )}
              </div>
            </div>

            {/* Structured Form */}
            <form onSubmit={handleCreateOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Optional Company Logo Field */}
              <CompanyLogoUpload
                companyName={formData.company_name || 'Opportunity'}
                currentLogoUrl={formData.logo_url}
                onLogoChange={({ dataUrl, filename, removed }) => {
                  setFormData(prev => ({
                    ...prev,
                    image_data: removed ? null : dataUrl,
                    image_filename: removed ? null : filename,
                    logo_url: removed ? null : prev.logo_url
                  }));
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Role Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Min CTC (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 18 (or specify)"
                    value={formData.ctc_min}
                    onChange={(e) => setFormData({ ...formData, ctc_min: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Max CTC (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 32 (or specify)"
                    value={formData.ctc_max}
                    onChange={(e) => setFormData({ ...formData, ctc_max: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Min CGPA Cutoff</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={formData.min_cgpa}
                    onChange={(e) => setFormData({ ...formData, min_cgpa: parseFloat(e.target.value) })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Eligible Branches (comma separated)</label>
                  <input
                    type="text"
                    value={formData.eligible_branches.join(', ')}
                    onChange={(e) => setFormData({ ...formData, eligible_branches: e.target.value.split(',').map(b => b.trim()) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={formData.required_skills.join(', ')}
                  onChange={(e) => setFormData({ ...formData, required_skills: e.target.value.split(',').map(s => s.trim()) })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {submitting ? 'Publishing...' : 'Publish & Run Matching'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
