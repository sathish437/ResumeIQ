import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  FileText,
  RotateCcw,
  X,
  Bot,
  Target,
  LogOut,
  User,
} from 'lucide-react';
import { useResume } from '../../context/useResume';
import { useAuth } from '../../context/useAuth';
import type { NavigationTab } from '../../types/resume';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analysis', label: 'Resume Analysis', icon: Sparkles },
  { id: 'chat', label: 'AI Resume Chat', icon: MessageSquare },
  { id: 'skill-gap', label: 'Skill Gap & Tech Stack Analysis', icon: Target },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, currentResume, handleReset } = useResume();
  const { user, logout } = useAuth();

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
              <Bot size={18} />
            </div>
            <div>
              <div className="brand-title">
                ResumeIQ
                <span className="brand-tag">AI</span>
              </div>
            </div>
          </a>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onCloseMobile}
            aria-label="Close menu"
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-content">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAnalysis = item.id === 'analysis';

              return (
                <li key={item.id} style={{ position: 'relative' }}>
                  <motion.button
                    type="button"
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    whileTap={{ scale: 0.98 }}
                    style={{ position: 'relative', zIndex: 1, minHeight: '44px' }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBackground"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--primary-subtle)',
                          border: '1px solid var(--primary-border)',
                          zIndex: -1,
                        }}
                      />
                    )}
                    <Icon size={17} className="nav-icon" />
                    <span>{item.label}</span>

                    {isAnalysis && currentResume && (
                      <span className="nav-item-badge">
                        Ready
                      </span>
                    )}
                  </motion.button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sidebar-footer">
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '10px',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {user.pictureUrl ? (
                  <img
                    src={user.pictureUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    <User size={14} />
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.66rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={user.email}
                  >
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '4px 6px', flexShrink: 0 }}
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}

          {currentResume ? (
            <div className="active-resume-card">
              <div className="active-resume-label">
                <span>ACTIVE RESUME</span>
                <span className="badge badge-gray" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
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
                type="button"
                className="btn btn-outline"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  marginTop: '4px',
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
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                textAlign: 'center',
              }}
            >
              <FileText size={18} style={{ color: 'var(--text-subtle)', margin: '0 auto 6px auto', display: 'block' }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                No resume selected
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '5px 12px', fontSize: '0.74rem', marginTop: '8px', width: '100%' }}
                onClick={() => handleNavClick('analysis')}
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

export default Sidebar;
