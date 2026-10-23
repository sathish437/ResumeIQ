import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import {
  Send,
  Bot,
  AlertCircle,
  FileText,
  RotateCcw,
  Pencil,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useResume } from '../context/useResume';
import { askResume } from '../api/client';
import { createMessageId, getCurrentTimestamp } from '../utils/helpers';
import type { ChatMessage } from '../types/resume';
import { FormattedAiResponse } from '../components/common/FormattedAiResponse';

const SUGGESTED_PROMPTS = [
  'What projects are mentioned in my resume?',
  'What are the main weaknesses in my resume?',
  'How can I improve my technical skills section?',
  'Explain the strongest points in my resume.',
  'En resume-la enna enna projects irukku?',
  'என் ரெஸ்யூமில் உள்ள முக்கிய பலங்கள் என்ன?',
];

export const ChatPage: React.FC = () => {
  const { currentResume, chatMessages, setChatMessages, setActiveTab } = useResume();
  const [inputText, setInputText] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Edit and Resend State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isAsking]);

  useEffect(() => {
    if (editingMessageId && editTextareaRef.current) {
      editTextareaRef.current.focus();
      const length = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(length, length);
    }
  }, [editingMessageId]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-adjust height up to 140px
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const handleSend = async (questionToSend?: string) => {
    const question = (questionToSend || inputText).trim();
    if (!question || isAsking || isResending) return;

    if (!currentResume) {
      return;
    }

    const userMsgId = createMessageId('user');
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: question,
      timestamp: getCurrentTimestamp(),
    };

    setChatMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsAsking(true);

    try {
      const response = await askResume(question);
      const aiMsg: ChatMessage = {
        id: createMessageId('ai'),
        sender: 'ai',
        text: response.answer,
        sources: response.sources || [],
        sourceReferences: response.sourceReferences || [],
        insufficientEvidence: response.insufficientEvidence,
        timestamp: getCurrentTimestamp(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: createMessageId('err'),
        sender: 'ai',
        text:
          err.message ||
          'Failed to get a response from the AI assistant. Please check your connection and try again.',
        timestamp: getCurrentTimestamp(),
        isError: true,
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Edit and Resend Handlers
  const handleStartEdit = (msg: ChatMessage) => {
    if (isAsking || isResending) return;
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
    setEditError(null);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, messageId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveAndResend(messageId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleSaveAndResend = async (messageId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed || isResending) return;

    setIsResending(true);
    setEditError(null);

    try {
      const response = await askResume(trimmed);

      setChatMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        if (idx === -1) return prev;

        const updatedUserMsg: ChatMessage = {
          ...prev[idx],
          text: trimmed,
          isEdited: true,
          timestamp: getCurrentTimestamp(),
        };

        const nextMsg = prev[idx + 1];
        if (nextMsg && nextMsg.sender === 'ai') {
          const updatedAiMsg: ChatMessage = {
            ...nextMsg,
            text: response.answer,
            sources: response.sources || [],
            sourceReferences: response.sourceReferences || [],
            insufficientEvidence: response.insufficientEvidence,
            timestamp: getCurrentTimestamp(),
            isError: false,
          };
          const newArr = [...prev];
          newArr[idx] = updatedUserMsg;
          newArr[idx + 1] = updatedAiMsg;
          return newArr;
        } else {
          const newAiMsg: ChatMessage = {
            id: createMessageId('ai'),
            sender: 'ai',
            text: response.answer,
            sources: response.sources || [],
            sourceReferences: response.sourceReferences || [],
            insufficientEvidence: response.insufficientEvidence,
            timestamp: getCurrentTimestamp(),
          };
          const newArr = [...prev];
          newArr[idx] = updatedUserMsg;
          newArr.splice(idx + 1, 0, newAiMsg);
          return newArr;
        }
      });

      setEditingMessageId(null);
      setEditingText('');
    } catch (err: any) {
      // Keep edit state open with the user's edited text intact
      setEditError(
        err.message || 'Failed to resend question. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

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
              To ask questions about your resume and get evidence-grounded answers with citations, please upload a resume first.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveTab('analysis')}
              style={{ padding: '10px 20px' }}
            >
              Go to Resume Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-layout-wrapper">
      {/* Compact Top Header */}
      <header className="chat-compact-header">
        <div className="chat-header-title-row">
          <span className="chat-title-text">AI Resume Chat</span>
          <span
            className="badge badge-success"
            style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--emerald-500)',
                display: 'inline-block',
              }}
            />
            <span>Assistant Online</span>
          </span>
          <div className="chat-resume-pill" title={currentResume.filename}>
            <FileText size={13} style={{ flexShrink: 0 }} />
            <span className="chat-resume-name">{currentResume.filename}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {chatMessages.length > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setChatMessages([])}
              title="Clear current chat conversation"
            >
              <RotateCcw size={13} />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="chat-scroll-area">
        <div className="chat-stream">
          {chatMessages.length === 0 ? (
            <div className="chat-welcome-container">
              <div className="chat-welcome-icon-box">
                <Bot size={28} />
              </div>
              <h2 className="chat-welcome-title">Ask Anything About Your Resume</h2>
              <p className="chat-welcome-subtitle">
                Our AI Assistant references your uploaded resume to provide evidence-grounded answers with specific citations.
              </p>

              <div className="chat-suggestions-title">
                Suggested Questions
              </div>
              <div className="chat-suggestions-grid">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chat-suggestion-card"
                    onClick={() => handleSend(prompt)}
                    disabled={isAsking}
                  >
                    <span>{prompt}</span>
                    <Sparkles size={14} className="chat-suggestion-icon" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatMessages.map((msg) => {
              if (msg.sender === 'user') {
                const isEditingThis = editingMessageId === msg.id;

                if (isEditingThis) {
                  return (
                    <div key={msg.id} className="chat-turn-user">
                      <div className="chat-edit-box">
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Pencil size={13} style={{ color: 'var(--primary-600)' }} />
                          <span>Edit Question</span>
                        </div>

                        <textarea
                          ref={editTextareaRef}
                          className="chat-edit-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, msg.id)}
                          rows={3}
                          disabled={isResending}
                          placeholder="Edit your question..."
                          aria-label="Edit question"
                        />

                        {editError && (
                          <div
                            className="alert alert-danger"
                            style={{ padding: '8px 12px', margin: 0, fontSize: '0.82rem' }}
                          >
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                            <span>{editError}</span>
                          </div>
                        )}

                        <div className="chat-edit-actions">
                          <span className="chat-edit-hint">
                            <strong>Enter</strong> to save &amp; resend • <strong>Esc</strong> to cancel
                          </span>
                          <div className="chat-edit-btn-group">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={handleCancelEdit}
                              disabled={isResending}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                              onClick={() => handleSaveAndResend(msg.id)}
                              disabled={!editingText.trim() || isResending}
                            >
                              {isResending ? (
                                <>
                                  <span className="spinner" style={{ width: '13px', height: '13px' }} />
                                  <span>Resending...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={13} />
                                  <span>Save &amp; Resend</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="chat-turn-user">
                    <div className="chat-user-row">
                      <div className="chat-message-actions">
                        <button
                          type="button"
                          className="chat-action-btn"
                          title="Edit question"
                          onClick={() => handleStartEdit(msg)}
                          disabled={isAsking || isResending}
                          aria-label="Edit question"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="chat-action-btn"
                          title="Copy question"
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          aria-label="Copy question"
                        >
                          {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="chat-user-bubble">
                        {msg.text}
                      </div>
                    </div>

                    <div className="chat-user-meta">
                      {msg.isEdited && <span className="chat-edited-badge">(edited)</span>}
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              }

              // AI Message Turn
              return (
                <div key={msg.id} className="chat-turn-ai">
                  <div className={`chat-ai-avatar ${msg.isError ? 'error' : ''}`}>
                    {msg.isError ? <AlertCircle size={18} /> : <Bot size={18} />}
                  </div>

                  <div className={`chat-ai-card ${msg.isError ? 'error' : ''}`}>
                    {msg.isError ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--rose-700)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <AlertCircle size={16} />
                          <span>Response Error</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                          {msg.text}
                        </p>
                      </div>
                    ) : (
                      <FormattedAiResponse
                        content={msg.text}
                        sources={msg.sources}
                        sourceReferences={msg.sourceReferences}
                        insufficientEvidence={msg.insufficientEvidence}
                      />
                    )}

                    <div className="chat-ai-meta">
                      <span>{formatTime(msg.timestamp)}</span>
                      {!msg.isError && (
                        <div className="chat-message-actions">
                          <button
                            type="button"
                            className="chat-action-btn"
                            title="Copy response"
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            aria-label="Copy response"
                          >
                            {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* AI Thinking Indicator */}
          {isAsking && (
            <div className="chat-turn-ai">
              <div className="chat-ai-avatar">
                <Bot size={18} />
              </div>
              <div className="chat-thinking-bubble">
                <span
                  className="spinner"
                  style={{
                    width: '16px',
                    height: '16px',
                    borderColor: 'var(--primary-600)',
                    borderTopColor: 'transparent',
                  }}
                />
                <span>Analyzing resume evidence &amp; formulating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Bottom Input Area */}
      <footer className="chat-input-bar-container">
        <div className="chat-input-floating-box">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your resume (e.g. skills, projects, weaknesses)..."
            disabled={isAsking || isResending}
            aria-label="Ask a question about your resume"
          />

          <button
            type="button"
            className="chat-send-btn"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isAsking || isResending}
            aria-label="Send message"
          >
            {isAsking ? (
              <span className="spinner" style={{ width: '16px', height: '16px' }} />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        <div className="chat-bottom-disclaimer">
          ResumeIQ references your uploaded document. Conversational memory is preserved for this session.
        </div>
      </footer>
    </div>
  );
};
