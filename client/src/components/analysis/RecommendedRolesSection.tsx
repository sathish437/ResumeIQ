import React from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Star,
} from 'lucide-react';
import type { RecommendedJobRole } from '../../utils/careerGuidanceEngine';

interface RecommendedRolesSectionProps {
  roles: RecommendedJobRole[];
  selectedRoleId: string;
  onSelectRole: (role: RecommendedJobRole) => void;
}

export const RecommendedRolesSection: React.FC<RecommendedRolesSectionProps> = ({
  roles,
  selectedRoleId,
  onSelectRole,
}) => {
  return (
    <motion.section
      className="card"
      id="recommended-roles-section"
      aria-label="Recommended Job Roles Based on Resume Evidence"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05 }}
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
            <Briefcase size={17} />
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
                Career Fit — Recommended Roles
              </h2>
              <span className="badge badge-gray" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                Ranked by Evidence
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Select a target role to inspect its skill gaps, roadmap, and customized action plan.
            </div>
          </div>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '12px',
        }}
      >
        {roles.map((role) => {
          const isSelected = role.id === selectedRoleId;
          const isTopFit = role.fitRank === 1;

          return (
            <motion.div
              key={role.id}
              role="button"
              tabIndex={0}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectRole(role)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRole(role);
                }
              }}
              style={{
                backgroundColor: isSelected
                  ? 'var(--primary-subtle)'
                  : 'var(--bg-surface-subtle)',
                border: isSelected
                  ? '1.5px solid #dc2626'
                  : isTopFit
                  ? '1px solid rgba(220, 38, 38, 0.35)'
                  : '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
                boxShadow: isSelected
                  ? '0 0 0 1px rgba(220, 38, 38, 0.3), var(--shadow-sm)'
                  : 'none',
                position: 'relative',
              }}
            >
              <div>
                {/* Badges & Role Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isTopFit && (
                      <span
                        className="badge badge-primary"
                        style={{ fontSize: '0.64rem', padding: '1px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Star size={10} fill="currentColor" />
                        Strongest Match
                      </span>
                    )}
                    <span
                      className={isSelected ? 'badge badge-primary' : 'badge badge-gray'}
                      style={{ fontSize: '0.64rem', padding: '1px 6px' }}
                    >
                      {role.fitBadge}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                    {role.category}
                  </span>
                </div>

                {/* Role Title */}
                <h3
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    margin: '0 0 6px 0',
                    lineHeight: 1.3,
                  }}
                >
                  {role.title}
                </h3>

                {/* Suitability Rationale */}
                <p
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    margin: '0 0 10px 0',
                  }}
                >
                  {role.fitRationale}
                </p>

                {/* Quick Fit Ratio Pills */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--emerald-text)',
                      backgroundColor: 'var(--emerald-subtle)',
                      border: '1px solid var(--emerald-border)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={11} />
                    <span>{role.matchedSkills.length} Matching</span>
                  </div>

                  {role.skillsToDevelop.length > 0 && (
                    <div
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--rose-text)',
                        backgroundColor: 'var(--rose-subtle)',
                        border: '1px solid var(--rose-border)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <AlertCircle size={11} />
                      <span>{role.skillsToDevelop.length} Missing</span>
                    </div>
                  )}
                </div>

                {/* Compact Skills Preview */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '10px' }}>
                  {role.matchedSkills.slice(0, 4).map((m, sIdx) => (
                    <span
                      key={sIdx}
                      className="badge badge-success"
                      style={{ fontSize: '0.66rem', padding: '1px 5px' }}
                      title={`Verified: ${m.evidence}`}
                    >
                      {m.skill}
                    </span>
                  ))}
                  {role.matchedSkills.length > 4 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', alignSelf: 'center' }}>
                      +{role.matchedSkills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Card Action */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '8px',
                  marginTop: 'auto',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                  {role.supportingProjects.length > 0
                    ? `${role.supportingProjects.length} supporting project(s)`
                    : 'Skills-backed match'}
                </span>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: isSelected ? 'var(--primary-600)' : 'var(--text-main)',
                  }}
                >
                  {isSelected ? (
                    <>
                      <Sparkles size={12} style={{ color: '#ef4444' }} />
                      <span>Viewing Analysis</span>
                    </>
                  ) : (
                    <>
                      <span>Select Role</span>
                      <ChevronRight size={12} />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export default RecommendedRolesSection;
