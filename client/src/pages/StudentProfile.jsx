import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Mail,
  Globe,
  Code2,
  Edit,
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  BookOpen,
  Target,
  CheckCircle2,
  Bookmark,
  Phone,
  Upload,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  FolderGit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/SyncContext';

export default function StudentProfile({ onNavigate }) {
  const { user } = useAuth();
  const { syncVersion, notifyMutation } = useDataSync();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    phone: '',
    location: 'Bengaluru, India',
    linkedin_url: '',
    github_url: '',
    avatar_url: ''
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/students/profile', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
        if (resData.student) {
          setEditForm({
            full_name: resData.student.full_name || 'Subbu K',
            bio: resData.student.bio || 'Computer Science undergraduate passionate about building scalable backend systems, cloud architectures, and machine learning solutions.',
            phone: resData.student.phone || '+91 98765 43210',
            location: resData.student.location || 'Bengaluru, India',
            linkedin_url: resData.student.linkedin_url || 'https://linkedin.com/in/subbu-k',
            github_url: resData.student.github_url || 'https://github.com/subbu-k',
            avatar_url: resData.student.avatar_url || ''
          });
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [syncVersion]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatar_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('jobmatch_token');
      const res = await fetch('/api/students/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setShowEditModal(false);
        notifyMutation('STUDENT_PROFILE_UPDATED', editForm);
        await loadProfile();
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748B' }}>
        Loading student career profile...
      </div>
    );
  }

  const student = data?.student || {};
  const skills = data?.skills || [
    { skill_name: 'Python', score: 92, category: 'Languages' },
    { skill_name: 'React.js', score: 88, category: 'Frameworks' },
    { skill_name: 'Node.js', score: 86, category: 'Backend' },
    { skill_name: 'SQL & Database Design', score: 90, category: 'Databases' },
    { skill_name: 'Docker & Kubernetes', score: 78, category: 'Cloud & DevOps' },
    { skill_name: 'System Design', score: 82, category: 'Architecture' }
  ];
  const projects = data?.projects || [
    {
      title: 'Agentic AI Job Matching Engine',
      description: 'Distributed AI ranking engine that analyzes candidate skill vectors against recruiter JDs using cosine similarity and SQLite.',
      tech_stack: ['Python', 'Node.js', 'React', 'SQLite', 'Docker'],
      github_url: 'https://github.com/subbu-k/job-matching-agent'
    },
    {
      title: 'High-Throughput E-Commerce API',
      description: 'Microservices architecture with Redis caching, PostgreSQL sharding, and OAuth2 authentication handling 50k req/min.',
      tech_stack: ['Golang', 'Docker', 'Redis', 'PostgreSQL'],
      github_url: 'https://github.com/subbu-k/ecommerce-backend'
    }
  ];
  const stats = data?.stats || { total_applications: 6, interviews_scheduled: 2, learning_hours: 36, skills_improved: 4, profile_completeness: 94 };

  const getInitials = (name) => {
    if (!name) return 'SK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getSkillScore = (score) => {
    if (score === undefined || score === null) return 85;
    const num = Number(score);
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      {/* Top Banner Card */}
      <div className="card" style={{ padding: '28px 32px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            {editForm.avatar_url || student.avatar_url ? (
              <img
                src={editForm.avatar_url || student.avatar_url}
                alt={student.full_name || 'Subbu K'}
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #EEF2FF', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.15)' }}
              />
            ) : (
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                border: '4px solid #EEF2FF',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.15)'
              }}>
                {getInitials(student.full_name || 'Subbu K')}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {student.full_name || 'Subbu K'}
                </h1>
                <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                  CSE • Class of 2027
                </span>
                <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                  Placement Ready ✓
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600, marginTop: '6px' }}>
                {student.department || 'Computer Science Engineering'} • USN: {student.usn || '1RV23CS184'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem', color: '#64748B', marginTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#4F46E5" /> {student.location || 'Bengaluru, India'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={13} color="#4F46E5" /> {student.email || 'subbu.cs23@rvce.edu.in'}
                </span>
                {student.linkedin_url && (
                  <a href={student.linkedin_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
                    <Globe size={13} /> LinkedIn
                  </a>
                )}
                {student.github_url && (
                  <a href={student.github_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', textDecoration: 'none', fontWeight: 600 }}>
                    <FolderGit2 size={13} /> GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowEditModal(true)}
            className="btn btn-primary" 
            style={{ borderRadius: '12px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Edit size={15} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Tab Navigation (All 6 Tabs) */}
        <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #F1F5F9', marginTop: '24px', paddingTop: '16px', fontSize: '0.875rem', fontWeight: 700, overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'skills', label: 'Skills & Readiness' },
            { id: 'education', label: 'Education' },
            { id: 'experience', label: 'Experience & Projects' },
            { id: 'achievements', label: 'Achievements & Badges' },
            { id: 'goals', label: 'Career Goals' }
          ].map(tab => (
            <span
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                color: activeTab === tab.id ? '#4F46E5' : '#64748B',
                borderBottom: activeTab === tab.id ? '2.5px solid #4F46E5' : '2.5px solid transparent',
                paddingBottom: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Column 1: About Me & Quick Education */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '22px', borderRadius: '18px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '10px', color: '#0F172A' }}>About Me</h3>
              <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6 }}>
                {student.bio || 'I am a Computer Science undergraduate passionate about building scalable backend systems, cloud architectures, and machine learning solutions.'}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
                <span className="badge badge-blue">Backend Specialist</span>
                <span className="badge badge-purple">Cloud Architect</span>
                <span className="badge badge-green">Agentic AI</span>
                <span className="badge badge-gray">Problem Solver</span>
              </div>
            </div>

            <div className="card" style={{ padding: '22px', borderRadius: '18px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '12px', color: '#0F172A' }}>Academic Summary</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>B.E. Computer Science & Engineering</div>
                  <div style={{ fontSize: '0.78125rem', color: '#64748B' }}>RV College of Engineering, Bengaluru</div>
                  <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700, marginTop: '4px' }}>
                    CGPA: {student.cgpa || '8.80'} / 10.0 • No Backlogs
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Key Skills & Featured Projects */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '22px', borderRadius: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Technical Skills</h3>
                <span 
                  onClick={() => setActiveTab('skills')}
                  style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}
                >
                  View All →
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {skills.slice(0, 6).map((s, idx) => {
                  const scoreVal = getSkillScore(s.score);
                  return (
                    <div key={idx} style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>{s.skill_name}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5' }}>{scoreVal}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: '22px', borderRadius: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Featured Projects</h3>
                <span 
                  onClick={() => setActiveTab('experience')}
                  style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}
                >
                  Details →
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {projects.slice(0, 2).map((p, idx) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.84375rem', fontWeight: 800, color: '#0F172A' }}>{p.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', lineHeight: 1.4 }}>{p.description}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {(Array.isArray(p.tech_stack) ? p.tech_stack : ['React', 'Node.js']).map((t, tIdx) => (
                        <span key={tIdx} style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#EEF2FF', color: '#4F46E5', fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Placement Readiness & Career Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '22px', borderRadius: '18px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Agent 50 Readiness</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'conic-gradient(#4F46E5 0% 88%, #E2E8F0 88% 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px'
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 800, color: '#4F46E5' }}>
                    88%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>High Readiness</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Top 10% in Department</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Technical Competency</span>
                  <strong style={{ color: '#0F172A' }}>92%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Coding & DSA</span>
                  <strong style={{ color: '#0F172A' }}>88%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>System Design</span>
                  <strong style={{ color: '#0F172A' }}>84%</strong>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '22px', borderRadius: '18px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Verified Credentials</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78125rem', color: '#334155' }}>
                  <ShieldCheck size={16} color="#10B981" />
                  <span>RVCE Placement Cell Verified</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78125rem', color: '#334155' }}>
                  <Award size={16} color="#4F46E5" />
                  <span>AWS Certified Solutions Architect</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78125rem', color: '#334155' }}>
                  <Sparkles size={16} color="#7C3AED" />
                  <span>Smart India Hackathon Finalist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SKILLS */}
      {activeTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '28px', borderRadius: '20px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                Skills & Technical Proficiency
              </h3>
              <p style={{ fontSize: '0.84375rem', color: '#64748B' }}>
                Evaluated by Agent 50 through GitHub analysis, academic assessments, and mock coding evaluations.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {skills.map((s, idx) => {
                const scoreVal = getSkillScore(s.score);
                const level = s.proficiency_level || (scoreVal >= 90 ? 'Expert' : scoreVal >= 80 ? 'Advanced' : 'Proficient');
                const levelColor = scoreVal >= 90 ? '#059669' : scoreVal >= 80 ? '#4F46E5' : '#0284C7';
                return (
                  <div key={idx} style={{ padding: '18px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>{s.skill_name}</div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '3px 8px', borderRadius: '999px' }}>
                        {scoreVal}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', borderRadius: '999px', backgroundColor: '#E2E8F0', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{ width: `${scoreVal}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71875rem', color: '#64748B' }}>
                      <span>Category: {s.category || 'Core Skill'}</span>
                      <span style={{ color: levelColor, fontWeight: 700 }}>
                        {level}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EDUCATION */}
      {activeTab === 'education' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>
              Academic Background
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* College Card */}
              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0', display: 'flex', gap: '18px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <GraduationCap size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A' }}>
                        Bachelor of Engineering (B.E.) in Computer Science & Engineering
                      </h4>
                      <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                        RV College of Engineering (RVCE), Bengaluru
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '4px 12px', borderRadius: '999px' }}>
                      2023 — 2027 (Expected)
                    </span>
                  </div>

                  <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Cumulative GPA</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#059669' }}>8.80 / 10.0</div>
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Standing</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#4F46E5' }}>First Class with Distinction</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      Key Relevant Coursework
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['Data Structures & Algorithms', 'Database Management Systems', 'Operating Systems', 'Computer Networks', 'Cloud Computing', 'Artificial Intelligence', 'Software Engineering'].map((c, i) => (
                        <span key={i} style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXPERIENCE */}
      {activeTab === 'experience' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>
              Experience & Projects
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Internship */}
              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Software Engineering Intern</h4>
                      <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>CloudScale Technologies • Bengaluru, India</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700, backgroundColor: '#EEF2FF', padding: '3px 10px', borderRadius: '999px' }}>
                      May 2025 — Jul 2025
                    </span>
                  </div>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.8125rem', color: '#475569', marginTop: '10px', lineHeight: 1.6 }}>
                    <li>Engineered asynchronous REST APIs in Node.js & Express, reducing p99 latency by 32%.</li>
                    <li>Designed PostgreSQL indexing strategies and Redis caching layers for high-throughput search.</li>
                    <li>Collaborated in agile sprint cycles and wrote integration test suites with 90%+ code coverage.</li>
                  </ul>
                </div>
              </div>

              {/* Projects */}
              {projects.map((p, pIdx) => (
                <div key={pIdx} style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FolderGit2 size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{p.title}</h4>
                      {p.github_url && (
                        <a href={p.github_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                          <Github size={13} /> GitHub Repo
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '6px', lineHeight: 1.5 }}>
                      {p.description}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {(Array.isArray(p.tech_stack) ? p.tech_stack : []).map((t, i) => (
                        <span key={i} style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155', fontSize: '0.71875rem', fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>
              Honors, Certifications & Badges
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Smart India Hackathon Winner</h4>
                  <div style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '2px' }}>Ministry of Education • 1st Place National Level</div>
                  <div style={{ fontSize: '0.71875rem', color: '#059669', fontWeight: 700, marginTop: '6px' }}>Dec 2025</div>
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>AWS Certified Solutions Architect</h4>
                  <div style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '2px' }}>Amazon Web Services (Associate Level)</div>
                  <div style={{ fontSize: '0.71875rem', color: '#059669', fontWeight: 700, marginTop: '6px' }}>Credential ID: AWS-981247</div>
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Top 5% LeetCode Global Rating</h4>
                  <div style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '2px' }}>Knight Badge • 450+ Algorithmic Problems Solved</div>
                  <div style={{ fontSize: '0.71875rem', color: '#059669', fontWeight: 700, marginTop: '6px' }}>Rating: 1980</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GOALS */}
      {activeTab === 'goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>
              Career Goals & Placement Preferences
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>Target Roles</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Full Stack Software Engineer', 'Cloud / Backend Engineer', 'Machine Learning Engineer', 'Systems Developer'].map((r, i) => (
                    <span key={i} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '0.78125rem', fontWeight: 700 }}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>Preferred Locations</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Bengaluru, India', 'Hyderabad, India', 'Pune, India', 'Remote / Hybrid'].map((l, i) => (
                    <span key={i} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', fontSize: '0.78125rem', fontWeight: 700 }}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>Compensation Aspiration</h4>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4F46E5', marginBottom: '4px' }}>
                  ₹20 LPA — ₹35 LPA
                </div>
                <div style={{ fontSize: '0.78125rem', color: '#64748B' }}>
                  Full-Time Campus Drive Placement Target
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: '28px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Edit Career Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#64748B', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Photo Upload Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                {editForm.avatar_url ? (
                  <img
                    src={editForm.avatar_url}
                    alt="Preview"
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4F46E5' }}
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem' }}>
                    {getInitials(editForm.full_name)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Profile Picture</div>
                  <label 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '6px 14px', 
                      borderRadius: '8px', 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #CBD5E1', 
                      fontSize: '0.78125rem', 
                      fontWeight: 600, 
                      cursor: 'pointer' 
                    }}
                  >
                    <Upload size={13} />
                    <span>Upload Custom Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  required
                />
              </div>

              {/* Bio */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Bio / About</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.84375rem', resize: 'vertical' }}
                />
              </div>

              {/* Phone & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                  />
                </div>
              </div>

              {/* LinkedIn & GitHub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>LinkedIn URL</label>
                  <input
                    type="url"
                    value={editForm.linkedin_url}
                    onChange={(e) => setEditForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>GitHub URL</label>
                  <input
                    type="url"
                    value={editForm.github_url}
                    onChange={(e) => setEditForm(prev => ({ ...prev, github_url: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
