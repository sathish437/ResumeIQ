import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Sparkles,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Target,
  FileCheck,
} from 'lucide-react';
import type { RecommendedJobRole } from '../../utils/careerGuidanceEngine';

interface RoleSkillGapQuadrantProps {
  role: RecommendedJobRole;
  isDeepAnalyzing?: boolean;
  onTriggerDeepAnalysis?: () => void;
  hasDeepAiData?: boolean;
}

export const RoleSkillGapQuadrant: React.FC<RoleSkillGapQuadrantProps> = ({
  role,
  isDeepAnalyzing = false,
  onTriggerDeepAnalysis,
  hasDeepAiData = false,
}) => {
  // Track expanded skill IDs: e.g. "already-Java", "improve-Docker", "learn-Kubernetes"
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'have' | 'improve' | 'learn'>('all');

  const toggleSkill = (key: string) => {
    setExpandedSkills((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    const allKeys: Record<string, boolean> = {};
    role.alreadyHave.forEach((item) => { allKeys[`have-${item.skill}`] = true; });
    role.needToImprove.forEach((item) => { allKeys[`improve-${item.skill}`] = true; });
    role.needToLearn.forEach((item) => { allKeys[`learn-${item.skill}`] = true; });
    setExpandedSkills(allKeys);
  };

  const collapseAll = () => {
    setExpandedSkills({});
  };

  const isAnyExpanded = Object.values(expandedSkills).some(Boolean);

  return (
    <motion.section
      className="card"
      id="selected-role-skill-gap-section"
      aria-label={`Skill Gap Analysis for ${role.title}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.08 }}
      style={{
        border: '1px solid var(--border-main)',
        backgroundColor: 'var(--bg-surface)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header with Title and Deep Verification button */}
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
              Selected Role
            </span>
            {hasDeepAiData && (
              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                <Sparkles size={10} style={{ marginRight: '3px' }} />
                AI Verified
              </span>
            )}
          </div>
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              margin: '2px 0',
            }}
          >
            {role.title} — Skill Gap Analysis
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', margin: 0 }}>
            Click on any skill to inspect verified resume proof, evidence gaps, or learning steps.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            onClick={isAnyExpanded ? collapseAll : expandAll}
          >
            {isAnyExpanded ? 'Collapse Details' : 'Expand Details'}
          </button>

          {onTriggerDeepAnalysis && (
            <motion.button
              type="button"
              className="btn btn-primary"
              whileTap={{ scale: 0.97 }}
              onClick={onTriggerDeepAnalysis}
              disabled={isDeepAnalyzing}
              style={{
                fontSize: '0.74rem',
                padding: '5px 10px',
              }}
              title="Run deep AI verification for this role"
            >
              {isDeepAnalyzing ? (
                <>
                  <span className="spinner" style={{ width: '11px', height: '11px' }} />
                  <span>Verifying Evidence...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>{hasDeepAiData ? 'Re-verify with AI' : 'Deep AI Verification'}</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: categoryFilter === 'all' ? '1px solid #dc2626' : '1px solid var(--border-main)',
            backgroundColor: categoryFilter === 'all' ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-surface-subtle)',
            color: categoryFilter === 'all' ? '#ef4444' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          All Categories ({role.alreadyHave.length + role.needToImprove.length + role.needToLearn.length})
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('have')}
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: categoryFilter === 'have' ? '1px solid var(--emerald-500)' : '1px solid var(--border-main)',
            backgroundColor: categoryFilter === 'have' ? 'var(--emerald-subtle)' : 'var(--bg-surface-subtle)',
            color: categoryFilter === 'have' ? 'var(--emerald-text)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <CheckCircle2 size={12} />
          <span>Already Have ({role.alreadyHave.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('improve')}
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: categoryFilter === 'improve' ? '1px solid var(--amber-500)' : '1px solid var(--border-main)',
            backgroundColor: categoryFilter === 'improve' ? 'var(--amber-subtle)' : 'var(--bg-surface-subtle)',
            color: categoryFilter === 'improve' ? 'var(--amber-text)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <AlertTriangle size={12} />
          <span>Need to Improve ({role.needToImprove.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('learn')}
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: categoryFilter === 'learn' ? '1px solid var(--rose-500)' : '1px solid var(--border-main)',
            backgroundColor: categoryFilter === 'learn' ? 'var(--rose-subtle)' : 'var(--bg-surface-subtle)',
            color: categoryFilter === 'learn' ? 'var(--rose-text)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <XCircle size={12} />
          <span>Need to Learn ({role.needToLearn.length})</span>
        </button>
      </div>

      {/* 3 Categories Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: categoryFilter === 'all' ? 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' : '1fr',
          gap: '12px',
        }}
      >
        {/* Category 1: Already Have */}
        {(categoryFilter === 'all' || categoryFilter === 'have') && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--emerald-500)' }} />
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Already Have
                </h3>
                <span className="badge badge-success" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                  {role.alreadyHave.length}
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                Resume Evidence
              </span>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
              Skills directly supported by your verified projects and experience.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {role.alreadyHave.length === 0 ? (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  No explicit matching skills found in resume.
                </div>
              ) : (
                role.alreadyHave.map((item, idx) => {
                  const key = `have-${item.skill}`;
                  const isExpanded = !!expandedSkills[key];

                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSkill(key)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {item.skill}
                          </span>
                          {item.supportingProjects && item.supportingProjects.length > 0 && (
                            <span className="badge badge-gray" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                              {item.supportingProjects.length} project(s)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-success" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                            Verified
                          </span>
                          {isExpanded ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              padding: '0 10px 8px 10px',
                              borderTop: '1px solid var(--border-subtle)',
                              paddingTop: '6px',
                            }}
                          >
                            {item.supportingProjects && item.supportingProjects.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                {item.supportingProjects.map((p, pIdx) => (
                                  <span key={pIdx} className="badge badge-gray" style={{ fontSize: '0.64rem', padding: '1px 4px' }}>
                                    <Briefcase size={9} style={{ marginRight: '3px' }} />
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.evidence && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                                <FileCheck size={10} style={{ display: 'inline', marginRight: '4px', color: 'var(--emerald-500)' }} />
                                {item.evidence}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Category 2: Need to Improve */}
        {(categoryFilter === 'all' || categoryFilter === 'improve') && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} style={{ color: 'var(--amber-text)' }} />
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Need to Improve
                </h3>
                <span className="badge badge-amber" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                  {role.needToImprove.length}
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                Needs Proof
              </span>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
              Mentioned in resume but lacking metrics or production project depth.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {role.needToImprove.length === 0 ? (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', padding: '6px' }}>
                  All detected skills have corresponding project support in your resume.
                </div>
              ) : (
                role.needToImprove.map((item, idx) => {
                  const key = `improve-${item.skill}`;
                  const isExpanded = !!expandedSkills[key];

                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSkill(key)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          {item.skill}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-amber" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                            Needs Depth
                          </span>
                          {isExpanded ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              padding: '0 10px 8px 10px',
                              borderTop: '1px solid var(--border-subtle)',
                              paddingTop: '6px',
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35, marginBottom: '4px' }}>
                              <strong>Gap:</strong> {item.issue}
                            </div>
                            <div
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-main)',
                                backgroundColor: 'var(--bg-surface-subtle)',
                                padding: '4px 6px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-main)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '4px',
                              }}
                            >
                              <Lightbulb size={10} style={{ color: 'var(--amber-text)', flexShrink: 0, marginTop: '2px' }} />
                              <span><strong>Action:</strong> {item.recommendation}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Category 3: Need to Learn */}
        {(categoryFilter === 'all' || categoryFilter === 'learn') && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <XCircle size={15} style={{ color: 'var(--rose-text)' }} />
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Need to Learn
                </h3>
                <span className="badge badge-danger" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                  {role.needToLearn.length}
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                Missing from Resume
              </span>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
              Standard industry technologies for this role not identified in your resume.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {role.needToLearn.length === 0 ? (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', padding: '6px' }}>
                  No missing requirements detected for this role.
                </div>
              ) : (
                role.needToLearn.map((item, idx) => {
                  const key = `learn-${item.skill}`;
                  const isExpanded = !!expandedSkills[key];

                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSkill(key)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          {item.skill}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-danger" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                            To Learn
                          </span>
                          {isExpanded ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              padding: '0 10px 8px 10px',
                              borderTop: '1px solid var(--border-subtle)',
                              paddingTop: '6px',
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', color: 'var(--rose-text)', lineHeight: 1.35, marginBottom: '4px' }}>
                              <strong>Importance:</strong> {item.importance}
                            </div>
                            <div
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-main)',
                                backgroundColor: 'var(--bg-surface-subtle)',
                                padding: '4px 6px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-main)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '4px',
                              }}
                            >
                              <Target size={10} style={{ color: 'var(--amber-text)', flexShrink: 0, marginTop: '2px' }} />
                              <span><strong>Action:</strong> {item.learningAction}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default RoleSkillGapQuadrant;
