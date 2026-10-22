import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import {
  Send,
  Bot,
  User,
  AlertCircle,
  FileText,
  RotateCcw,
  BookmarkCheck,
  Globe,
} from 'lucide-react';
import { useResume } from '../context/useResume';
import { askResume } from '../api/client';
import { createMessageId, getCurrentTimestamp } from '../utils/helpers';
import type { ChatMessage, ResumeSource } from '../types/resume';

const SUGGESTED_PROMPTS = [
  'What projects are mentioned in my resume?',
  'What are the main weaknesses or missing details?',
  'How can I improve my technical skills section?',
  "Explain my resume's strongest points.",
  'En resume-la enna enna projects irukku?',
  'என் ரெஸ்யூமில் உள்ள முக்கிய பலங்கள் என்ன?',
];

export const ChatPage: React.FC = () => {
  const { currentResume, chatMessages, setChatMessages, setActiveTab } = useResume();
  const [inputText, setInputText] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isAsking]);

  const handleSend = async (questionToSend?: string) => {
    const question = (questionToSend || inputText).trim();
    if (!question || isAsking) return;

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
    setLastFailedQuestion(null);
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
      setLastFailedQuestion(question);
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
              To ask questions about your resume and get evidence-grounded answers in English, Tamil, or Thanglish, please upload a resume first.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('upload')}
              style={{ padding: '10px 20px' }}
            >
              Upload a Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 128px)',
      }}
    >
      {/* Top Context Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-main)',
          marginBottom: '16px',
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>AI Resume Assistant</span>
            <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>Gemini Active</span>
          </h1>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Active document: <strong>{currentResume.filename}</strong> ({currentResume.characterCount.toLocaleString()} chars)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            className="badge badge-gray"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}
            title="Supports automatic language detection"
          >
            <Globe size={13} />
            <span>English • தமிழ் • Thanglish</span>
          </div>

          {chatMessages.length > 0 && (
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setChatMessages([])}
            >
              <RotateCcw size={13} />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {chatMessages.length === 0 ? (
          <div style={{ margin: 'auto 0', textAlign: 'center', padding: '32px 16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <Bot size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
              Ask Anything About Your Resume
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 20px auto' }}>
              Our assistant answers questions strictly using your uploaded document and provides precise source citations. Supports English, Tamil, and Thanglish.
            </p>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Suggested Prompts
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}
                    onClick={() => handleSend(prompt)}
                  >
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.sender === 'ai' && (
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: msg.isError ? 'var(--rose-50)' : 'var(--primary-600)',
                    color: msg.isError ? 'var(--rose-700)' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {msg.isError ? <AlertCircle size={18} /> : <Bot size={18} />}
                </div>
              )}

              <div
                style={{
                  maxWidth: '80%',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 18px',
                  backgroundColor:
                    msg.sender === 'user'
                      ? 'var(--primary-600)'
                      : msg.isError
                      ? 'var(--rose-50)'
                      : 'var(--bg-surface)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                  border:
                    msg.sender === 'user'
                      ? 'none'
                      : msg.isError
                      ? '1px solid rgba(225, 29, 72, 0.3)'
                      : '1px solid var(--border-main)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>

                {/* Insufficient Evidence Notice */}
                {msg.insufficientEvidence && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: 'var(--amber-700)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>The resume does not contain sufficient verified evidence to fully answer this question.</span>
                  </div>
                )}

                {/* Evidence & Sources List */}
                {msg.sources && msg.sources.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      CITED EVIDENCE SOURCES
                    </div>
                    {msg.sources.map((src: ResumeSource, sIdx: number) => (
                      <div
                        key={sIdx}
                        style={{
                          backgroundColor: 'var(--slate-50)',
                          border: '1px solid var(--border-main)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--primary-600)', marginBottom: '2px' }}>
                          <BookmarkCheck size={12} />
                          <span>{src.reference}</span>
                        </div>
                        {src.evidence && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                            "{src.evidence}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.68rem',
                    color: msg.sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-subtle)',
                    marginTop: '8px',
                    textAlign: 'right',
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--slate-200)',
                    color: 'var(--slate-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <User size={18} />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner Indicator */}
        {isAsking && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-600)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bot size={18} />
            </div>
            <div
              className="card"
              style={{
                padding: '12px 18px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span className="spinner" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }} />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Analyzing resume evidence & formulating response...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Retry prompt if last failed */}
      {lastFailedQuestion && !isAsking && (
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn btn-danger-outline"
            style={{ fontSize: '0.78rem', padding: '4px 12px' }}
            onClick={() => handleSend(lastFailedQuestion)}
          >
            <RotateCcw size={12} />
            <span>Retry: "{lastFailedQuestion}"</span>
          </button>
        </div>
      )}

      {/* Suggested prompts strip if messages exist */}
      {chatMessages.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '8px 0',
            flexShrink: 0,
          }}
        >
          {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, idx) => (
            <button
              key={idx}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
              onClick={() => handleSend(prompt)}
              disabled={isAsking}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div
        style={{
          marginTop: '8px',
          borderTop: '1px solid var(--border-main)',
          paddingTop: '12px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-lg)',
            padding: '8px 12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your resume (English, தமிழ், or Thanglish)..."
            disabled={isAsking}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.92rem',
              color: 'var(--text-main)',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              maxHeight: '120px',
            }}
          />

          <button
            className="btn btn-primary"
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)' }}
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isAsking}
            aria-label="Send message"
          >
            {isAsking ? <span className="spinner" /> : <Send size={16} />}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line</span>
          <span>Conversational memory preserved across session</span>
        </div>
      </div>
    </div>
  );
};
