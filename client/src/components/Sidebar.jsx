import React from 'react';
import {
  Home,
  Target,
  Briefcase,
  BookOpen,
  FileCheck2,
  User,
  Settings,
  LogOut,
  Users,
  GraduationCap,
  BarChart3,
  FileText,
  MessageSquare,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activePage, currentView, onNavigate, isCollapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const role = user?.role || 'STUDENT';
  const currentPage = activePage || currentView;

  // 1. Student Navigation (Exact items from approved screenshots + Opportunities discovery)
  const studentNav = [
    { id: 'student-dashboard', label: 'Overview', icon: Home },
    { id: 'student-opportunities', label: 'Opportunities', icon: Compass },
    { id: 'student-matches', label: 'My Matches', icon: Target },
    { id: 'preparation-center', label: 'Preparation', icon: BookOpen },
    { id: 'student-applications', label: 'Applications', icon: FileCheck2 },
    { id: 'student-profile', label: 'My Profile', icon: User }
  ];

  // 2. Training & Placement Cell Navigation (Full operational management)
  const tpNav = [
    { id: 'tp-dashboard', label: 'Dashboard', icon: Home },
    { id: 'tp-students', label: 'Students', icon: Users },
    { id: 'tp-placements', label: 'Placements', icon: GraduationCap },
    { id: 'tp-opportunities', label: 'Events & Opportunities', icon: Briefcase }
  ];

  // 3. Head of Department Navigation (Strictly Read-Only institutional intelligence)
  const hodNav = [
    { id: 'tp-dashboard', label: 'Overview', icon: Home },
    { id: 'tp-students', label: 'Students', icon: Users },
    { id: 'tp-placements', label: 'Placements', icon: GraduationCap },
    { id: 'tp-opportunities', label: 'Opportunities', icon: Briefcase }
  ];

  const navItems = role === 'STUDENT' ? studentNav : role === 'HOD' ? hodNav : tpNav;

  // Inspirational quotes
  const quote = role === 'STUDENT'
    ? { title: '"Consistent Learning Leads to Greater Opportunities."', subtitle: 'Keep progressing every day.' }
    : role === 'HOD'
      ? { title: '"Stronger Students, Stronger Departments."', subtitle: 'Department Placement Intelligence' }
      : { title: '"Empowering Students. Building Tomorrow\'s Leaders."', subtitle: 'Placement & Career Intelligence' };

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-wrapper">
          <div className="sidebar-logo-icon" style={{ padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', width: '36px', height: '36px' }}>
            <img src="/career-sync-icon.png" alt="CareerSync" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!isCollapsed && (
            <div className="sidebar-brand-text">
              <h2 className="sidebar-title" style={{ fontSize: '1.1875rem', fontWeight: 800, color: '#8DC21F', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                CareerSync
              </h2>
              <div className="sidebar-subtitle">
                <span className="sidebar-agent-badge" style={{ color: '#A3E635' }}>
                  Agent 50
                </span>
                <span className="sidebar-dot">•</span>
                <span className="sidebar-role-name">
                  {role === 'STUDENT' ? 'Student Portal' : role === 'HOD' ? 'HOD (Read Only)' : 'Institution Panel'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="sidebar-collapse-btn"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* HOD Read-Only Pill */}
      {role === 'HOD' && !isCollapsed && (
        <div style={{ padding: '0 16px', marginTop: '10px' }}>
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '6px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.6875rem',
            color: '#FBBF24',
            fontWeight: 600
          }}>
            <Eye size={12} />
            <span>Read-Only Department View</span>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <div className="sidebar-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || (item.id === 'student-opportunities' && currentPage === 'opportunity-details');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="sidebar-icon" />
              {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Quote & User / Logout Actions */}
      <div className="sidebar-footer">
        {/* Quote Card (Hidden when collapsed) */}
        {!isCollapsed && (
          <div className="sidebar-quote-card">
            <p className="font-script" style={{ color: '#E2E8F0', fontSize: '0.9375rem', lineHeight: 1.3 }}>
              {quote.title}
            </p>
            <p style={{ color: '#64748B', fontSize: '0.6875rem', marginTop: '4px' }}>
              {quote.subtitle}
            </p>
          </div>
        )}

        {/* User / Logout Controls */}
        <div className={`sidebar-user-controls ${isCollapsed ? 'collapsed' : ''}`}>
          {role === 'STUDENT' ? (
            <button
              onClick={() => onNavigate('student-profile')}
              className="sidebar-footer-btn"
              title="Profile"
            >
              <User size={16} />
              {!isCollapsed && <span>Profile</span>}
            </button>
          ) : role === 'T_AND_P' ? (
            <button
              onClick={() => onNavigate('tp-settings')}
              className="sidebar-footer-btn"
              title="Settings"
            >
              <Settings size={16} />
              {!isCollapsed && <span>Settings</span>}
            </button>
          ) : (
            <div className="sidebar-readonly-badge" title="Read-Only Mode">
              <Eye size={14} />
              {!isCollapsed && <span>Read-Only</span>}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title="Logout"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
