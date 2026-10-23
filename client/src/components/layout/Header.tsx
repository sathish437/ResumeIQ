import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, FileText } from 'lucide-react';
import { useResume } from '../../context/useResume';
import type { NavigationTab } from '../../types/resume';

interface HeaderProps {
  onOpenMobile: () => void;
}

const TAB_TITLES: Record<NavigationTab, { title: string; section: string }> = {
  dashboard: { title: 'Dashboard', section: 'Overview' },
  analysis: { title: 'Resume Analysis', section: 'Intelligence' },
  chat: { title: 'AI Resume Chat', section: 'Conversations' },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const { activeTab, currentResume } = useResume();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('resumeiq_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('resumeiq_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const currentTabInfo = TAB_TITLES[activeTab] || { title: 'Dashboard', section: 'Overview' };

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobile}
          aria-label="Open mobile menu"
        >
          <Menu size={22} />
        </button>
        <div className="header-breadcrumbs">
          <span>{currentTabInfo.section}</span>
          <span style={{ color: 'var(--text-subtle)' }}>/</span>
          <span className="breadcrumb-active">{currentTabInfo.title}</span>
        </div>
      </div>

      <div className="header-right">
        {currentResume ? (
          <div
            className="badge badge-primary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
            title={`Active: ${currentResume.filename}`}
          >
            <FileText size={14} />
            <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentResume.filename}
            </span>
          </div>
        ) : (
          <div
            className="badge badge-gray"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
          >
            <FileText size={14} />
            <span>No Resume Loaded</span>
          </div>
        )}

        <div className="status-indicator" title="Connected to ResumeIQ Spring Boot Engine">
          <span className="status-dot"></span>
          <span>Engine Online</span>
        </div>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
};
