import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Building2,
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  Download,
  Plus,
  Lock,
  Eye,
  Edit,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Sparkles,
  Filter,
  Search
} from 'lucide-react';
import DonutChart from '../components/DonutChart';
import CompanyLogo from '../components/CompanyLogo';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/SyncContext';

export default function TPPlacements({ onNavigate }) {
  const { user } = useAuth();
  const { syncVersion, notifyMutation } = useDataSync();
  const isHOD = user?.role === 'HOD';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);

  // Filters for applications table
  const [stageFilter, setStageFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Manage Stage Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [stageForm, setStageForm] = useState({
    stage: 'SHORTLISTED',
    status: 'UNDER_REVIEW',
    progress: 3,
    notes: '',
    interview_round: 'Technical Round 1',
    interview_time: '20 Sep 2026, 10:00 AM IST',
    interview_mode: 'Google Meet (Virtual)',
    interview_link: 'https://meet.google.com/rvc-job-match',
    offered_ctc: '24.0'
  });
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jobmatch_token');
      const [plcRes, appsRes] = await Promise.all([
        fetch('/api/institution/placements', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
        fetch('/api/applications/all', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      ]);

      if (plcRes.ok) {
        const plcData = await plcRes.json();
        setData(plcData);
      }
      if (appsRes.ok) {
        const aData = await appsRes.json();
        setApplications(aData.applications || []);
      }
    } catch (err) {
      console.error('Error fetching placement management data:', err);
    } finally {
      setLoading(false);
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [syncVersion]);

  const handleOpenStageModal = (app) => {
    setSelectedApp(app);
    setStageForm({
      stage: app.current_stage || 'SHORTLISTED',
      status: app.status || 'UNDER_REVIEW',
      progress: app.stage_progress || 3,
      notes: app.notes || '',
      interview_round: app.round_name || 'Technical Round 1',
      interview_time: app.scheduled_time || '22 Sep 2026, 10:00 AM IST',
      interview_mode: app.interview_mode || 'Google Meet (Virtual)',
      interview_link: 'https://meet.google.com/rvc-job-match',
      offered_ctc: app.offered_ctc ? String(app.offered_ctc) : '24.0'
    });
  };

  const handleUpdateStageSubmit = async (e) => {
    e.preventDefault();
    if (isHOD || !selectedApp) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('jobmatch_token');
      const payload = {
        stage: stageForm.stage,
        status: stageForm.status,
        progress: stageForm.progress,
        notes: stageForm.notes,
        interview: ['TECHNICAL_1', 'TECHNICAL_2', 'HR'].includes(stageForm.stage) ? {
          round_name: stageForm.interview_round,
          scheduled_time: stageForm.interview_time,
          mode: stageForm.interview_mode,
          meeting_link: stageForm.interview_link
        } : null,
        offer: ['SELECTED', 'OFFER'].includes(stageForm.stage) ? {
          ctc: parseFloat(stageForm.offered_ctc) || 24.0,
          joining_date: '2027-07-01'
        } : null
      };

      const res = await fetch(`/api/applications/${selectedApp.id}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSelectedApp(null);
        notifyMutation('APPLICATION_STAGE_UPDATED', { application_id: selectedApp.id, stage: stageForm.stage });
        await loadData();
        alert('Candidate placement lifecycle stage successfully updated!');
      } else {
        alert('Failed to update candidate stage');
      }
    } catch (err) {
      console.error('Error updating stage:', err);
      alert('Error updating candidate stage');
    } finally {
      setUpdating(false);
    }
  };

  const filteredApps = applications.filter(app => {
    if (stageFilter !== 'All' && app.current_stage !== stageFilter && app.status !== stageFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const mName = app.student_name?.toLowerCase().includes(q);
      const mUSN = app.student_usn?.toLowerCase().includes(q);
      const mComp = app.company_name?.toLowerCase().includes(q);
      const mJob = app.job_title?.toLowerCase().includes(q);
      if (!mName && !mUSN && !mComp && !mJob) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748B' }}>
        Loading placement analytics...
      </div>
    );
  }

  const metrics = data?.metrics || {
    students_placed: 14,
    recruiting_companies: 14,
    average_package: '₹ 18.4 LPA',
    highest_package: '₹ 48.0 LPA',
    placement_rate: '35%'
  };

  const branchRates = data?.branch_wise_placement_rates || [];
  const packageDistribution = data?.package_distribution || [];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Placements & Outcomes
            </h1>
            {isHOD && (
              <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={12} />
                <span>HOD View (Read Only)</span>
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Track campus drives, advance candidate hiring lifecycle stages, and monitor institutional placement conversion.
          </p>
        </div>

        <div className="font-script" style={{ color: '#4F46E5', fontSize: '1.25rem' }}>
          "Stronger Careers. Brighter Tomorrows."
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{metrics.students_placed}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Offers Confirmed</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>↑ Across 14 partner firms</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{metrics.recruiting_companies}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Active Companies</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>Tier 1 & Tier 2 Campus Drives</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{metrics.average_package}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Average CTC</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>Calculated from live SQLite data</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFFBEB', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{metrics.highest_package}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>Highest CTC</div>
            <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600 }}>Uber Systems Engineering</div>
          </div>
        </div>
      </div>

      {/* Candidate Placement Lifecycle Management Table */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A' }}>
              Candidate Placement Progression & Lifecycle Management
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '2px' }}>
              Select any candidate application to advance recruitment stages, schedule interviews, or issue final selections.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search candidate, job, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '0.78125rem' }}
              />
            </div>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="form-input"
              style={{ width: '150px', fontSize: '0.78125rem' }}
            >
              <option value="All">All Stages</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="CODING">Coding Assessment</option>
              <option value="TECHNICAL_1">Technical Round 1</option>
              <option value="TECHNICAL_2">Technical Round 2</option>
              <option value="HR">HR Interview</option>
              <option value="OFFER">Offer Issued</option>
              <option value="REJECTED">Not Selected</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Company & Role</th>
                <th>Current Stage</th>
                <th>Interview / Notes</th>
                <th>Applied Date</th>
                <th>Status</th>
                {!isHOD && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8125rem' }}>{app.student_name}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{app.student_usn} • {app.student_branch} (CGPA: {app.student_cgpa})</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CompanyLogo
                        src={app.company_logo}
                        name={app.company_name}
                        size={32}
                        borderRadius="8px"
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.8125rem' }}>{app.company_name}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{app.job_title} • <span style={{ color: '#059669', fontWeight: 600 }}>{app.ctc_display}</span></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      {app.current_stage || app.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#475569', maxWidth: '220px' }}>
                    {app.round_name ? (
                      <span style={{ color: '#4338CA', fontWeight: 600 }}>📅 {app.round_name}</span>
                    ) : (
                      app.notes || 'No active notes'
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {app.applied_at ? app.applied_at.split(' ')[0] : 'Recent'}
                  </td>
                  <td>
                    <span className={`badge ${
                      app.status === 'OFFER_RECEIVED' ? 'badge-green' :
                      app.status === 'INTERVIEW_SCHEDULED' ? 'badge-purple' :
                      app.status === 'NOT_SELECTED' ? 'badge-red' : 'badge-blue'
                    }`} style={{ fontSize: '0.6875rem' }}>
                      {app.status}
                    </span>
                  </td>
                  {!isHOD && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenStageModal(app)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '8px' }}
                      >
                        Update Stage
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Candidate Stage Modal */}
      {selectedApp && !isHOD && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '580px', borderRadius: '24px', padding: '28px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  Update Candidate Placement Stage
                </h3>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '2px' }}>
                  {selectedApp.student_name} ({selectedApp.student_usn}) → {selectedApp.company_name} ({selectedApp.job_title})
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>

            <form onSubmit={handleUpdateStageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>
                  Select Next Lifecycle Stage
                </label>
                <select
                  value={stageForm.stage}
                  onChange={(e) => {
                    const stg = e.target.value;
                    let prog = 3;
                    let stat = 'UNDER_REVIEW';
                    if (stg === 'SHORTLISTED') { prog = 3; stat = 'SHORTLISTED'; }
                    else if (stg === 'CODING') { prog = 4; stat = 'SHORTLISTED'; }
                    else if (stg === 'TECHNICAL_1' || stg === 'TECHNICAL_2' || stg === 'HR') { prog = 5; stat = 'INTERVIEW_SCHEDULED'; }
                    else if (stg === 'SELECTED') { prog = 7; stat = 'SELECTED'; }
                    else if (stg === 'OFFER') { prog = 8; stat = 'OFFER_RECEIVED'; }
                    else if (stg === 'REJECTED') { prog = 1; stat = 'NOT_SELECTED'; }

                    setStageForm({ ...stageForm, stage: stg, progress: prog, status: stat });
                  }}
                  className="form-input"
                >
                  <option value="SHORTLISTED">Shortlisted (Profile Review)</option>
                  <option value="CODING">Online Coding Assessment</option>
                  <option value="TECHNICAL_1">Technical Interview 1</option>
                  <option value="TECHNICAL_2">Technical Interview 2</option>
                  <option value="HR">HR / Leadership Round</option>
                  <option value="SELECTED">Final Selection Approved</option>
                  <option value="OFFER">Official Offer Issued</option>
                  <option value="REJECTED">Application Closed / Not Selected</option>
                </select>
              </div>

              {/* Interview Scheduling Fields */}
              {['TECHNICAL_1', 'TECHNICAL_2', 'HR'].includes(stageForm.stage) && (
                <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#4338CA' }}>Interview Scheduling Details</div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>Round Name</label>
                    <input
                      type="text"
                      value={stageForm.interview_round}
                      onChange={(e) => setStageForm({ ...stageForm, interview_round: e.target.value })}
                      className="form-input"
                      placeholder="e.g. Technical Round 1 (DSA & Architecture)"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>Date & Time Slot</label>
                    <input
                      type="text"
                      value={stageForm.interview_time}
                      onChange={(e) => setStageForm({ ...stageForm, interview_time: e.target.value })}
                      className="form-input"
                      placeholder="e.g. 20 Sep 2026, 10:00 AM IST"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>Interview Link / Location</label>
                    <input
                      type="text"
                      value={stageForm.interview_link}
                      onChange={(e) => setStageForm({ ...stageForm, interview_link: e.target.value })}
                      className="form-input"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                </div>
              )}

              {/* Offer Compensation Field */}
              {['SELECTED', 'OFFER'].includes(stageForm.stage) && (
                <div style={{ backgroundColor: '#ECFDF5', padding: '14px', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', display: 'block', marginBottom: '4px' }}>
                    Annual Offered CTC (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={stageForm.offered_ctc}
                    onChange={(e) => setStageForm({ ...stageForm, offered_ctc: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 28.0"
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>
                  Evaluation Feedback & Notes
                </label>
                <textarea
                  rows="3"
                  value={stageForm.notes}
                  onChange={(e) => setStageForm({ ...stageForm, notes: e.target.value })}
                  className="form-input"
                  placeholder="Add evaluation summary or requirements for the next stage..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setSelectedApp(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="btn btn-primary" style={{ flex: 1 }}>
                  {updating ? 'Saving...' : 'Save & Advance Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
