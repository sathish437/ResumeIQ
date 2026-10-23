import React, { useState, useRef } from 'react';
import type { DragEvent } from 'react';
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
  UploadCloud,
  FileCheck2,
  MessageSquare,
  Layers,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useResume } from '../context/useResume';
import { FormattedAiResponse } from '../components/common/FormattedAiResponse';

export const AnalysisPage: React.FC = () => {
  const {
    currentResume,
    analysis,
    isUploading,
    uploadProgressText,
    uploadError,
    isAnalyzing,
    analysisError,
    handleFileUpload,
    handleRunAnalysis,
    handleReset,
    setActiveTab,
  } = useResume();

  const [isDragOver, setIsDragOver] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [localValidationMessage, setLocalValidationMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    setLocalValidationMessage(null);

    // Validate extension
    const allowedExtensions = ['.pdf', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setLocalValidationMessage('Invalid file format. Only .pdf and .docx documents are accepted.');
      return;
    }

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setLocalValidationMessage('File exceeds 10MB limit. Please upload a file smaller than 10MB.');
      return;
    }

    if (file.size === 0) {
      setLocalValidationMessage('The selected file is empty. Please upload a valid document.');
      return;
    }

    // 1. Upload Resume
    const uploaded = await handleFileUpload(file);
    // 2. If upload succeeded, automatically trigger AI analysis using the uploaded resume
    if (uploaded) {
      await handleRunAnalysis(uploaded);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading && !isAnalyzing) {
      setIsDragOver(true);
    }
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading || isAnalyzing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndUpload(file);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hidden file input for upload triggers */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: 'none' }}
        disabled={isUploading || isAnalyzing}
      />

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Resume Analysis
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            {currentResume
              ? `Evidence-grounded structured intelligence for ${currentResume.filename}`
              : 'Upload your resume to extract text segments, detect explicit skills, and generate evidence-grounded AI intelligence.'}
          </p>
        </div>

        {currentResume && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isAnalyzing}
              title="Upload another resume file"
            >
              <UploadCloud size={16} />
              <span>Upload Another Resume</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={() => handleRunAnalysis()}
              disabled={isAnalyzing || isUploading}
              style={{ minWidth: '140px' }}
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
        )}
      </div>

      {/* Local Validation Error */}
      {localValidationMessage && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Invalid File</div>
            <div>{localValidationMessage}</div>
          </div>
        </div>
      )}

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Upload Failed</div>
            <div>{uploadError}</div>
          </div>
        </div>
      )}

      {/* Analysis Error Alert */}
      {analysisError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Analysis Request Failed</div>
            <div style={{ marginBottom: '8px' }}>{analysisError}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-danger-outline"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => handleRunAnalysis()}
              >
                <RotateCcw size={12} />
                <span>Retry Analysis</span>
              </button>
              {(analysisError.toLowerCase().includes('re-upload') || analysisError.toLowerCase().includes('expired')) && (
                <button
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={12} />
                  <span>Upload Resume Again</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Initial State: No Resume Uploaded -> Upload Zone */}
      {!currentResume && (
        <div className="card">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{
              border: isDragOver ? '2px dashed var(--primary-500)' : '2px dashed var(--border-main)',
              backgroundColor: isDragOver ? 'var(--primary-50)' : 'var(--slate-50)',
              borderRadius: 'var(--radius-lg)',
              padding: '52px 24px',
              textAlign: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isDragOver ? 'var(--primary-100)' : 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                color: isDragOver ? 'var(--primary-600)' : 'var(--primary-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {isUploading ? (
                <span className="spinner" style={{ width: '32px', height: '32px', borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
              ) : (
                <UploadCloud size={34} />
              )}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              {isUploading
                ? 'Processing Resume Upload...'
                : isDragOver
                ? 'Drop your resume file here'
                : 'Click to select or drag and drop your resume'}
            </h3>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px', marginBottom: '16px' }}>
              {isUploading
                ? uploadProgressText || 'Extracting document text segments...'
                : 'Supports PDF documents and DOCX Word files up to 10MB. Text is securely parsed and processed for evidence-based intelligence.'}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span className="badge badge-gray">PDF (.pdf)</span>
              <span className="badge badge-gray">DOCX (.docx)</span>
              <span className="badge badge-gray">Max 10MB</span>
              <span className="badge badge-gray">Selectable Text Only</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>Note: Image-only scanned documents are not supported (OCR is not enabled). Ensure your document contains selectable text.</span>
          </div>
        </div>
      )}

      {/* State: Resume Uploaded */}
      {currentResume && (
        <>
          {/* Active Resume Context Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <div className="card-title">
                  <FileCheck2 size={20} style={{ color: 'var(--emerald-600)' }} />
                  <span>{currentResume.filename}</span>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                    {currentResume.fileType}
                  </span>
                </div>
                <div className="card-subtitle">
                  {currentResume.segmentCount} {currentResume.fileType === 'PDF' ? 'pages' : 'segments'} • {currentResume.characterCount.toLocaleString()} characters extracted • Uploaded {new Date(currentResume.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare size={14} />
                  <span>Ask in AI Chat</span>
                </button>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => setShowExtractedText((prev) => !prev)}
                >
                  <FileText size={14} />
                  <span>{showExtractedText ? 'Hide Text' : 'View Text'}</span>
                  {showExtractedText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--text-muted)' }}
                  onClick={handleReset}
                  title="Reset context and upload new resume"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Collapsible Extracted Text Viewer */}
            {showExtractedText && (
              <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} />
                    <span>PARSED DOCUMENT SEGMENTS</span>
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={() => handleCopyText(currentResume.text)}
                  >
                    {copied ? <Check size={13} style={{ color: 'var(--emerald-600)' }} /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy Full Text'}</span>
                  </button>
                </div>

                {/* Page Tabs for PDF */}
                {currentResume.pages && currentResume.pages.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {currentResume.pages.map((p, idx) => (
                      <button
                        key={p.pageNumber}
                        className={`btn ${selectedPage === idx ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '3px 10px', fontSize: '0.76rem' }}
                        onClick={() => setSelectedPage(idx)}
                      >
                        Page {p.pageNumber}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: 'var(--slate-900)',
                    color: '#e2e8f0',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    fontSize: '0.84rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--slate-800)',
                  }}
                >
                  {currentResume.pages && currentResume.pages.length > 0
                    ? currentResume.pages[selectedPage]?.text || 'No text extracted for this page.'
                    : currentResume.text}
                </div>
              </div>
            )}
          </div>

          {/* Processing State: Analyzing */}
          {isAnalyzing && (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <span
                  className="spinner"
                  style={{ width: '38px', height: '38px', borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }}
                />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Processing Resume Analysis with AI Assistant...
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', lineHeight: 1.6 }}>
                  Extracting explicit skills, project technologies, education, and missing career details strictly from your uploaded document evidence. Zero fabricated metrics.
                </p>
              </div>
            </div>
          )}

          {/* Not analyzed yet, and not currently analyzing */}
          {!analysis && !isAnalyzing && (
            <div className="card">
              <div className="empty-state">
                <div
                  className="empty-state-icon"
                  style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}
                >
                  <Sparkles size={32} />
                </div>
                <h2 className="empty-state-title">Ready for AI Analysis</h2>
                <p className="empty-state-desc">
                  Your resume text has been extracted and verified. Click below to generate structured insights including your professional summary, explicit technical skills, project alignments, and missing details.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleRunAnalysis()}
                  style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                >
                  <Sparkles size={18} />
                  <span>Start AI Resume Analysis</span>
                </button>
              </div>
            </div>
          )}

          {/* Analysis Results Display */}
          {analysis && !isAnalyzing && (
            <>
              {/* Analysis Meta Banner */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--slate-100)',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-main)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} />
                  <span>Analysis completed at {new Date(analysis.analyzedAt).toLocaleTimeString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--emerald-600)' }} />
                  <span>Strictly Evidence-Based (Zero Fabricated Metrics)</span>
                </div>
              </div>

              {/* 1. Professional Summary */}
              <div className="card">
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <div className="card-title">
                    <FileText size={18} style={{ color: 'var(--primary-600)' }} />
                    <span>Professional Summary</span>
                  </div>
                </div>
                {analysis.professionalSummary ? (
                  <FormattedAiResponse content={analysis.professionalSummary} />
                ) : (
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                    No explicit summary found in the uploaded resume.
                  </p>
                )}
              </div>

              {/* 2. Explicit Skills */}
              <div className="card">
                <div className="card-header" style={{ marginBottom: '14px' }}>
                  <div className="card-title">
                    <Code2 size={18} style={{ color: 'var(--primary-600)' }} />
                    <span>Explicit Skills ({analysis.skills?.length || 0})</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Directly stated in resume
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
                    No explicit skills were identified in the document.
                  </p>
                )}
              </div>

              {/* 3. Projects and Technologies */}
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
                                <span key={tIdx} className="badge badge-gray" style={{ fontSize: '0.74rem' }}>
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {proj.description && (
                          <FormattedAiResponse content={proj.description} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    No explicit projects section was detected in the resume text.
                  </p>
                )}
              </div>

              {/* 4. Education & Certifications */}
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

              {/* 5. Missing or Unavailable Information */}
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

                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  The following details were not identified in your resume. Addressing these gaps can substantially improve interview shortlisting and ATS clarity.
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
        </>
      )}
    </div>
  );
};
