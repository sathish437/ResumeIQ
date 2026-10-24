import React, { useState, useRef } from 'react';
import type { DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  FileText,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Code2,
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

    const allowedExtensions = ['.pdf', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setLocalValidationMessage('Invalid file format. Only .pdf and .docx documents are accepted.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setLocalValidationMessage('File exceeds 10MB limit. Please upload a file smaller than 10MB.');
      return;
    }

    if (file.size === 0) {
      setLocalValidationMessage('The selected file is empty. Please upload a valid document.');
      return;
    }

    const uploaded = await handleFileUpload(file);
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
      e.target.value = '';
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: 'none' }}
        disabled={isUploading || isAnalyzing}
      />

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: '4px' }}>
            Resume Analysis
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {currentResume
              ? `Structured evidence analysis for ${currentResume.filename}`
              : 'Upload a resume to extract explicit skills and generate evidence-grounded intelligence.'}
          </p>
        </div>

        {currentResume && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <motion.button
              type="button"
              className="btn btn-outline"
              whileTap={{ scale: 0.97 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isAnalyzing}
              title="Upload another resume file"
            >
              <UploadCloud size={14} />
              <span>Upload Another</span>
            </motion.button>

            <motion.button
              type="button"
              className="btn btn-primary"
              whileTap={{ scale: 0.97 }}
              onClick={() => handleRunAnalysis()}
              disabled={isAnalyzing || isUploading}
              style={{ minWidth: '130px' }}
            >
              {isAnalyzing ? (
                <>
                  <span className="spinner" />
                  <span>Analyzing...</span>
                </>
              ) : analysis ? (
                <>
                  <RotateCcw size={14} />
                  <span>Re-Analyze</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Run Analysis</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* Local Validation Error */}
      {localValidationMessage && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Invalid Document</div>
            <div>{localValidationMessage}</div>
          </div>
        </div>
      )}

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Upload Error</div>
            <div>{uploadError}</div>
          </div>
        </div>
      )}

      {/* Analysis Error Alert */}
      {analysisError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Analysis Failed</div>
            <div style={{ marginBottom: '8px' }}>{analysisError}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-danger-outline"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => handleRunAnalysis()}
              >
                <RotateCcw size={12} />
                <span>Retry Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State A: No Resume Uploaded -> Sleek Dropzone */}
      {!currentResume && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{
              border: isDragOver ? '2px dashed var(--primary-600)' : '2px dashed var(--border-main)',
              backgroundColor: isDragOver ? 'var(--primary-subtle)' : 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 20px',
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
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                color: isDragOver ? 'var(--primary-600)' : 'var(--primary-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              {isUploading ? (
                <span className="spinner" style={{ width: '26px', height: '26px' }} />
              ) : (
                <UploadCloud size={26} />
              )}
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              {isUploading
                ? 'Processing Resume Document...'
                : isDragOver
                ? 'Drop your resume file here'
                : 'Upload your resume to begin'}
            </h3>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', marginBottom: '16px', lineHeight: 1.55 }}>
              {isUploading
                ? uploadProgressText || 'Extracting document text segments...'
                : 'Select or drag & drop a PDF or DOCX file (up to 10MB). Text is parsed securely without external AI calls during upload.'}
            </p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span className="badge badge-gray">PDF (.pdf)</span>
              <span className="badge badge-gray">DOCX (.docx)</span>
              <span className="badge badge-gray">Max 10MB</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* State B: Resume Uploaded */}
      {currentResume && (
        <>
          {/* Active Resume Context Card */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div>
                <div className="card-title">
                  <FileCheck2 size={18} style={{ color: 'var(--primary-500)' }} />
                  <span>{currentResume.filename}</span>
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                    {currentResume.fileType}
                  </span>
                </div>
                <div className="card-subtitle">
                  {currentResume.segmentCount} {currentResume.fileType === 'PDF' ? 'pages' : 'segments'} • {currentResume.characterCount.toLocaleString()} characters extracted
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.78rem', padding: '5px 11px' }}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare size={13} />
                  <span>AI Chat</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.78rem', padding: '5px 11px' }}
                  onClick={() => setShowExtractedText((prev) => !prev)}
                >
                  <FileText size={13} />
                  <span>{showExtractedText ? 'Hide Text' : 'View Text'}</span>
                  {showExtractedText ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.78rem', padding: '5px 11px', color: 'var(--text-subtle)' }}
                  onClick={handleReset}
                  title="Reset context and upload new resume"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Collapsible Extracted Text Viewer */}
            <AnimatePresence>
              {showExtractedText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={13} />
                      <span>PARSED DOCUMENT SEGMENTS</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                      onClick={() => handleCopyText(currentResume.text)}
                    >
                      {copied ? <Check size={12} style={{ color: 'var(--emerald-500)' }} /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>

                  {currentResume.pages && currentResume.pages.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {currentResume.pages.map((p, idx) => (
                        <button
                          key={p.pageNumber}
                          type="button"
                          className={`btn ${selectedPage === idx ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                          onClick={() => setSelectedPage(idx)}
                        >
                          Page {p.pageNumber}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      backgroundColor: 'var(--bg-surface-subtle)',
                      color: 'var(--text-main)',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      maxHeight: '280px',
                      overflowY: 'auto',
                      fontSize: '0.82rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      border: '1px solid var(--border-main)',
                    }}
                  >
                    {currentResume.pages && currentResume.pages.length > 0
                      ? currentResume.pages[selectedPage]?.text || 'No text extracted for this page.'
                      : currentResume.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Loading Indicator when Analysis is Running */}
          {isAnalyzing && (
            <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span className="spinner" style={{ width: '28px', height: '28px' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Analyzing Resume Credentials...
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, maxWidth: '440px' }}>
                  Evaluating explicit skills, projects, and educational background against evidence in the document.
                </p>
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {analysis && !isAnalyzing && (
            <>
              {/* 1. Executive Summary */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card-header" style={{ marginBottom: '10px' }}>
                  <div className="card-title">
                    <Sparkles size={17} style={{ color: 'var(--primary-500)' }} />
                    <span>Executive Summary</span>
                  </div>
                </div>

                <FormattedAiResponse content={analysis.professionalSummary} />
              </motion.div>

              {/* 2. Explicit Skills */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <div className="card-title">
                    <Code2 size={17} style={{ color: 'var(--primary-500)' }} />
                    <span>Explicit Skills ({analysis.skills?.length || 0})</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Directly stated in document
                  </span>
                </div>

                {analysis.skills && analysis.skills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {analysis.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="badge badge-gray"
                        style={{ fontSize: '0.82rem', padding: '5px 10px' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    No explicit skills were identified in the document.
                  </p>
                )}
              </motion.div>

              {/* 3. Projects and Technologies */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.08 }}
              >
                <div className="card-header" style={{ marginBottom: '14px' }}>
                  <div className="card-title">
                    <Briefcase size={17} style={{ color: 'var(--primary-500)' }} />
                    <span>Projects &amp; Alignments ({analysis.projects?.length || 0})</span>
                  </div>
                </div>

                {analysis.projects && analysis.projects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analysis.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--border-main)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px 16px',
                          backgroundColor: 'var(--bg-surface-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                            {proj.name}
                          </h4>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {proj.technologies.map((tech, tIdx) => (
                                <span key={tIdx} className="badge badge-sky" style={{ fontSize: '0.7rem' }}>
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
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    No explicit projects detected in the resume text.
                  </p>
                )}
              </motion.div>

              {/* 4. Education & Certifications */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <div className="card-title">
                    <GraduationCap size={17} style={{ color: 'var(--primary-500)' }} />
                    <span>Education &amp; Certifications</span>
                  </div>
                </div>

                {analysis.educationAndCertifications && analysis.educationAndCertifications.length > 0 ? (
                  <ul className="ai-list">
                    {analysis.educationAndCertifications.map((edu, idx) => (
                      <li key={idx} className="ai-list-item" style={{ fontSize: '0.88rem' }}>
                        {edu}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    No education or certifications were explicitly mentioned.
                  </p>
                )}
              </motion.div>

              {/* 5. Missing or Unavailable Information */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.12 }}
                style={{
                  borderColor: 'var(--amber-border)',
                  backgroundColor: 'var(--amber-subtle)',
                }}
              >
                <div className="card-header" style={{ marginBottom: '10px' }}>
                  <div className="card-title" style={{ color: 'var(--amber-text)' }}>
                    <ShieldAlert size={17} />
                    <span>Identified Omissions ({analysis.missingOrUnavailableInformation?.length || 0})</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '12px', margin: '0 0 12px 0' }}>
                  Addressing these gaps can improve interview shortlisting and ATS clarity.
                </p>

                {analysis.missingOrUnavailableInformation && analysis.missingOrUnavailableInformation.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {analysis.missingOrUnavailableInformation.map((info, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--amber-border)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.84rem',
                          color: 'var(--text-main)',
                        }}
                      >
                        <Info size={14} style={{ color: 'var(--amber-text)', flexShrink: 0, marginTop: '2px' }} />
                        <span>{info}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="badge badge-success" style={{ padding: '5px 10px' }}>
                    No critical omissions detected.
                  </div>
                )}
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AnalysisPage;
