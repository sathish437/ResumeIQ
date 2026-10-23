import React from 'react';
import {
  Sparkles,
  MessageSquare,
  FileText,
  ArrowRight,
  CheckCircle,
  FileCheck2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { useResume } from '../context/useResume';
import { FormattedAiResponse } from '../components/common/FormattedAiResponse';

export const DashboardPage: React.FC = () => {
  const { currentResume, analysis, setActiveTab } = useResume();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
          padding: '28px 32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span
              className="badge badge-primary"
              style={{ marginBottom: '10px' }}
            >
              ResumeIQ Platform
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Intelligent, Evidence-Grounded Resume Analysis
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', maxWidth: '640px', lineHeight: 1.6 }}>
              Upload your resume in PDF or DOCX format to receive structured intelligence, extract explicit skills, identify missing details, and converse with our AI assistant.
            </p>
          </div>
          <div>
            {!currentResume ? (
              <button
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                onClick={() => setActiveTab('analysis')}
              >
                <Upload size={18} />
                <span>Upload & Analyze Resume</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('analysis')}
                >
                  <Sparkles size={16} />
                  <span>{analysis ? 'View Resume Analysis' : 'Run Analysis'}</span>
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare size={16} />
                  <span>AI Resume Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Resume Context Card */}
      {currentResume ? (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <FileCheck2 size={20} style={{ color: 'var(--primary-600)' }} />
                <span>Active Resume Context</span>
              </div>
              <div className="card-subtitle">
                Current document available for conversational Q&A and structured intelligence.
              </div>
            </div>
            <span className="badge badge-success">
              <CheckCircle size={12} />
              Processed Successfully
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              backgroundColor: 'var(--slate-50)',
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FILENAME</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px', wordBreak: 'break-all' }}>
                {currentResume.filename}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DOCUMENT FORMAT</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                {currentResume.fileType} ({currentResume.segmentCount} {currentResume.fileType === 'PDF' ? 'pages' : 'segments'})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXTRACTED CHARACTERS</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                {currentResume.characterCount.toLocaleString()} characters
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UPLOADED AT</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                {new Date(currentResume.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('analysis')}
            >
              <Sparkles size={16} />
              <span>{analysis ? 'View Resume Analysis' : 'Run Resume Analysis'}</span>
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={16} />
              <span>Ask AI About This Resume</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={32} />
            </div>
            <h2 className="empty-state-title">No Resume Uploaded Yet</h2>
            <p className="empty-state-desc">
              To begin analyzing your credentials, extract explicit technical skills, and converse with the AI assistant, upload a PDF or DOCX file.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('analysis')}
              style={{ padding: '12px 24px' }}
            >
              <Upload size={18} />
              <span>Go to Resume Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* Analysis Preview Card if Analysis is available */}
      {analysis && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Sparkles size={20} style={{ color: 'var(--primary-600)' }} />
                <span>Recent Analysis Summary</span>
              </div>
              <div className="card-subtitle">
                Generated based strictly on document evidence.
              </div>
            </div>
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setActiveTab('analysis')}
            >
              <span>Full Details</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              PROFESSIONAL SUMMARY
            </div>
            <FormattedAiResponse content={analysis.professionalSummary} />
          </div>

          {analysis.skills && analysis.skills.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                DETECTED SKILLS ({analysis.skills.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.skills.slice(0, 10).map((skill, i) => (
                  <span key={i} className="badge badge-primary">
                    {skill}
                  </span>
                ))}
                {analysis.skills.length > 10 && (
                  <span className="badge badge-gray">+{analysis.skills.length - 10} more</span>
                )}
              </div>
            </div>
          )}

          {analysis.missingOrUnavailableInformation && analysis.missingOrUnavailableInformation.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber-700)', fontWeight: 600, fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>Identified Missing or Unclear Details ({analysis.missingOrUnavailableInformation.length})</span>
              </div>
              <ul style={{ paddingLeft: '24px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {analysis.missingOrUnavailableInformation.slice(0, 3).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 3-Step Guided Workflow */}
      <div style={{ marginTop: '10px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
          How ResumeIQ Works
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                marginBottom: '14px',
              }}
            >
              1
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Document Extraction</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Upload your PDF or DOCX file. The Spring Boot backend securely parses text and divides content into page or paragraph segments without making AI calls during upload.
            </p>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--emerald-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                marginBottom: '14px',
              }}
            >
              2
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Evidence-Based Analysis</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Trigger structured analysis to extract explicit skills, projects with technologies, and education. Identifies missing details without fabricating metrics or ungrounded claims.
            </p>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                marginBottom: '14px',
              }}
            >
              3
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Conversational AI Chat</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Ask questions about your resume. The assistant cites exact source references (e.g. Page 1) and maintains conversation memory across follow-up queries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
