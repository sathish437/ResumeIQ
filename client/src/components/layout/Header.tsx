import React from 'react';
import { Menu, FileText, Sun, Moon, LogOut, User } from 'lucide-react';
import { useResume } from '../../context/useResume';
import { useTheme } from '../../context/useTheme';
import { useAuth } from '../../context/useAuth';
import type { NavigationTab } from '../../types/resume';

interface HeaderProps {
  onOpenMobile: () => void;
}

const TAB_TITLES: Record<NavigationTab, string> = {
  dashboard: 'Dashboard',
  analysis: 'Resume Analysis',
  chat: 'AI Resume Chat',
  'skill-gap': 'Skill Gap & Tech Stack Analysis',
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const { activeTab, currentResume } = useResume();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const currentTitle = TAB_TITLES[activeTab] || 'Dashboard';

  return (
    <header className="top-header" role="banner">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-breadcrumbs">
          <span className="breadcrumb-active">{currentTitle}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Active Resume Status Badge */}
        {currentResume ? (
          <div
            className="badge badge-primary header-resume-badge"
            style={{ padding: '5px 10px', fontSize: '0.78rem', gap: '6px' }}
            title={`Active: ${currentResume.filename}`}
          >
            <FileText size={13} />
            <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentResume.filename}
            </span>
          </div>
        ) : (
          <div
            className="badge badge-gray header-resume-badge"
            style={{ padding: '5px 10px', fontSize: '0.76rem', gap: '6px' }}
          >
            <FileText size={13} />
            <span>No Resume</span>
          </div>
        )}

        {/* Engine Status Indicator */}
        <div className="status-indicator header-status-indicator" title="ResumeIQ AI Engine Online">
          <span className="status-dot" />
          <span>Online</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Profile & Sign Out */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '6px',
              borderLeft: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
              title={`${user.name} (${user.email})`}
            >
              {user.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  <User size={13} />
                </div>
              )}
              <span
                className="header-user-name"
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name.split(' ')[0]}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '0.74rem' }}
              onClick={logout}
              title="Sign out of ResumeIQ"
              aria-label="Sign out"
            >
              <LogOut size={13} />
              <span className="header-signout-text">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

