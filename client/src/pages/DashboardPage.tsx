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
  Award,
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
          padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 32px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-primary">
                Evidence-Grounded Intelligence
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: '6px', lineHeight: 1.25 }}>
              ResumeIQ Platform
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '640px', lineHeight: 1.55, margin: 0 }}>
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '12px',
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: 'clamp(12px, 3vw, 14px) clamp(12px, 3vw, 18px)',
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

          {/* Target Role Overview if Skill Gap is already run */}
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
                  {skillGapAnalysis.targetRoleOrJobDescription.split('\n')[0].replace(/^Target Role:\s*/i, '')}
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

      {/* ATS Compatibility Score Section */}
      {currentResume && (
        <motion.div
          className="card"
          id="dashboard-ats-score-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          style={{
            border: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-surface)',
            padding: 'clamp(14px, 3.5vw, 22px) clamp(14px, 3.5vw, 24px)',
          }}
        >
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <div className="card-title">
                <Award size={20} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: 'clamp(0.95rem, 3vw, 1.05rem)' }}>ATS Resume Compatibility Score</span>
              </div>
              <div className="card-subtitle">
                Target-grounded compatibility score measuring keyword coverage, project evidence, and document readability.
              </div>
            </div>
            {skillGapAnalysis?.atsScore ? (
              <span className="badge badge-primary">
                Target Evaluated
              </span>
            ) : (
              <span className="badge badge-gray">
                Target Not Selected
              </span>
            )}
          </div>

          {skillGapAnalysis?.atsScore ? (
            /* ATS Score Calculated */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  padding: 'clamp(12px, 3vw, 16px) clamp(12px, 3vw, 20px)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    TARGET ROLE / JOB DESCRIPTION
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {skillGapAnalysis.targetRoleOrJobDescription.split('\n')[0].replace(/^Target Role:\s*/i, '')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                      ESTIMATED ATS SCORE
                    </div>
                    <div
                      style={{
                        fontSize: '1.85rem',
                        fontWeight: 900,
                        lineHeight: 1,
                        color: skillGapAnalysis.atsScore.totalScore >= 75
                          ? 'var(--emerald-text)'
                          : skillGapAnalysis.atsScore.totalScore >= 50
                          ? 'var(--amber-text)'
                          : 'var(--rose-text)',
                      }}
                    >
                      {skillGapAnalysis.atsScore.totalScore}
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
                    </div>
                  </div>

                  <span
                    className={
                      skillGapAnalysis.atsScore.totalScore >= 75
                        ? 'badge badge-success'
                        : skillGapAnalysis.atsScore.totalScore >= 50
                        ? 'badge badge-warning'
                        : 'badge badge-danger'
                    }
                    style={{ fontSize: '0.76rem', padding: '4px 8px' }}
                  >
                    {skillGapAnalysis.atsScore.totalScore >= 75
                      ? 'High Match'
                      : skillGapAnalysis.atsScore.totalScore >= 50
                      ? 'Moderate Match'
                      : 'Needs Alignment'}
                  </span>
                </div>
              </div>

              {/* 4 Category Score Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '10px' }}>
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Required Skills Match
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    {skillGapAnalysis.atsScore.breakdown.requiredSkillsScore} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 50 pts</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Weighted coverage of mandatory qualifications
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Preferred Skills Match
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    {skillGapAnalysis.atsScore.breakdown.preferredSkillsScore} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 20 pts</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Bonus tools &amp; complementary domain skills
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Experience &amp; Projects
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    {skillGapAnalysis.atsScore.breakdown.experienceEvidenceScore} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 20 pts</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Project deliverables &amp; documented tech
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Resume Structure &amp; Info
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    {skillGapAnalysis.atsScore.breakdown.resumeStructureScore} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 10 pts</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Readable sections, contact details &amp; formatting
                  </div>
                </div>
              </div>

              {/* Missing Requirements List */}
              {skillGapAnalysis.atsScore.missingRequirements && skillGapAnalysis.atsScore.missingRequirements.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--amber-subtle)',
                    border: '1px solid var(--amber-border)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber-text)', fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px' }}>
                    <AlertCircle size={14} />
                    <span>Important Missing Requirements for this Target:</span>
                  </div>
                  <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    {skillGapAnalysis.atsScore.missingRequirements.slice(0, 3).map((req, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button & Disclaimer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '4px' }}>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-subtle)', margin: 0, maxWidth: '600px', lineHeight: 1.4 }}>
                  <em>Note: Estimated ATS compatibility score based on transparent heuristic matching against target requirements. Does not guarantee interview selection or ATS ranking.</em>
                </p>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('skill-gap')}
                  style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                >
                  <Target size={14} />
                  <span>Review Skill Gaps &amp; Improve Score</span>
                </button>
              </div>
            </div>
          ) : (
            /* ATS Score Not Calculated */
            <div
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px dashed var(--border-main)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                }}
              >
                <span>ATS Score: Not calculated</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '540px', margin: 0, lineHeight: 1.5 }}>
                An ATS compatibility score evaluates how well your resume matches a specific target job description. A generic resume without a target job description cannot reliably have a job-specific ATS match score.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('skill-gap')}
                style={{ fontSize: '0.84rem', padding: '8px 16px', marginTop: '4px' }}
              >
                <Target size={14} />
                <span>Select Target Role or Provide Job Description</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* 4-Step Capabilities Overview */}
      <div>
        <h3 style={{ fontSize: 'clamp(0.98rem, 3vw, 1.05rem)', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.015em', marginBottom: '14px' }}>
          Platform Capabilities
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
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
