import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  CheckCircle2,
  Circle,
  Target,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
} from 'lucide-react';
import type { RoadmapStep } from '../../utils/careerGuidanceEngine';

interface PersonalizedRoadmapSectionProps {
  roleTitle: string;
  roleId: string;
  resumeId: string;
  steps: RoadmapStep[];
}

export const PersonalizedRoadmapSection: React.FC<PersonalizedRoadmapSectionProps> = ({
  roleTitle,
  roleId,
  resumeId,
  steps,
}) => {
  const storageKey = `resumeiq_roadmap_${resumeId}_${roleId}`;

  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Expand first incomplete step by default
  const [expandedStepId, setExpandedStepId] = useState<string>(() => {
    const firstIncomplete = steps.find((s) => !completedSteps[s.id]);
    return firstIncomplete?.id || steps[0]?.id || '';
  });

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const updated = { ...prev, [stepId]: !prev[stepId] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save roadmap progress:', e);
      }
      return updated;
    });
  };

  const handleResetProgress = () => {
    setCompletedSteps({});
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error('Failed to reset roadmap progress:', e);
    }
  };

  const completedCount = steps.filter((s) => completedSteps[s.id]).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <motion.section
      className="card"
      id="personalized-roadmap-section"
      aria-label={`Personalized Learning Roadmap for ${roleTitle}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.12 }}
      style={{
        border: '1px solid var(--border-main)',
        backgroundColor: 'var(--bg-surface)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header and Progress Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
              flexShrink: 0,
            }}
          >
            <Compass size={17} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Learning Roadmap Timeline
              </h2>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                6 Sequential Steps
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Ordered progression for <strong>{roleTitle}</strong> based on your current resume evidence.
            </div>
          </div>
        </div>

        {/* Progress Counter & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              minWidth: '150px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                PROGRESS
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: progressPercent === 100 ? 'var(--emerald-text)' : 'var(--text-main)' }}>
                {completedCount}/6 ({progressPercent}%)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '5px',
                backgroundColor: 'var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: progressPercent === 100 ? '#10b981' : '#dc2626',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {completedCount > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '5px 8px', fontSize: '0.7rem' }}
              onClick={handleResetProgress}
              title="Reset roadmap checklist"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Sequential Stepper / Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
        {steps.map((step, idx) => {
          const isDone = !!completedSteps[step.id];
          const isExpanded = expandedStepId === step.id;

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                gap: '12px',
                position: 'relative',
              }}
            >
              {/* Stepper Node & Connecting Line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  aria-label={isDone ? `Mark Step ${step.stepNumber} incomplete` : `Mark Step ${step.stepNumber} complete`}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isDone ? '#10b981' : 'var(--bg-surface-subtle)',
                    border: isDone ? '1px solid #10b981' : '1.5px solid var(--border-main)',
                    color: isDone ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    zIndex: 2,
                    boxShadow: isDone ? '0 1px 4px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title={isDone ? 'Completed (click to undo)' : 'Mark completed'}
                >
                  {isDone ? <CheckCircle2 size={14} /> : step.stepNumber}
                </button>

                {/* Vertical Line to next step */}
                {idx < steps.length - 1 && (
                  <div
                    style={{
                      width: '2px',
                      flex: 1,
                      backgroundColor: isDone ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                      margin: '4px 0',
                    }}
                  />
                )}
              </div>

              {/* Step Card Content */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: isDone ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-surface-subtle)',
                  border: isDone ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: idx < steps.length - 1 ? '4px' : '0',
                }}
              >
                {/* Step Header Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedStepId(isExpanded ? '' : step.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        color: isDone ? 'var(--emerald-text)' : '#ef4444',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      STEP {step.stepNumber}
                    </span>

                    <h3
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                        margin: 0,
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}
                    >
                      {step.title}
                    </h3>

                    {step.focus && (
                      <span className="badge badge-gray" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        {step.focus}
                      </span>
                    )}

                    {step.dependencies && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          color: 'var(--text-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Clock size={10} />
                        {step.dependencies}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStep(step.id);
                      }}
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        border: isDone ? '1px solid var(--emerald-border)' : '1px solid var(--border-subtle)',
                        backgroundColor: isDone ? 'var(--emerald-subtle)' : 'var(--bg-surface)',
                        color: isDone ? 'var(--emerald-text)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {isDone ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                      <span>{isDone ? 'Done' : 'Mark Done'}</span>
                    </button>

                    {isExpanded ? (
                      <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                    ) : (
                      <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                </div>

                {/* Step Details (Expandable) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '8px',
                        marginTop: '4px',
                      }}
                    >
                      {/* What to do & Why it matters */}
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                        <strong style={{ color: 'var(--text-main)', marginRight: '4px' }}>Objective:</strong>
                        {step.whatToDo}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <HelpCircle size={11} style={{ flexShrink: 0, marginTop: '3px', color: 'var(--text-subtle)' }} />
                        <span><strong>Why it matters:</strong> {step.whyItMatters}</span>
                      </div>

                      {/* Practical Measurable Task Box */}
                      <div
                        style={{
                          backgroundColor: isDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
                          border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '6px 10px',
                          fontSize: '0.74rem',
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <Target size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>Completion Criterion: </strong>
                          {step.practicalTask}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
};

export default PersonalizedRoadmapSection;
