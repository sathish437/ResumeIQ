import React from 'react';
import {
  FileSearch,
  CheckCircle2,
  Edit3,
  BookOpen,
  Settings,
  Sparkles,
  ArrowLeft,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useResume } from '../context/useResume';
import type { NavigationTab } from '../types/resume';

interface ComingSoonPageProps {
  module: NavigationTab;
}

const MODULE_CONFIG: Record<
  string,
  {
    title: string;
    icon: React.ReactNode;
    description: string;
    plannedFeatures: string[];
  }
> = {
  'jd-match': {
    title: 'Job Description Match',
    icon: <FileSearch size={36} />,
    description:
      'Compare your uploaded resume against target job postings. Once the backend endpoint is implemented, this module will analyze skill overlap, detect missing qualifications, and suggest targeted alignment edits.',
    plannedFeatures: [
      'Side-by-side JD vs. Resume semantic comparison',
      'Targeted keyword and missing technical requirement discovery',
      'Tailored bullet point recommendations for job requirements',
      'Strict evidence grounding without fabricated metrics',
    ],
  },
  'ats-checker': {
    title: 'ATS Compliance Checker',
    icon: <CheckCircle2 size={36} />,
    description:
      'Evaluate your resume formatting against applicant tracking systems. This module is in active backend development to verify parseable section headers, contact information, and bullet point structure.',
    plannedFeatures: [
      'Section header parsing verification',
      'Contact details and links validation',
      'Font, table, and multi-column parsing diagnostics',
      'Actionable formatting advice without synthetic scoring',
    ],
  },
  editor: {
    title: 'Resume Bullet Point Editor',
    icon: <Edit3 size={36} />,
    description:
      'Refine your work experience and achievements with AI guidance. Will provide side-by-side editing, metric suggestions without fabrication, and version export once backend persistence is available.',
    plannedFeatures: [
      'Original vs. suggested bullet point comparison',
      'Action verb and impact strengthening suggestions',
      'User-controlled change approval prior to saving',
      'Export to PDF and DOCX format',
    ],
  },
  'interview-prep': {
    title: 'Interview Preparation',
    icon: <BookOpen size={36} />,
    description:
      'Generate personalized interview questions based strictly on your project and work experience history.',
    plannedFeatures: [
      'Behavioral questions customized to your background',
      'Technical deep-dive questions based on listed skills',
      'STAR method response structuring tips',
    ],
  },
  settings: {
    title: 'Settings & Integrations',
    icon: <Settings size={36} />,
    description:
      'Manage API keys, persistent storage options, and integration preferences.',
    plannedFeatures: [
      'Custom LLM temperature and model configuration',
      'Database connection preferences',
      'Session export and data purge controls',
    ],
  },
};

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ module }) => {
  const { setActiveTab } = useResume();
  const config = MODULE_CONFIG[module] || {
    title: 'Feature Under Development',
    icon: <Clock size={36} />,
    description: 'This feature is currently being developed.',
    plannedFeatures: [],
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto' }}>
      <div className="card" style={{ padding: '36px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {config.icon}
          </div>

          <span className="badge badge-warning" style={{ marginBottom: '12px', fontSize: '0.78rem' }}>
            <Clock size={12} />
            Backend Integration Pending
          </span>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            {config.title}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '580px', lineHeight: 1.6 }}>
            {config.description}
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            marginBottom: '28px',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Planned Capabilities
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {config.plannedFeatures.map((feat, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            className="btn btn-outline"
            onClick={() => setActiveTab('dashboard')}
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setActiveTab('analysis')}
          >
            <Sparkles size={16} />
            <span>View Active Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};
