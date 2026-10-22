import React from 'react';
import {
  LayoutDashboard,
  Upload,
  Sparkles,
  MessageSquare,
  FileSearch,
  CheckCircle2,
  Edit3,
  BookOpen,
  Settings,
  FileText,
  RotateCcw,
  X,
  Bot,
} from 'lucide-react';
import { useResume } from '../../context/useResume';
import type { NavigationTab } from '../../types/resume';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, currentResume, handleReset } = useResume();

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('dashboard');
            }}
            className="brand-badge"
          >
            <div className="brand-icon-box">
              <Bot size={22} />
            </div>
            <div>
              <div className="brand-title">
                ResumeIQ
                <span className="brand-tag">AI</span>
              </div>
            </div>
          </a>
          <button
            className="mobile-menu-btn"
            onClick={onCloseMobile}
            aria-label="Close menu"
            style={{ color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <div>
            <div className="nav-section-title">Core Platform</div>
            <ul className="nav-list">
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dashboard')}
                >
                  <LayoutDashboard size={18} className="nav-icon" />
                  <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'upload' ? 'active' : ''}`}
                  onClick={() => handleNavClick('upload')}
                >
                  <Upload size={18} className="nav-icon" />
                  <span>Upload Resume</span>
                  {currentResume && (
                    <span className="nav-item-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      Ready
                    </span>
                  )}
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                  onClick={() => handleNavClick('analysis')}
                >
                  <Sparkles size={18} className="nav-icon" />
                  <span>Resume Analysis</span>
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => handleNavClick('chat')}
                >
                  <MessageSquare size={18} className="nav-icon" />
                  <span>AI Resume Chat</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="nav-section-title">Upcoming Features</div>
            <ul className="nav-list">
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'jd-match' ? 'active' : ''}`}
                  onClick={() => handleNavClick('jd-match')}
                >
                  <FileSearch size={18} className="nav-icon" />
                  <span>JD Match</span>
                  <span className="nav-item-badge">Soon</span>
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'ats-checker' ? 'active' : ''}`}
                  onClick={() => handleNavClick('ats-checker')}
                >
                  <CheckCircle2 size={18} className="nav-icon" />
                  <span>ATS Checker</span>
                  <span className="nav-item-badge">Soon</span>
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'editor' ? 'active' : ''}`}
                  onClick={() => handleNavClick('editor')}
                >
                  <Edit3 size={18} className="nav-icon" />
                  <span>Resume Editor</span>
                  <span className="nav-item-badge">Soon</span>
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'interview-prep' ? 'active' : ''}`}
                  onClick={() => handleNavClick('interview-prep')}
                >
                  <BookOpen size={18} className="nav-icon" />
                  <span>Interview Prep</span>
                  <span className="nav-item-badge">Soon</span>
                </button>
              </li>
              <li>
                <button
                  className={`nav-item-btn ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => handleNavClick('settings')}
                >
                  <Settings size={18} className="nav-icon" />
                  <span>Settings</span>
                  <span className="nav-item-badge">Soon</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="sidebar-footer">
          {currentResume ? (
            <div className="active-resume-card">
              <div className="active-resume-label">
                <span>ACTIVE RESUME</span>
                <span className="badge badge-success" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                  {currentResume.fileType}
                </span>
              </div>
              <div className="active-resume-name" title={currentResume.filename}>
                {currentResume.filename}
              </div>
              <div className="active-resume-stats">
                {currentResume.segmentCount} {currentResume.fileType === 'PDF' ? 'pages' : 'segments'} • {currentResume.characterCount.toLocaleString()} chars
              </div>
              <button
                className="btn btn-outline"
                style={{
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  marginTop: '4px',
                  color: '#94a3b8',
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                  width: '100%',
                }}
                onClick={handleReset}
                title="Reset session and upload a new resume"
              >
                <RotateCcw size={12} />
                <span>New Resume / Reset</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(30, 41, 59, 0.3)',
                border: '1px dashed rgba(148, 163, 184, 0.2)',
                textAlign: 'center',
              }}
            >
              <FileText size={20} style={{ color: '#64748b', margin: '0 auto 6px auto', display: 'block' }} />
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                No resume selected
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '5px 12px', fontSize: '0.75rem', marginTop: '8px', width: '100%' }}
                onClick={() => handleNavClick('upload')}
              >
                Upload Now
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
