import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  'What are my strongest technical qualifications?',
  'What important skills or qualifications appear to be missing?',
  'How can I improve my project descriptions and impact?',
  'What roles best match the experience documented in my resume?',
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
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSend = async (questionToSend?: string) => {
    const question = (questionToSend || inputText).trim();
    if (!question || isAsking || isResending) return;

    if (!currentResume) return;

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
          'Failed to receive AI response. Please check backend connection and retry.',
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
      setEditError(err.message || 'Failed to resend question. Please try again.');
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
              <FileText size={28} />
            </div>
            <h2 className="empty-state-title">No Resume Uploaded</h2>
            <p className="empty-state-desc">
              To ask questions about credentials and receive evidence-grounded answers with citations, upload a resume document first.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveTab('analysis')}
              style={{ padding: '9px 18px' }}
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
          <div className="chat-resume-pill" title={currentResume.filename}>
            <FileText size={12} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span className="chat-resume-name">{currentResume.filename}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {chatMessages.length > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.74rem', padding: '3px 8px' }}
              onClick={() => setChatMessages([])}
              title="Clear current conversation"
            >
              <RotateCcw size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="chat-scroll-area">
        <div className="chat-stream">
          {chatMessages.length === 0 ? (
            <motion.div
              className="chat-welcome-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="chat-welcome-icon-box">
                <Bot size={24} />
              </div>
              <h2 className="chat-welcome-title">Resume AI Assistant</h2>
              <p className="chat-welcome-subtitle">
                Ask anything about your uploaded document in English, Tamil, or Tanglish. Answers are backed by exact segment citations.
              </p>

              <div className="chat-suggestions-title">
                Suggested Questions
              </div>
              <div className="chat-suggestions-grid">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    className="chat-suggestion-card"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(prompt)}
                    disabled={isAsking}
                  >
                    <span>{prompt}</span>
                    <Sparkles size={13} className="chat-suggestion-icon" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {chatMessages.map((msg) => {
                if (msg.sender === 'user') {
                  const isEditingThis = editingMessageId === msg.id;

                  if (isEditingThis) {
                    return (
                      <motion.div
                        key={msg.id}
                        className="chat-turn-user"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="chat-edit-box">
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Pencil size={12} style={{ color: '#ef4444' }} />
                            <span>Edit Question</span>
                          </div>

                          <textarea
                            ref={editTextareaRef}
                            className="chat-edit-textarea"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, msg.id)}
                            rows={2}
                            disabled={isResending}
                            placeholder="Edit your question..."
                            aria-label="Edit question"
                          />

                          {editError && (
                            <div className="alert alert-danger" style={{ padding: '6px 10px', margin: 0, fontSize: '0.78rem' }}>
                              <AlertCircle size={13} style={{ flexShrink: 0 }} />
                              <span>{editError}</span>
                            </div>
                          )}

                          <div className="chat-edit-actions">
                            <span className="chat-edit-hint">
                              <strong>Enter</strong> to save • <strong>Esc</strong> to cancel
                            </span>
                            <div className="chat-edit-btn-group">
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                onClick={handleCancelEdit}
                                disabled={isResending}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                onClick={() => handleSaveAndResend(msg.id)}
                                disabled={!editingText.trim() || isResending}
                              >
                                {isResending ? (
                                  <>
                                    <span className="spinner" style={{ width: '12px', height: '12px' }} />
                                    <span>Resending...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send size={12} />
                                    <span>Save &amp; Resend</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={msg.id}
                      className="chat-turn-user"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
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
                            <Pencil size={11} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="chat-action-btn"
                            title="Copy question"
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            aria-label="Copy question"
                          >
                            {copiedId === msg.id ? <Check size={11} style={{ color: 'var(--emerald-500)' }} /> : <Copy size={11} />}
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
                    </motion.div>
                  );
                }

                // AI Message Turn
                return (
                  <motion.div
                    key={msg.id}
                    className="chat-turn-ai"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className={`chat-ai-avatar ${msg.isError ? 'error' : ''}`}>
                      {msg.isError ? <AlertCircle size={16} /> : <Bot size={16} />}
                    </div>

                    <div className={`chat-ai-card ${msg.isError ? 'error' : ''}`}>
                      {msg.isError ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--rose-text)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                            <AlertCircle size={14} />
                            <span>Response Error</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                            {msg.text}
                          </p>
                        </div>
                      ) : (
                        <FormattedAiResponse
                          content={msg.text}
                          sources={msg.sources}
                          sourceReferences={msg.sourceReferences}
                          insufficientEvidence={msg.insufficientEvidence}
                          collapsibleSources={true}
                          documentName={currentResume?.filename}
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
                              {copiedId === msg.id ? <Check size={11} style={{ color: 'var(--emerald-500)' }} /> : <Copy size={11} />}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {/* AI Thinking Indicator */}
          {isAsking && (
            <motion.div
              className="chat-turn-ai"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
            >
              <div className="chat-ai-avatar">
                <Bot size={16} />
              </div>
              <div className="chat-thinking-bubble">
                <span className="spinner" style={{ width: '14px', height: '14px' }} />
                <span>Formulating response with document evidence...</span>
              </div>
            </motion.div>
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

          <motion.button
            type="button"
            className="chat-send-btn"
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isAsking || isResending}
            aria-label="Send message"
          >
            {isAsking ? (
              <span className="spinner" style={{ width: '14px', height: '14px', borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
            ) : (
              <Send size={14} />
            )}
          </motion.button>
        </div>

        <div className="chat-bottom-disclaimer">
          Grounded in document evidence. Sources stay collapsed by default.
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
