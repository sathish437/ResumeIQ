import React, { useState, useRef } from 'react';
import type { DragEvent } from 'react';
import {
  UploadCloud,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  FileCheck2,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useResume } from '../context/useResume';

export const UploadPage: React.FC = () => {
  const {
    currentResume,
    isUploading,
    uploadProgressText,
    uploadError,
    handleFileUpload,
    setActiveTab,
  } = useResume();

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileUpload(file);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Upload Resume
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Upload your resume in PDF or DOCX format. The document will be parsed into text segments ready for structured AI analysis and conversational query.
        </p>
      </div>

      {/* Error Alert */}
      {uploadError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Upload Failed</div>
            <div>{uploadError}</div>
          </div>
        </div>
      )}

      {/* Upload Zone Card */}
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
            padding: '48px 24px',
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            disabled={isUploading}
          />

          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isDragOver ? 'var(--primary-100)' : 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              color: isDragOver ? 'var(--primary-600)' : 'var(--primary-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {isUploading ? (
              <span className="spinner" style={{ width: '28px', height: '28px', borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
            ) : (
              <UploadCloud size={32} />
            )}
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            {isUploading
              ? 'Processing Resume...'
              : isDragOver
              ? 'Drop your resume file here'
              : 'Click to select or drag and drop your resume'}
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', marginBottom: '14px' }}>
            {isUploading
              ? uploadProgressText || 'Extracting document text...'
              : 'Supports standard PDF documents and DOCX Word files up to 10MB.'}
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

      {/* Extracted Preview Section */}
      {currentResume && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <FileCheck2 size={20} style={{ color: 'var(--emerald-600)' }} />
                <span>Uploaded Document Verified</span>
              </div>
              <div className="card-subtitle">
                {currentResume.filename} • {currentResume.characterCount.toLocaleString()} characters extracted across {currentResume.segmentCount} {currentResume.fileType === 'PDF' ? 'pages' : 'segments'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                onClick={() => handleCopyText(currentResume.text)}
                title="Copy entire extracted text"
              >
                {copied ? <Check size={14} style={{ color: 'var(--emerald-600)' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-50)',
              border: '1px solid var(--primary-100)',
              marginBottom: '20px',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-900)' }}>
                Ready for AI Processing
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--primary-700)' }}>
                Your resume is stored in session context. You can now generate an evidence-based analysis or ask specific questions.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setActiveTab('analysis')}
                style={{ fontSize: '0.85rem', padding: '8px 14px' }}
              >
                <Sparkles size={15} />
                <span>Run Analysis</span>
                <ArrowRight size={14} />
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setActiveTab('chat')}
                style={{ fontSize: '0.85rem', padding: '8px 14px', backgroundColor: 'var(--bg-surface)' }}
              >
                <MessageSquare size={15} />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* Page Tabs for PDF or Segment List */}
          {currentResume.pages && currentResume.pages.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} />
                <span>PAGES ({currentResume.pages.length})</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {currentResume.pages.map((p, idx) => (
                  <button
                    key={p.pageNumber}
                    className={`btn ${selectedPage === idx ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                    onClick={() => setSelectedPage(idx)}
                  >
                    Page {p.pageNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Viewer Box */}
          <div
            style={{
              backgroundColor: 'var(--slate-900)',
              color: '#e2e8f0',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              maxHeight: '440px',
              overflowY: 'auto',
              fontSize: '0.86rem',
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
  );
};
