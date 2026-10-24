import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  MessageSquare,
  FileText,
  ArrowRight,
  FileCheck2,
  AlertCircle,
  Upload,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { useResume } from '../context/useResume';
import { FormattedAiResponse } from '../components/common/FormattedAiResponse';

export const DashboardPage: React.FC = () => {
  const { currentResume, analysis, skillGapAnalysis, setActiveTab } = useResume();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Hero Banner */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'var(--hero-gradient)',
          borderColor: 'var(--primary-border)',
          padding: '28px 32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-primary">
                Evidence-Grounded Intelligence
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: '6px' }}>
              ResumeIQ Platform
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '640px', lineHeight: 1.55, margin: 0 }}>
              Extract verified skills and project credentials from PDF or DOCX resumes, benchmark against target roles, and converse with citation-backed AI.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!currentResume ? (
              <motion.button
                type="button"
                className="btn btn-primary"
                whileTap={{ scale: 0.97 }}
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                onClick={() => setActiveTab('analysis')}
              >
                <Upload size={16} />
                <span>Upload Resume</span>
              </motion.button>
            ) : (
              <>
                <motion.button
                  type="button"
                  className="btn btn-primary"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab('analysis')}
                >
                  <Sparkles size={15} />
                  <span>{analysis ? 'Resume Analysis' : 'Run Analysis'}</span>
                </motion.button>
                <motion.button
                  type="button"
                  className="btn btn-outline"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare size={15} />
                  <span>AI Chat</span>
                </motion.button>
                <motion.button
                  type="button"
                  className="btn btn-outline"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab('skill-gap')}
                >
                  <Target size={15} />
                  <span>Career Guidance</span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Active Resume Context Card */}
      {currentResume ? (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">
                <FileCheck2 size={18} style={{ color: 'var(--primary-500)' }} />
                <span>Active Resume Context</span>
              </div>
              <div className="card-subtitle">
                Document parsed and available for deep analysis, citation Q&amp;A, and career guidance.
              </div>
            </div>
            <span className="badge badge-success">
              <ShieldCheck size={12} />
              Loaded Successfully
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '12px',
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 700, letterSpacing: '0.04em' }}>
                FILENAME
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '3px', wordBreak: 'break-all' }}>
                {currentResume.filename}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 700, letterSpacing: '0.04em' }}>
                FORMAT &amp; SEGMENTS
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '3px' }}>
                {currentResume.fileType} ({currentResume.segmentCount} {currentResume.fileType === 'PDF' ? 'pages' : 'segments'})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 700, letterSpacing: '0.04em' }}>
                EXTRACTED VOLUME
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '3px' }}>
                {currentResume.characterCount.toLocaleString()} characters
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 700, letterSpacing: '0.04em' }}>
                UPLOAD TIME
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '3px' }}>
                {new Date(currentResume.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveTab('analysis')}
            >
              <Sparkles size={14} />
              <span>{analysis ? 'View Resume Analysis' : 'Run Resume Analysis'}</span>
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={14} />
              <span>Ask AI About This Resume</span>
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setActiveTab('skill-gap')}
            >
              <Target size={14} />
              <span>Career Guidance &amp; Skill Benchmark</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={26} />
            </div>
            <h2 className="empty-state-title">No Resume Uploaded</h2>
            <p className="empty-state-desc">
              Upload a PDF or DOCX resume document to extract explicit skills, analyze project technologies, and converse with citation-backed AI.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveTab('analysis')}
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <Upload size={15} />
              <span>Go to Resume Analysis</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Analysis Preview Card if Analysis is available */}
      {analysis && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">
                <Sparkles size={18} style={{ color: 'var(--primary-500)' }} />
                <span>Recent Analysis Summary</span>
              </div>
              <div className="card-subtitle">
                Grounded strictly in verified document text.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '5px 10px' }}
              onClick={() => setActiveTab('analysis')}
            >
              <span>Full Details</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.04em', marginBottom: '6px' }}>
              PROFESSIONAL SUMMARY
            </div>
            <FormattedAiResponse content={analysis.professionalSummary} />
          </div>

          {analysis.skills && analysis.skills.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.04em', marginBottom: '8px' }}>
                DETECTED SKILLS ({analysis.skills.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.skills.slice(0, 10).map((skill, i) => (
                  <span key={i} className="badge badge-gray">
                    {skill}
                  </span>
                ))}
                {analysis.skills.length > 10 && (
                  <span className="badge badge-gray" style={{ color: 'var(--text-muted)' }}>
                    +{analysis.skills.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {analysis.missingOrUnavailableInformation && analysis.missingOrUnavailableInformation.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--amber-subtle)',
                border: '1px solid var(--amber-border)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber-text)', fontWeight: 600, fontSize: '0.82rem' }}>
                <AlertCircle size={15} />
                <span>Identified Information Gaps ({analysis.missingOrUnavailableInformation.length})</span>
              </div>
              <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {analysis.missingOrUnavailableInformation.slice(0, 2).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {skillGapAnalysis && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-subtle)',
                border: '1px solid var(--primary-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Role Comparison
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {skillGapAnalysis.targetRoleOrJobDescription}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-primary">
                  {skillGapAnalysis.matchPercentage}% Match
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                  onClick={() => setActiveTab('skill-gap')}
                >
                  View Gap Details
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 4-Step Capabilities Overview */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.015em', marginBottom: '14px' }}>
          Platform Capabilities
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
          <div className="card" style={{ padding: '18px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                marginBottom: '10px',
                border: '1px solid var(--primary-border)',
              }}
            >
              1
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              Document Extraction
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Parses PDF and DOCX documents securely into structured segments without external AI calls during upload.
            </p>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                marginBottom: '10px',
                border: '1px solid var(--primary-border)',
              }}
            >
              2
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              Evidence Analysis
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Extracts explicit skills, project technologies, and education. Identifies missing details with zero fabricated scores.
            </p>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                marginBottom: '10px',
                border: '1px solid var(--primary-border)',
              }}
            >
              3
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              AI Resume Chat
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Answers questions grounded in document text with exact citations and session memory across multilingual queries.
            </p>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                marginBottom: '10px',
                border: '1px solid var(--primary-border)',
              }}
            >
              4
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              Career Guidance
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Evaluates role suitability, pinpoints practical skill gaps, and outlines a 6-step personalized learning roadmap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
