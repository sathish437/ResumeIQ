import React from 'react';
import { motion } from 'motion/react';
import {
  CheckSquare,
  BookOpen,
  FolderGit2,
  FileCheck2,
  Mic2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type {
  NextActionsChecklist,
  PracticalExperienceRecommendation,
} from '../../utils/careerGuidanceEngine';

interface NextActionsChecklistCardProps {
  roleTitle: string;
  nextActions: NextActionsChecklist;
  practicalExperience?: PracticalExperienceRecommendation;
}

export const NextActionsChecklistCard: React.FC<NextActionsChecklistCardProps> = ({
  roleTitle,
  nextActions,
  practicalExperience,
}) => {
  return (
    <motion.section
      className="card"
      id="next-actions-checklist-section"
      aria-label={`Practical Experience and Action Plan for ${roleTitle}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.15 }}
      style={{
        border: '1px solid var(--border-main)',
        backgroundColor: 'var(--bg-surface)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
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
            <CheckSquare size={17} />
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
                Practical Experience & Action Plan
              </h2>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                Action Priorities
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Targeted execution plan to become interview-ready for <strong>{roleTitle}</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Part 1: Portfolio Project Blueprint (if provided) */}
      {practicalExperience && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderGit2 size={15} style={{ color: 'var(--sky-text)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--sky-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                RECOMMENDED PORTFOLIO PROJECT
              </span>
            </div>
            {practicalExperience.focus && (
              <span className="badge badge-sky" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                {practicalExperience.focus}
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {practicalExperience.title}
          </div>

          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
            {practicalExperience.recommendedProject}
          </p>

          {practicalExperience.deliverables && practicalExperience.deliverables.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', marginTop: '2px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--sky-text)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Key Deliverables to Prove:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {practicalExperience.deliverables.map((del, dIdx) => (
                  <span
                    key={dIdx}
                    className="badge badge-gray"
                    style={{ fontSize: '0.68rem', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <CheckCircle2 size={10} style={{ color: 'var(--emerald-500)' }} />
                    {del}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Part 2: 4 Action Pillars Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '10px',
        }}
      >
        {/* 1. What to Learn First */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={12} />
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. LEARN FIRST
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {nextActions.whatToLearnFirst.skill}
          </div>

          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.35, margin: 0 }}>
            {nextActions.whatToLearnFirst.action}
          </p>
        </div>

        {/* 2. What Project to Build */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={12} />
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--sky-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. PROJECT IMPROVEMENT
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {nextActions.whatProjectToBuild.title}
          </div>

          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.35, margin: 0 }}>
            {nextActions.whatProjectToBuild.description}
          </p>
        </div>

        {/* 3. Resume Evidence to Add */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileCheck2 size={12} />
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--emerald-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              3. RESUME EVIDENCE
            </span>
          </div>

          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.35, margin: 0 }}>
            {nextActions.whatResumeEvidenceToAdd.guidance}
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 8px',
              fontSize: '0.7rem',
              color: 'var(--text-main)',
              fontStyle: 'italic',
              lineHeight: 1.3,
            }}
          >
            "{nextActions.whatResumeEvidenceToAdd.exampleBulletPoint}"
          </div>
        </div>

        {/* 4. What to Practise Before Applying */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mic2 size={12} />
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--amber-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              4. INTERVIEW PREP
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {nextActions.whatToPractiseBeforeApplying.topic}
          </div>

          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.35, margin: 0 }}>
            {nextActions.whatToPractiseBeforeApplying.guidance}
          </p>
        </div>
      </div>
    </motion.section>
  );
};

export default NextActionsChecklistCard;
