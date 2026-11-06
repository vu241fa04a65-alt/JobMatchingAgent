import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Building2,
  Lock,
  User,
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Globe,
  Target
} from 'lucide-react';
import DonutChart from '../components/DonutChart';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/SyncContext';

export default function TPStudents({ onNavigate }) {
  const { user } = useAuth();
  const { syncVersion, notifyMutation } = useDataSync();
  const isHOD = user?.role === 'HOD';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    email: '',
    usn: '',
    branch: 'CSE',
    cgpa: '8.50',
    graduation_year: '2027',
    password: 'Student@123'
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // View Student Profile Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/students', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [syncVersion]);

  const handleOpenProfile = async (std) => {
    setSelectedStudent(std);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch(`/api/students/${std.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const pData = await res.json();
        setStudentDetails(pData);
      }
    } catch (err) {
      console.error('Error fetching student profile details:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (isHOD) return;

    setSubmitting(true);
    setFeedbackMsg('');
    try {
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');

      setShowAddModal(false);
      setNewStudent({
        full_name: '',
        email: '',
        usn: '',
        branch: 'CSE',
        cgpa: '8.50',
        graduation_year: '2027',
        password: 'Student@123'
      });
      notifyMutation('STUDENT_CREATED', { usn: newStudent.usn });
      await loadStudents();
      alert('Student account successfully created!');
    } catch (err) {
      setFeedbackMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = students.filter(s => {
    if (activeTab !== 'All' && s.placement_status !== activeTab && s.status !== activeTab) return false;
    if (branchFilter !== 'All' && s.branch !== branchFilter) return false;
    if (yearFilter !== 'All' && String(s.graduation_year) !== yearFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.full_name?.toLowerCase().includes(q);
      const matchUSN = s.usn?.toLowerCase().includes(q);
      const matchEmail = s.email?.toLowerCase().includes(q);
      if (!matchName && !matchUSN && !matchEmail) return false;
    }
    return true;
  });

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748B' }}>
        Loading student roster...
      </div>
    );
  }

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
              Student Management
            </h1>
            {isHOD && (
              <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={12} />
                <span>Read-Only View</span>
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Comprehensive database of registered students, skill proficiencies, and placement readiness.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isHOD && (
            <button
              onClick={() => { setShowAddModal(true); setFeedbackMsg(''); }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '10px 18px' }}
            >
              <Plus size={16} />
              <span>Add Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid with responsive minWidth boundaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '20px', alignItems: 'start', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* Left Column: Table & Filters */}
        <div className="card" style={{ padding: '24px', minWidth: 0, overflow: 'hidden' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px', overflowX: 'auto' }}>
            {['All', 'Placement Ready', 'In Preparation', 'Placed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '10px', fontSize: '0.78125rem', whiteSpace: 'nowrap' }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by name, USN, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '0.8125rem' }}
              />
            </div>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="form-input"
              style={{ width: '130px', fontSize: '0.78125rem' }}
            >
              <option value="All">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="ISE">ISE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="ME">ME</option>
              <option value="AI_ML">AI / ML</option>
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="form-input"
              style={{ width: '130px', fontSize: '0.78125rem' }}
            >
              <option value="All">All Batches</option>
              <option value="2027">Class of 2027</option>
              <option value="2026">Class of 2026</option>
              <option value="2025">Class of 2025</option>
            </select>
          </div>

          {/* Student Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>USN</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Key Skills</th>
                  <th>Readiness</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((std) => (
                  <tr key={std.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenProfile(std)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {std.avatar_url ? (
                          <img
                            src={std.avatar_url}
                            alt={std.full_name}
                            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            flexShrink: 0
                          }}>
                            {getInitials(std.full_name)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8125rem' }}>{std.full_name}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{std.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.78125rem', color: '#334155' }}>{std.usn}</td>
                    <td><span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>{std.branch}</span></td>
                    <td style={{ fontWeight: 800, color: '#0F172A' }}>{std.cgpa}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '160px' }}>
                        {(std.skills || []).slice(0, 2).map((sk, i) => (
                          <span key={i} className="badge badge-blue" style={{ fontSize: '0.625rem' }}>{sk}</span>
                        ))}
                        {(std.skills || []).length > 2 && (
                          <span className="badge badge-gray" style={{ fontSize: '0.625rem' }}>+{(std.skills || []).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '90px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${std.overall_readiness_score || 75}%`,
                              height: '100%',
                              backgroundColor: (std.overall_readiness_score || 75) >= 80 ? '#10B981' : (std.overall_readiness_score || 75) >= 60 ? '#3B82F6' : '#F59E0B',
                              borderRadius: '999px'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700 }}>{std.overall_readiness_score || 75}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        std.placement_status === 'Placed' ? 'badge-green' : std.placement_status === 'Placement Ready' ? 'badge-blue' : 'badge-amber'
                      }`} style={{ fontSize: '0.6875rem' }}>
                        {std.placement_status || 'Placement Ready'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenProfile(std); }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.6875rem', padding: '4px 8px', borderRadius: '8px' }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Student Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '12px' }}>Student Insights</h4>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
              <DonutChart
                size={120}
                strokeWidth={12}
                totalCount={students.length}
                totalLabel="Students"
                showLegend={true}
                data={[
                  { label: 'Ready', count: students.filter(s => (s.overall_readiness_score || 75) >= 80).length, color: '#10B981' },
                  { label: 'In Prep', count: students.filter(s => (s.overall_readiness_score || 75) >= 65 && (s.overall_readiness_score || 75) < 80).length, color: '#3B82F6' },
                  { label: 'Needs Attention', count: students.filter(s => (s.overall_readiness_score || 75) < 65).length, color: '#F59E0B' }
                ]}
              />
            </div>
          </div>

          {/* Branch-wise Distribution */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '12px' }}>Branch-wise Count</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['CSE', 'ISE', 'ECE', 'EEE', 'ME', 'AI_ML'].map(b => {
                const count = students.filter(s => s.branch === b).length;
                return (
                  <div key={b} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{b} Engineering</span>
                    <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>{count} students</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* View Student Profile Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: '28px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800
                }}>
                  {getInitials(selectedStudent.full_name)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                    {selectedStudent.full_name}
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>{selectedStudent.branch} Engineering</span>
                    <span>•</span>
                    <span>USN: {selectedStudent.usn}</span>
                    <span>•</span>
                    <span style={{ color: '#4F46E5', fontWeight: 700 }}>CGPA: {selectedStudent.cgpa}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
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

            {profileLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading profile information...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Academic & Readiness Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700 }}>CGPA</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{selectedStudent.cgpa}</div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700 }}>Readiness</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>{selectedStudent.overall_readiness_score || 82}%</div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700 }}>Applications</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>{studentDetails?.applications?.length || 0}</div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700 }}>Offers</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{studentDetails?.offers?.length || 0}</div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Verified Skills</h4>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(studentDetails?.skills || selectedStudent.skills || []).map((sk, idx) => (
                      <span key={idx} className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                        {typeof sk === 'string' ? sk : sk.skill_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Applications & Placement Progress */}
                {studentDetails?.applications && studentDetails.applications.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Active Placement Drives</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {studentDetails.applications.map(app => (
                        <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{app.company_name}</span>
                            <span style={{ color: '#64748B', marginLeft: '6px' }}>– {app.job_title}</span>
                          </div>
                          <span className={`badge ${app.status === 'OFFER_RECEIVED' ? 'badge-green' : app.status === 'INTERVIEW_SCHEDULED' ? 'badge-purple' : 'badge-blue'}`}>
                            {app.current_stage || app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && !isHOD && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '24px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Onboard New Student</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>

            {feedbackMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '14px' }}>
                {feedbackMsg}
              </div>
            )}

            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Gupta"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>USN</label>
                  <input
                    type="text"
                    required
                    placeholder="1RV23CS999"
                    value={newStudent.usn}
                    onChange={(e) => setNewStudent({ ...newStudent, usn: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    placeholder="8.50"
                    value={newStudent.cgpa}
                    onChange={(e) => setNewStudent({ ...newStudent, cgpa: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>Branch</label>
                  <select
                    value={newStudent.branch}
                    onChange={(e) => setNewStudent({ ...newStudent, branch: e.target.value })}
                    className="form-input"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ISE">ISE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="ME">ME</option>
                    <option value="AI_ML">AI / ML</option>
                    <option value="BT">BT</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>Graduation Year</label>
                  <select
                    value={newStudent.graduation_year}
                    onChange={(e) => setNewStudent({ ...newStudent, graduation_year: e.target.value })}
                    className="form-input"
                  >
                    <option value="2027">Class of 2027</option>
                    <option value="2026">Class of 2026</option>
                    <option value="2025">Class of 2025</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>College Email</label>
                <input
                  type="email"
                  required
                  placeholder="student@rvce.edu.in"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {submitting ? 'Registering...' : 'Save & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
