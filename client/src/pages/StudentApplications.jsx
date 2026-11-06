import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Video,
  ChevronRight,
  ExternalLink,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  DollarSign,
  AlertCircle,
  Check,
  Building2
} from 'lucide-react';
import DonutChart from '../components/DonutChart';
import StageProgressBar from '../components/StageProgressBar';

export default function StudentApplications({ onNavigate, onPrepareRole }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    async function loadApps() {
      try {
        const token = localStorage.getItem('jobmatch_token');
        const res = await fetch('/api/applications/my-applications', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748B' }}>
        Loading applications pipeline...
      </div>
    );
  }

  const apps = data?.applications || [];
  const counts = data?.counts || { total: 6, under_review: 2, interviews: 2, offers: 1, not_selected: 1 };

  const filteredApps = apps.filter(app => {
    if (activeTab === 'all') return true;
    if (activeTab === 'under_review') return app.status === 'UNDER_REVIEW' || app.status === 'APPLIED';
    if (activeTab === 'interviews') return app.status === 'INTERVIEW_SCHEDULED';
    if (activeTab === 'offers') return app.status === 'OFFER_RECEIVED';
    if (activeTab === 'not_selected') return app.status === 'NOT_SELECTED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OFFER_RECEIVED':
        return <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Offer Received</span>;
      case 'INTERVIEW_SCHEDULED':
        return <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Interview Scheduled</span>;
      case 'UNDER_REVIEW':
      case 'APPLIED':
        return <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Under Review</span>;
      case 'NOT_SELECTED':
        return <span className="badge badge-red" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Not Selected</span>;
      default:
        return <span className="badge badge-gray" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>{status}</span>;
    }
  };

  const getTimelineSteps = (app) => {
    const status = app.status;
    const isOffer = status === 'OFFER_RECEIVED';
    const isInterview = status === 'INTERVIEW_SCHEDULED';
    const isRejected = status === 'NOT_SELECTED';
    const isUnderReview = status === 'UNDER_REVIEW' || status === 'APPLIED';

    return [
      {
        title: 'Application Submitted',
        desc: `Applied via JobMatch AI on ${app.applied_at ? app.applied_at.split(' ')[0] : '12 Aug 2026'}`,
        state: 'completed'
      },
      {
        title: 'Eligibility & Resume Screening',
        desc: 'Agent 50 verified GPA, academic criteria, and core skill match.',
        state: isUnderReview ? 'current' : 'completed'
      },
      {
        title: 'Shortlisting & Profile Review',
        desc: isRejected 
          ? 'Recruiter review concluded for this drive.' 
          : 'Candidate profile forwarded to technical hiring team.',
        state: isRejected ? 'rejected' : isInterview || isOffer ? 'completed' : 'pending'
      },
      {
        title: 'Technical & Behavioral Interviews',
        desc: isInterview 
          ? (app.round_name || 'Technical Round 1 scheduled')
          : isOffer 
            ? 'All interview evaluation rounds cleared with high rating.'
            : isRejected
              ? 'Interview process concluded.'
              : 'Pending completion of screening rounds.',
        state: isInterview ? 'current' : isOffer ? 'completed' : isRejected ? 'rejected' : 'pending'
      },
      {
        title: 'Final Placement Decision & Offer',
        desc: isOffer 
          ? `Formal Offer Letter issued: ${app.offered_ctc || app.ctc_display || '₹24 LPA'}`
          : isRejected 
            ? 'Application not selected for final offer.'
            : 'Final status will be announced post-interview round.',
        state: isOffer ? 'completed' : isRejected ? 'rejected' : 'pending'
      }
    ];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            My <span style={{ color: '#4F46E5' }}>Applications</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Track your progress, stay on top of deadlines, and ace your placement journey.
          </p>
        </div>

        <div className="font-script" style={{ color: '#4F46E5', fontSize: '1.25rem' }}>
          Apply • Prepare • Succeed
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileCheck2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{counts.total}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Total Applications</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>+2 this month</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{counts.under_review}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Under Review</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Awaiting response</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Video size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{counts.interviews}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Interviews Scheduled</div>
            <div style={{ fontSize: '0.6875rem', color: '#8B5CF6', fontWeight: 600 }}>Get ready!</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{counts.offers}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Offer Received</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>Keep going!</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Application Cards List vs Right Column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Filter Tabs & List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
            <button
              onClick={() => setActiveTab('all')}
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px' }}
            >
              <span>All ({counts.total})</span>
            </button>
            <button
              onClick={() => setActiveTab('under_review')}
              className={`btn btn-sm ${activeTab === 'under_review' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px' }}
            >
              <span>Under Review ({counts.under_review})</span>
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`btn btn-sm ${activeTab === 'interviews' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px' }}
            >
              <span>Interviews ({counts.interviews})</span>
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`btn btn-sm ${activeTab === 'offers' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px' }}
            >
              <span>Offers ({counts.offers})</span>
            </button>
            <button
              onClick={() => setActiveTab('not_selected')}
              className={`btn btn-sm ${activeTab === 'not_selected' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px' }}
            >
              <span>Not Selected ({counts.not_selected})</span>
            </button>
          </div>

          {/* Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredApps.map((app) => {
              const isInterview = app.status === 'INTERVIEW_SCHEDULED';
              const isOffer = app.status === 'OFFER_RECEIVED';

              return (
                <div
                  key={app.id}
                  className="card"
                  style={{
                    padding: '18px 24px',
                    display: 'grid',
                    gridTemplateColumns: '290px 1fr 160px',
                    alignItems: 'center',
                    gap: '24px',
                    border: isInterview ? '1.5px solid #C7D2FE' : isOffer ? '1.5px solid #A7F3D0' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onClick={() => setSelectedApp(app)}
                >
                  {/* Left: Logo & Job details (Strictly 290px aligned) */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', width: '290px', overflow: 'hidden' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '7px',
                      flexShrink: 0
                    }}>
                      <img src={app.company_logo} alt={app.company_name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {app.job_title}
                      </h3>
                      <div style={{ fontSize: '0.78125rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{app.company_name}</span>
                        <span>•</span>
                        <span>{app.role_type}</span>
                        <span>•</span>
                        <span>{app.job_location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Stage Step Progress Bar (Strictly centered in 1fr) */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <StageProgressBar
                      currentStage={app.stage_progress || (isOffer ? 4 : isInterview ? 3 : 2)}
                      status={app.status}
                    />
                  </div>

                  {/* Right: Date & Details action (Strictly 160px aligned) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', width: '160px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} color="#94A3B8" />
                      <span>Applied {app.applied_at ? app.applied_at.split(' ')[0] : '2026-08-12'}</span>
                    </div>

                    {isInterview ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.78125rem', fontWeight: 700 }}
                      >
                        <Video size={13} />
                        <span>Interview Details</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.78125rem', fontWeight: 600 }}
                      >
                        <span>View Status</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Application Status Donut & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Donut Overview */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '14px' }}>Application Status Overview</h4>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              <DonutChart
                size={120}
                strokeWidth={12}
                totalCount={6}
                totalLabel="Applications"
                showLegend={true}
                data={[
                  { label: 'Offer Received', count: counts.offers, color: '#10B981' },
                  { label: 'Under Review', count: counts.under_review, color: '#3B82F6' },
                  { label: 'Interviews', count: counts.interviews, color: '#8B5CF6' },
                  { label: 'Not Selected', count: counts.not_selected, color: '#EF4444' }
                ]}
              />
            </div>
          </div>

          {/* Application Timeline */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '14px' }}>Recent Activity Timeline</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {apps.slice(0, 4).map((app, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedApp(app)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78125rem', cursor: 'pointer', padding: '4px 0' }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{app.company_name} - {app.job_title}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{app.applied_at ? app.applied_at.split(' ')[0] : 'Recent'}</div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive "View Status" / Application Details Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: '28px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={selectedApp.company_logo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                    {selectedApp.job_title}
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>{selectedApp.company_name}</span>
                    <span>•</span>
                    <span>{selectedApp.job_location}</span>
                    <span>•</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>{selectedApp.ctc_display || '₹24 LPA'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                  fontWeight: 800
                }}
              >
                ✕
              </button>
            </div>

            {/* Current Stage Highlight Box */}
            <div style={{
              padding: '16px 20px',
              borderRadius: '16px',
              backgroundColor: selectedApp.status === 'OFFER_RECEIVED' ? '#ECFDF5' : selectedApp.status === 'INTERVIEW_SCHEDULED' ? '#EEF2FF' : selectedApp.status === 'NOT_SELECTED' ? '#FEF2F2' : '#F8FAFC',
              border: selectedApp.status === 'OFFER_RECEIVED' ? '1.5px solid #86EFAC' : selectedApp.status === 'INTERVIEW_SCHEDULED' ? '1.5px solid #C7D2FE' : selectedApp.status === 'NOT_SELECTED' ? '1.5px solid #FECACA' : '1.5px solid #E2E8F0',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Application Status
                </div>
                {getStatusBadge(selectedApp.status)}
              </div>

              {selectedApp.status === 'OFFER_RECEIVED' && (
                <div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#065F46', marginBottom: '4px' }}>
                    🎉 Formal Offer Letter Issued!
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#047857', lineHeight: 1.4 }}>
                    Congratulations! {selectedApp.company_name} has finalized your selection for the {selectedApp.job_title} role with an annual CTC of <strong>{selectedApp.offered_ctc || selectedApp.ctc_display || '₹28 LPA'}</strong>.
                  </div>
                </div>
              )}

              {selectedApp.status === 'INTERVIEW_SCHEDULED' && (
                <div>
                  <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '6px' }}>
                    {selectedApp.round_name || 'Technical Round 1 (DSA & Architecture)'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78125rem', color: '#4338CA', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span>📅 {selectedApp.scheduled_time || '15 Sep 2026, 10:00 AM IST'}</span>
                    <span>📹 {selectedApp.interview_mode || 'Google Meet (Virtual)'}</span>
                  </div>
                  <a
                    href={selectedApp.meeting_link || 'https://meet.google.com/rvc-job-match'}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Video size={14} />
                    <span>Join Scheduled Meet</span>
                  </a>
                </div>
              )}

              {(selectedApp.status === 'UNDER_REVIEW' || selectedApp.status === 'APPLIED') && (
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                    Profile Screening in Progress
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.4 }}>
                    Your resume and verified Agent 50 assessment have been submitted to the placement drive coordinator. Estimated feedback window: 3–5 business days.
                  </div>
                </div>
              )}

              {selectedApp.status === 'NOT_SELECTED' && (
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#991B1B', marginBottom: '4px' }}>
                    Application Cycle Concluded
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#7F1D1D', lineHeight: 1.4 }}>
                    The hiring quota for this drive has closed. Agent 50 recommends reviewing the skill gaps identified for {selectedApp.job_title} to prepare for upcoming campus drives.
                  </div>
                </div>
              )}
            </div>

            {/* Step Timeline */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
                Application Stage Timeline
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '8px' }}>
                {getTimelineSteps(selectedApp).map((step, sIdx) => {
                  const isDone = step.state === 'completed';
                  const isCur = step.state === 'current';
                  const isRej = step.state === 'rejected';

                  return (
                    <div key={sIdx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', position: 'relative' }}>
                      {/* Step Marker */}
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isDone ? '#10B981' : isCur ? '#4F46E5' : isRej ? '#EF4444' : '#E2E8F0',
                        color: isDone || isCur || isRej ? '#FFFFFF' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: '2px',
                        boxShadow: isCur ? '0 0 0 4px rgba(79, 70, 229, 0.2)' : 'none'
                      }}>
                        {isDone ? <Check size={14} /> : isRej ? <XCircle size={14} /> : sIdx + 1}
                      </div>

                      {/* Step Text */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: isCur ? '#4F46E5' : isRej ? '#991B1B' : '#0F172A' }}>
                          {step.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '18px' }}>
              {onPrepareRole && (
                <button
                  onClick={() => {
                    const targetJob = {
                      id: selectedApp.job_opening_id,
                      title: selectedApp.job_title,
                      company_name: selectedApp.company_name
                    };
                    setSelectedApp(null);
                    onPrepareRole(targetJob);
                  }}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <BookOpen size={16} />
                  <span>Prepare for this Role</span>
                </button>
              )}
              <button
                onClick={() => setSelectedApp(null)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
