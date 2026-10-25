import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Target, RotateCcw, Briefcase } from 'lucide-react';
import { useResume } from '../../context/useResume';
import {
  extractCareerProfile,
  evaluateRecommendedRoles,
  buildCustomTargetRole,
  type RecommendedJobRole,
} from '../../utils/careerGuidanceEngine';
import { CareerProfileCard } from './CareerProfileCard';
import { RecommendedRolesSection } from './RecommendedRolesSection';
import { RoleSkillGapQuadrant } from './RoleSkillGapQuadrant';
import { PersonalizedRoadmapSection } from './PersonalizedRoadmapSection';
import {
  CustomJobDescriptionPanel,
  type CustomTargetMetadata,
} from './CustomJobDescriptionPanel';

export const SkillGapAnalysisSection: React.FC = () => {
  const {
    currentResume,
    analysis,
    skillGapAnalysis,
    isAnalyzingSkillGap,
    skillGapError,
    handleRunSkillGap,
    handleClearSkillGap,
  } = useResume();

  // 1. Extract Profile Data from Analysis
  const careerProfile = useMemo(() => {
    if (!analysis) return null;
    return extractCareerProfile(analysis);
  }, [analysis]);

  // 2. Evaluate Recommended Roles based on Resume Evidence
  const recommendedRoles = useMemo(() => {
    if (!analysis) return [];
    return evaluateRecommendedRoles(analysis, skillGapAnalysis);
  }, [analysis, skillGapAnalysis]);

  // 3. Selection & Active Target Mode State
  const [customTarget, setCustomTarget] = useState<CustomTargetMetadata | null>(() => {
    if (!skillGapAnalysis) return null;
    const isKnown = recommendedRoles.some(
      (r) => r.title.toLowerCase() === skillGapAnalysis.targetRoleOrJobDescription.toLowerCase()
    );
    if (!isKnown) {
      return {
        roleTitle: skillGapAnalysis.targetRoleOrJobDescription.split('\n')[0].replace(/^Target Role:\s*/i, '').trim(),
        rawText: skillGapAnalysis.targetRoleOrJobDescription,
        mode: skillGapAnalysis.targetRoleOrJobDescription.includes('\n') ? 'jd' : 'role',
      };
    }
    return null;
  });

  const [activeTargetMode, setActiveTargetMode] = useState<'recommended' | 'custom'>(() => {
    if (!skillGapAnalysis) return 'recommended';
    const isKnown = recommendedRoles.some(
      (r) => r.title.toLowerCase() === skillGapAnalysis.targetRoleOrJobDescription.toLowerCase()
    );
    return isKnown ? 'recommended' : 'custom';
  });

  const [userSelectedRoleId, setUserSelectedRoleId] = useState<string>('');

  // Derive active recommended role
  const selectedRecommendedRoleId = useMemo(() => {
    if (userSelectedRoleId && recommendedRoles.some((r) => r.id === userSelectedRoleId)) {
      return userSelectedRoleId;
    }
    return recommendedRoles[0]?.id || '';
  }, [userSelectedRoleId, recommendedRoles]);

  const selectedRecommendedRole: RecommendedJobRole | undefined = useMemo(() => {
    return (
      recommendedRoles.find((r) => r.id === selectedRecommendedRoleId) ||
      recommendedRoles[0]
    );
  }, [recommendedRoles, selectedRecommendedRoleId]);

  // Build custom role dynamically if custom target is active
  const customRole: RecommendedJobRole | null = useMemo(() => {
    if (!customTarget || !analysis) return null;
    return buildCustomTargetRole(
      customTarget.rawText,
      analysis,
      skillGapAnalysis,
      customTarget.companyName,
      customTarget.roleTitle
    );
  }, [customTarget, analysis, skillGapAnalysis]);

  // Active Role across the entire page
  const activeRole: RecommendedJobRole | undefined = useMemo(() => {
    if (activeTargetMode === 'custom' && customRole) {
      return customRole;
    }
    return selectedRecommendedRole;
  }, [activeTargetMode, customRole, selectedRecommendedRole]);

  // Check if current active role has deep AI data from the backend
  const hasDeepAiData = useMemo(() => {
    if (!skillGapAnalysis || !activeRole) return false;
    const normAi = skillGapAnalysis.targetRoleOrJobDescription.toLowerCase();
    const normRole = activeRole.title.toLowerCase();
    return normAi.includes(normRole) || normRole.includes(normAi) || activeTargetMode === 'custom';
  }, [skillGapAnalysis, activeRole, activeTargetMode]);

  // Trigger Deep AI Verification for the selected recommended role
  const handleTriggerDeepAnalysis = async () => {
    if (!activeRole || isAnalyzingSkillGap) return;
    await handleRunSkillGap(activeRole.title);
  };

  // Run Custom Job Description or Custom Role Comparison
  const handleRunCustomComparison = async (
    formattedText: string,
    metadata: CustomTargetMetadata
  ) => {
    setCustomTarget(metadata);
    const result = await handleRunSkillGap(formattedText);
    if (result) {
      setActiveTargetMode('custom');
    }
  };

  // Clear Custom Target
  const handleClearCustomTarget = () => {
    setCustomTarget(null);
    setActiveTargetMode('recommended');
    handleClearSkillGap();
  };

  // Handle selecting a recommended role
  const handleSelectRecommendedRole = async (role: RecommendedJobRole) => {
    setUserSelectedRoleId(role.id);
    setActiveTargetMode('recommended');
    const normRole = role.title.toLowerCase();
    const isAlreadyMatching = skillGapAnalysis && (
      skillGapAnalysis.targetRoleOrJobDescription.toLowerCase().includes(normRole) ||
      normRole.includes(skillGapAnalysis.targetRoleOrJobDescription.toLowerCase())
    );
    if (!isAlreadyMatching && !isAnalyzingSkillGap) {
      await handleRunSkillGap(role.title);
    }
  };

  if (!analysis || !careerProfile || recommendedRoles.length === 0) {
    return null;
  }

  return (
    <div
      id="resume-career-guidance-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        width: '100%',
      }}
    >
      {/* Skill Gap Error Alert (if backend call fails) */}
      {skillGapError && (
        <div className="alert alert-danger" role="alert" style={{ margin: 0 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Analysis Notification</div>
            <div>{skillGapError}</div>
          </div>
        </div>
      )}

      {/* Section A: Career Profile */}
      <CareerProfileCard
        profile={careerProfile}
        filename={currentResume?.filename}
      />

      {/* Section 1: Career Fit — Recommended Roles */}
      <RecommendedRolesSection
        roles={recommendedRoles}
        selectedRoleId={activeTargetMode === 'recommended' ? selectedRecommendedRoleId : ''}
        onSelectRole={handleSelectRecommendedRole}
      />

      {/* Section 2: Compare with a Custom Job Description or Role (Optional) */}
      {/* Placed immediately after Career Fit — Recommended Roles as required */}
      <CustomJobDescriptionPanel
        onRunComparison={handleRunCustomComparison}
        isAnalyzing={isAnalyzingSkillGap}
        error={skillGapError}
        activeCustomTarget={customTarget}
        onClearCustomTarget={handleClearCustomTarget}
        recommendedRoleTitles={recommendedRoles.map((r) => r.title)}
      />

      {/* Prominent Active Target Banner */}
      {activeRole && (
        <motion.div
          id="active-target-role-banner"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: activeTargetMode === 'custom'
              ? 'rgba(239, 68, 68, 0.08)'
              : 'var(--bg-surface-subtle)',
            border: activeTargetMode === 'custom'
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeTargetMode === 'custom' ? '#ef4444' : '#1f2937',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: activeTargetMode === 'custom' ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
              }}
            >
              {activeTargetMode === 'custom' ? <Target size={18} /> : <Briefcase size={18} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, color: 'var(--text-muted)' }}>
                  Active Target
                </span>
                <span
                  className={activeTargetMode === 'custom' ? 'badge badge-primary' : 'badge badge-success'}
                  style={{ fontSize: '0.66rem', padding: '1px 6px' }}
                >
                  {activeTargetMode === 'custom' ? 'Custom Benchmark' : activeRole.fitBadge}
                </span>
              </div>

              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em',
                  marginTop: '1px',
                }}
              >
                {activeTargetMode === 'custom' ? `Custom — ${activeRole.title}` : activeRole.title}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {activeTargetMode === 'custom'
                  ? 'Requirements, skill gap categorization, and personalized 6-stage roadmap below are tailored to this custom target.'
                  : 'Skill gap categorization, personalized 6-stage roadmap, and portfolio action plan below are tailored to this recommended role.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {activeTargetMode === 'custom' && selectedRecommendedRole && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.74rem', padding: '5px 10px' }}
                onClick={() => setActiveTargetMode('recommended')}
              >
                <RotateCcw size={12} />
                <span>Switch to Recommended Role ({selectedRecommendedRole.title.split(' ')[0]}...)</span>
              </button>
            )}

            {activeTargetMode === 'recommended' && customRole && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.74rem', padding: '5px 10px' }}
                onClick={() => setActiveTargetMode('custom')}
              >
                <Target size={12} style={{ color: '#ef4444' }} />
                <span>Resume Custom Benchmark</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Section C: Selected Role — Skill Gap Analysis */}
      {activeRole && (
        <RoleSkillGapQuadrant
          key={`skill-gap-${activeRole.id}`}
          role={activeRole}
          isDeepAnalyzing={isAnalyzingSkillGap}
          onTriggerDeepAnalysis={handleTriggerDeepAnalysis}
          hasDeepAiData={hasDeepAiData}
        />
      )}

      {/* Section D: Personalized 6-Step Learning Roadmap */}
      {activeRole && (
        <PersonalizedRoadmapSection
          key={`roadmap-${currentResume?.resumeId || 'default'}-${activeRole.id}`}
          roleTitle={activeRole.title}
          roleId={activeRole.id}
          resumeId={currentResume?.resumeId || 'default'}
          steps={activeRole.roadmap}
        />
      )}
    </div>
  );
};

export default SkillGapAnalysisSection;
