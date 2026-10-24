import React from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  FileText,
  Upload,
  Sparkles,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { useResume } from '../context/useResume';
import { SkillGapAnalysisSection } from '../components/analysis/SkillGapAnalysisSection';

export const SkillGapPage: React.FC = () => {
  const {
    currentResume,
    analysis,
    isAnalyzing,
    handleRunAnalysis,
    setActiveTab,
  } = useResume();

  // 1. Empty State: No Resume Uploaded
  if (!currentResume) {
    return (
      <div style={{ maxWidth: '1060px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'var(--hero-gradient)',
            borderColor: 'rgba(220, 38, 38, 0.25)',
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
                flexShrink: 0,
              }}
            >
              <Compass size={22} />
            </div>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '6px' }}>
                Career Guidance
              </span>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Resume-Based Career Guidance
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '680px', lineHeight: 1.5, margin: 0 }}>
                Discover suitable job roles, practical skill gaps, and a personalized 6-step roadmap directly from your resume evidence — without needing a job description to get started.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Empty State Prompt */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={28} />
            </div>
            <h2 className="empty-state-title">No Resume Selected</h2>
            <p className="empty-state-desc">
              Upload a resume document in Resume Analysis to unlock personalized role recommendations, skill gap breakdowns, and actionable career guidance.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveTab('analysis')}
              style={{ padding: '9px 18px', fontSize: '0.88rem' }}
            >
              <Upload size={15} />
              <span>Go to Resume Analysis</span>
            </button>
          </div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(220, 38, 38, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
                border: '1px solid rgba(220, 38, 38, 0.25)',
              }}
            >
              <Briefcase size={16} />
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              Evidence-Based Roles
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Identifies which software engineering roles best fit your verified technologies and project experience.
            </p>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <CheckCircle2 size={16} />
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              Focused 4-Part Gaps
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Separates what you already have, what needs stronger proof, what is missing, and required practical projects.
            </p>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <Target size={16} />
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              6-Step Action Roadmap
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Ordered progression from strengthening fundamentals to project building, interview rehearsal, and applying.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Resume Uploaded but Analysis Not Yet Ready
  if (!analysis) {
    return (
      <div style={{ maxWidth: '1060px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            padding: '16px 20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <FileText size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentResume.filename}
              </span>
              <span className="badge badge-gray" style={{ fontSize: '0.68rem' }}>
                {currentResume.fileType}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {currentResume.segmentCount} {currentResume.fileType === 'PDF' ? 'pages' : 'segments'} • {currentResume.characterCount.toLocaleString()} characters
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setActiveTab('analysis')}
            >
              <span>Switch Resume</span>
            </button>
            <motion.button
              type="button"
              className="btn btn-primary"
              whileTap={{ scale: 0.97 }}
              onClick={() => handleRunAnalysis(currentResume)}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className="spinner" style={{ width: '13px', height: '13px' }} />
                  <span>Extracting Evidence...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Run Analysis</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Loading / Action State */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="empty-state">
            <div className="empty-state-icon">
              {isAnalyzing ? (
                <span className="spinner" style={{ width: '28px', height: '28px' }} />
              ) : (
                <Compass size={28} />
              )}
            </div>
            <h2 className="empty-state-title">
              {isAnalyzing ? 'Extracting Resume Evidence...' : 'Analysis Required'}
            </h2>
            <p className="empty-state-desc">
              {isAnalyzing
                ? 'Parsing skills, project context, and credentials from your resume. Career guidance will appear shortly.'
                : 'Run resume analysis to identify your technical profile and unlock evidence-backed role guidance.'}
            </p>
            {!isAnalyzing && (
              <motion.button
                type="button"
                className="btn btn-primary"
                whileTap={{ scale: 0.97 }}
                onClick={() => handleRunAnalysis(currentResume)}
                style={{ padding: '9px 18px', fontSize: '0.88rem' }}
              >
                <Sparkles size={15} />
                <span>Run Analysis Now</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Active Resume with Full Analysis Available -> Resume-Based Career Guidance
  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Active Resume Context Bar */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '14px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(220, 38, 38, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Compass size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentResume.filename}
              </span>
              <span className="badge badge-gray" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                {currentResume.fileType}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {currentResume.segmentCount} {currentResume.fileType === 'PDF' ? 'pages' : 'segments'} • {currentResume.characterCount.toLocaleString()} chars • Grounded in Resume Evidence
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '5px 10px' }}
            onClick={() => setActiveTab('analysis')}
            title="View complete resume analysis"
          >
            <Sparkles size={13} />
            <span>Resume Analysis</span>
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '5px 10px' }}
            onClick={() => setActiveTab('chat')}
            title="Ask AI questions about this resume"
          >
            <MessageSquare size={13} />
            <span>AI Chat</span>
          </button>
        </div>
      </motion.div>

      {/* Primary Resume-Based Career Guidance Section */}
      <SkillGapAnalysisSection />
    </div>
  );
};

export default SkillGapPage;
