import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import TopNavbar from './components/TopNavbar';
import Sidebar from './components/Sidebar';
import SantraAIChat from './components/SantraAIChat';

// Public Pages
import LandingPage from './pages/LandingPage';
import PortalsPage from './pages/PortalsPage';
import LoginPage from './pages/LoginPage';

// Student Portal Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentOpportunities from './pages/StudentOpportunities';
import StudentMatches from './pages/StudentMatches';
import OpportunityDetails from './pages/OpportunityDetails';
import PreparationCenter from './pages/PreparationCenter';
import StudentApplications from './pages/StudentApplications';
import StudentProfile from './pages/StudentProfile';

// Institution (T&P and HOD) Portal Pages
import TPDashboard from './pages/TPDashboard';
import TPStudents from './pages/TPStudents';
import TPPlacements from './pages/TPPlacements';
import TPOpportunities from './pages/TPOpportunities';
import TPCandidateRanking from './pages/TPCandidateRanking';
import TPUnmatchedStudents from './pages/TPUnmatchedStudents';
import TPLearningSkills from './pages/TPLearningSkills';
import TPAnalytics from './pages/TPAnalytics';
import TPSettings from './pages/TPSettings';
import AgentOpsLogs from './pages/AgentOpsLogs';

const pathToView = (path) => {
  const cleanPath = (path || '').toLowerCase().replace(/\/+$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '/landing') return 'landing';
  if (cleanPath === '/portal' || cleanPath === '/portals') return 'portals';
  if (cleanPath === '/login') return 'login';
  if (cleanPath === '/opportunities') return 'student-opportunities';
  if (cleanPath === '/matches' || cleanPath === '/my-matches') return 'student-matches';
  if (cleanPath === '/opportunity-details') return 'opportunity-details';
  if (cleanPath === '/preparation' || cleanPath === '/preparation-center') return 'preparation-center';
  if (cleanPath === '/applications' || cleanPath === '/my-applications') return 'student-applications';
  if (cleanPath === '/profile' || cleanPath === '/my-profile') return 'student-profile';
  if (cleanPath === '/dashboard' || cleanPath === '/overview') return 'student-dashboard';
  if (cleanPath === '/institution' || cleanPath === '/institution/dashboard') return 'tp-dashboard';
  if (cleanPath === '/institution/students' || cleanPath === '/students') return 'tp-students';
  if (cleanPath === '/institution/placements' || cleanPath === '/placements') return 'tp-placements';
  if (cleanPath === '/institution/opportunities') return 'tp-opportunities';
  if (cleanPath === '/institution/candidate-ranking' || cleanPath === '/candidate-ranking') return 'tp-candidate-ranking';
  if (cleanPath === '/institution/unmatched' || cleanPath === '/unmatched') return 'tp-unmatched';
  if (cleanPath === '/institution/learning' || cleanPath === '/institution/learning-skills' || cleanPath === '/learning-skills') return 'tp-learning';
  if (cleanPath === '/institution/analytics' || cleanPath === '/analytics') return 'tp-analytics';
  if (cleanPath === '/institution/settings' || cleanPath === '/settings') return 'tp-settings';
  if (cleanPath === '/agentops') return 'agentops';
  return 'landing';
};

const viewToPath = (view) => {
  switch (view) {
    case 'landing': return '/landing';
    case 'portals': return '/portal';
    case 'login': return '/login';
    case 'student-dashboard': return '/dashboard';
    case 'student-opportunities': return '/opportunities';
    case 'student-matches': return '/matches';
    case 'opportunity-details': return '/opportunity-details';
    case 'preparation-center': return '/preparation';
    case 'student-applications': return '/applications';
    case 'student-profile': return '/profile';
    case 'tp-dashboard': return '/institution/dashboard';
    case 'tp-students': return '/institution/students';
    case 'tp-placements': return '/institution/placements';
    case 'tp-opportunities': return '/institution/opportunities';
    case 'tp-candidate-ranking': return '/institution/candidate-ranking';
    case 'tp-unmatched': return '/institution/unmatched';
    case 'tp-learning': return '/institution/learning-skills';
    case 'tp-analytics': return '/institution/analytics';
    case 'tp-settings': return '/institution/settings';
    case 'agentops': return '/agentops';
    default: return '/landing';
  }
};

