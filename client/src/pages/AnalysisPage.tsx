import React from 'react';
import {
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Code2,
  Clock,
  RotateCcw,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useResume } from '../context/useResume';

export const AnalysisPage: React.FC = () => {
  const {
    currentResume,
    analysis,
    isAnalyzing,
    analysisError,
    handleRunAnalysis,
    setActiveTab,
  } = useResume();

  // If no resume uploaded in session
  if (!currentResume) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto' }}>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={32} />
            </div>
            <h2 className="empty-state-title">No Resume Uploaded</h2>
            <p className="empty-state-desc">
              Please upload your resume first before running structured analysis.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('upload')}
              style={{ padding: '10px 20px' }}
            >
              Go to Upload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Resume Intelligence & Analysis
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Evidence-grounded structured extraction for <strong style={{ color: 'var(--text-main)' }}>{currentResume.filename}</strong>.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          style={{ minWidth: '160px' }}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner" />
              <span>Analyzing...</span>
            </>
          ) : analysis ? (
            <>
              <RotateCcw size={15} />
              <span>Re-Analyze</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Run Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Error Alert */}
      {analysisError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Analysis Request Failed</div>
            <div>{analysisError}</div>
            <button
              className="btn btn-danger-outline"
              style={{ padding: '4px 10px', fontSize: '0.78rem', marginTop: '8px' }}
              onClick={handleRunAnalysis}
            >
              Retry Analysis
            </button>
          </div>
        </div>
      )}

      {/* If analysis is currently running */}
      {isAnalyzing && (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <span
              className="spinner"
              style={{ width: '36px', height: '36px', borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }}
            />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Generating Structured Analysis...
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px' }}>
              The Gemini ChatClient is processing the extracted resume text to identify summary, explicit skills, projects, and missing details without hallucinations.
            </p>
          </div>
        </div>
      )}

      {/* If not analyzed yet and not currently analyzing */}
      {!analysis && !isAnalyzing && (
        <div className="card">
          <div className="empty-state">
            <div
              className="empty-state-icon"
              style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}
            >
              <Sparkles size={32} />
            </div>
            <h2 className="empty-state-title">Ready to Analyze Resume</h2>
            <p className="empty-state-desc">
              Click the button below to generate a comprehensive, evidence-backed breakdown of your resume including your professional summary, technologies used in projects, and missing critical details.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleRunAnalysis}
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            >
              <Sparkles size={18} />
              <span>Generate Structured Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isAnalyzing && (
        <>
          {/* Analysis Meta Banner */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--slate-100)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-main)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              <span>Analyzed at {new Date(analysis.analyzedAt).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--emerald-600)' }} />
              <span>Strictly Evidence-Based (Zero Fabricated Metrics)</span>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <div className="card-title">
                <FileText size={18} style={{ color: 'var(--primary-600)' }} />
                <span>Professional Summary</span>
              </div>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
              {analysis.professionalSummary || 'No explicit summary found in the uploaded resume.'}
            </p>
          </div>

          {/* Technical & Professional Skills */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">
                <Code2 size={18} style={{ color: 'var(--primary-600)' }} />
                <span>Explicit Skills ({analysis.skills?.length || 0})</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Directly referenced in resume
              </div>
            </div>

            {analysis.skills && analysis.skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {analysis.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="badge badge-primary"
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                No explicit skills could be parsed from the document.
              </p>
            )}
          </div>

          {/* Projects and Technologies */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div className="card-title">
                <Briefcase size={18} style={{ color: 'var(--primary-600)' }} />
                <span>Projects & Alignments ({analysis.projects?.length || 0})</span>
              </div>
            </div>

            {analysis.projects && analysis.projects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {analysis.projects.map((proj, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--border-main)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      backgroundColor: 'var(--bg-app)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {proj.name}
                      </h4>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {proj.technologies.map((tech, tIdx) => (
                            <span key={tIdx} className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                No explicit projects section was detected in the resume text.
              </p>
            )}
          </div>

          {/* Education & Certifications */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">
                <GraduationCap size={18} style={{ color: 'var(--primary-600)' }} />
                <span>Education & Certifications</span>
              </div>
            </div>

            {analysis.educationAndCertifications && analysis.educationAndCertifications.length > 0 ? (
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.educationAndCertifications.map((edu, idx) => (
                  <li key={idx} style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    {edu}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                No education or certifications were explicitly mentioned.
              </p>
            )}
          </div>

          {/* Missing or Unavailable Information */}
          <div
            className="card"
            style={{
              borderColor: 'rgba(245, 158, 11, 0.4)',
              backgroundColor: 'rgba(255, 251, 235, 0.4)',
            }}
          >
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <div className="card-title" style={{ color: 'var(--amber-700)' }}>
                <ShieldAlert size={18} />
                <span>Missing or Unclear Information ({analysis.missingOrUnavailableInformation?.length || 0})</span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              The following details were not identified in your resume. Addressing these gaps can substantially improve interview shortlisting and clarity.
            </p>

            {analysis.missingOrUnavailableInformation && analysis.missingOrUnavailableInformation.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.missingOrUnavailableInformation.map((info, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem',
                      color: 'var(--text-main)',
                    }}
                  >
                    <Info size={16} style={{ color: 'var(--amber-600)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{info}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="badge badge-success" style={{ padding: '6px 12px' }}>
                No critical omissions or missing information detected.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