function MainApp() {
  const { user, isAuthenticated, loading, isStudent, isTP, isHOD } = useAuth();
  
  // Navigation & Layout state initialized from URL
  const [currentView, setCurrentView] = useState(() => pathToView(window.location.pathname));
  const [loginRole, setLoginRole] = useState('STUDENT');
  const [selectedJobId, setSelectedJobId] = useState(1);
  const [rankingJobId, setRankingJobId] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('jobmatch_sidebar_collapsed') === 'true';
  });

  const navigate = (view, pushHistory = true) => {
    setCurrentView(view);
    if (pushHistory) {
      const urlPath = viewToPath(view);
      if (window.location.pathname !== urlPath) {
        window.history.pushState({ view }, '', urlPath);
      }
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('jobmatch_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const view = pathToView(window.location.pathname);
      setCurrentView(view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync view when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      if (currentView === 'landing' || currentView === 'portals' || currentView === 'login') {
        const defaultView = isStudent ? 'student-dashboard' : 'tp-dashboard';
        navigate(defaultView, true);
      }
    } else {
      if (currentView !== 'login' && currentView !== 'landing' && currentView !== 'portals') {
        navigate('landing', false);
      }
    }
  }, [isAuthenticated, isStudent, isTP, isHOD]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.9375rem' }}>
        Initialising JobMatch AI Intelligence...
      </div>
    );
  }

  // 1. Unauthenticated Public Flow
  if (!isAuthenticated) {
    if (currentView === 'login') {
      return (
        <LoginPage 
          initialRole={loginRole}
          onLoginSuccess={(targetView) => {
            if (targetView) navigate(targetView);
            else if (user?.role === 'STUDENT') navigate('student-dashboard');
            else navigate('tp-dashboard');
          }}
          onBackToLanding={() => navigate('portals')}
        />
      );
    }

    if (currentView === 'portals') {
      return (
        <PortalsPage 
          initialRole={loginRole}
          onSelectPortal={(portalRole) => {
            setLoginRole(portalRole || 'STUDENT');
            navigate('login');
          }}
          onBackToLanding={() => navigate('landing')}
        />
      );
    }

    return (
      <LandingPage 
        onGetStarted={() => navigate('portals')}
        onOpenLogin={(role) => {
          setLoginRole(role || 'STUDENT');
          navigate('login');
        }}
        onSelectPortal={(portalRole) => {
          if (portalRole) setLoginRole(portalRole);
          navigate('portals');
        }}
      />
    );
  }

  // Helper callbacks
  const handleViewJob = (jobId) => {
    setSelectedJobId(jobId);
    navigate('opportunity-details');
  };

  const handleViewCandidateRanking = (jobId) => {
    setRankingJobId(jobId);
    navigate('tp-candidate-ranking');
  };

  // 2. Role-Isolated Content Renderer
  const renderContent = () => {
    // --- A. Student Role Isolation ---
    if (isStudent) {
      switch (currentView) {
        case 'student-dashboard':
          return <StudentDashboard onNavigate={navigate} onViewJob={handleViewJob} />;
        case 'student-opportunities':
          return <StudentOpportunities onViewJob={handleViewJob} onPrepareRole={() => navigate('preparation-center')} />;
        case 'student-matches':
          return <StudentMatches onViewJob={handleViewJob} onNavigate={navigate} />;
        case 'opportunity-details':
          return (
            <OpportunityDetails 
              jobId={selectedJobId} 
              onBack={() => navigate('student-opportunities')} 
              onNavigate={navigate}
              onPrepareRole={() => navigate('preparation-center')}
            />
          );
        case 'preparation-center':
          return <PreparationCenter onNavigate={navigate} />;
        case 'student-applications':
          return <StudentApplications onNavigate={navigate} onPrepareRole={() => navigate('preparation-center')} />;
        case 'student-profile':
          return <StudentProfile onNavigate={navigate} />;
        default:
          return <StudentDashboard onNavigate={navigate} onViewJob={handleViewJob} />;
      }
    }

    // --- B. Head of Department (HOD) Role Isolation (Strictly Read-Only) ---
    if (isHOD) {
      switch (currentView) {
        case 'tp-dashboard':
          return <TPDashboard onNavigate={navigate} />;
        case 'tp-students':
          return <TPStudents onNavigate={navigate} />;
        case 'tp-placements':
          return <TPPlacements onNavigate={navigate} />;
        case 'tp-opportunities':
          return <TPOpportunities onViewCandidates={(jobId) => { setRankingJobId(jobId); navigate('tp-candidate-ranking'); }} onNavigate={navigate} />;
        case 'tp-candidate-ranking':
          return <TPCandidateRanking initialJobId={rankingJobId} onNavigate={navigate} />;
        case 'tp-learning':
          return <TPLearningSkills onNavigate={navigate} />;
        case 'tp-analytics':
          return <TPAnalytics onNavigate={navigate} />;
        case 'tp-settings':
          return <TPSettings onNavigate={navigate} />;
        default:
          return <TPDashboard onNavigate={navigate} />;
      }
    }

    // --- C. Training & Placement (T&P) Role Isolation ---
    if (isTP) {
      switch (currentView) {
        case 'tp-dashboard':
          return <TPDashboard onNavigate={navigate} />;
        case 'tp-students':
          return <TPStudents onNavigate={navigate} />;
        case 'tp-placements':
          return <TPPlacements onNavigate={navigate} />;
        case 'tp-opportunities':
          return <TPOpportunities onViewCandidates={handleViewCandidateRanking} onNavigate={navigate} />;
        case 'tp-candidate-ranking':
          return <TPCandidateRanking initialJobId={rankingJobId} onNavigate={navigate} />;
        case 'tp-unmatched':
          return <TPUnmatchedStudents onNavigate={navigate} />;
        case 'tp-learning':
          return <TPLearningSkills onNavigate={navigate} />;
        case 'tp-analytics':
          return <TPAnalytics onNavigate={navigate} />;
        case 'tp-settings':
          return <TPSettings onNavigate={navigate} />;
        case 'agentops':
          return <AgentOpsLogs />;
        default:
          return <TPDashboard onNavigate={navigate} />;
      }
    }

    return <div className="card p-6 text-center text-slate-500">Access Denied: Unrecognized role authentication.</div>;
  };

  // 3. Unified Layout Shell (Zero top whitespace, non-overlapping sidebar)
  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Role-Specific Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={navigate} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Viewport */}
      <div className="main-content">
        <TopNavbar />
        <main className="content-area">
          {renderContent()}
        </main>
      </div>

      {/* SantraAI Floating Assistant */}
      <SantraAIChat />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <MainApp />
      </SyncProvider>
    </AuthProvider>
  );
}
