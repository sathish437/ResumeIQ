import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  UserCheck,
  Code2,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Server,
  Database,
  Cloud,
  Terminal,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { CareerProfileData } from '../../utils/careerGuidanceEngine';

interface CareerProfileCardProps {
  profile: CareerProfileData;
  filename?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Languages: <Code2 size={12} style={{ color: '#ef4444' }} />,
  Frontend: <Cpu size={12} style={{ color: '#38bdf8' }} />,
  Backend: <Server size={12} style={{ color: '#10b981' }} />,
  Databases: <Database size={12} style={{ color: '#f59e0b' }} />,
  Cloud: <Cloud size={12} style={{ color: '#a855f7' }} />,
  Tools: <Terminal size={12} style={{ color: '#94a3b8' }} />,
};

export const CareerProfileCard: React.FC<CareerProfileCardProps> = ({ profile, filename }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAllSkills, setShowAllSkills] = useState(false);

  // Group detected skills for clean presentation
  const categorizedSkills = useMemo(() => {
    const groups: Record<string, string[]> = {
      Languages: [],
      Frontend: [],
      Backend: [],
      Databases: [],
      Cloud: [],
      Tools: [],
    };

    profile.allDetectedSkills.forEach((skill) => {
      const lower = skill.toLowerCase();
      if (/java$|python|javascript|typescript|c\+\+|c#|golang|go$|rust|ruby|php|kotlin|swift|sql$/i.test(lower)) {
        groups.Languages.push(skill);
      } else if (/react|vue|angular|html|css|tailwind|next|redux|zustand|svelte/i.test(lower)) {
        groups.Frontend.push(skill);
      } else if (/spring|node|express|django|fastapi|rest|microservices|graphql|grpc|kafka|rabbitmq/i.test(lower)) {
        groups.Backend.push(skill);
      } else if (/postgres|mysql|mongo|redis|sqlite|oracle|dynamodb|cassandra/i.test(lower)) {
        groups.Databases.push(skill);
      } else if (/aws|azure|gcp|docker|kubernetes|terraform|ci\/cd|helm|linux/i.test(lower)) {
        groups.Cloud.push(skill);
      } else {
        groups.Tools.push(skill);
      }
    });

    return Object.entries(groups).filter((entry) => entry[1].length > 0);
  }, [profile.allDetectedSkills]);

  // Skills to display based on selected category tab
  const displayedSkills = useMemo(() => {
    if (selectedCategory === 'All') {
      return profile.allDetectedSkills;
    }
    const found = categorizedSkills.find(([cat]) => cat === selectedCategory);
    return found ? found[1] : profile.allDetectedSkills;
  }, [selectedCategory, categorizedSkills, profile.allDetectedSkills]);

  const visibleSkills = showAllSkills ? displayedSkills : displayedSkills.slice(0, 14);

  return (
    <motion.div
      className="card"
      id="career-profile-section"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        border: '1px solid var(--border-main)',
        backgroundColor: 'var(--bg-surface)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Overview Header & Experience Level */}
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
            <UserCheck size={17} />
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
                Candidate Career Profile
              </h2>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                Resume Evidence
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Analyzed from <strong>{filename || 'active resume'}</strong>
            </div>
          </div>
        </div>

        {/* Experience Level Pill */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          title={profile.apparentLevel.evidence}
        >
          <ShieldCheck size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--primary-text)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              EXPERIENCE EVIDENCE
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {profile.apparentLevel.level}
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Technical Summary Callout */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-main)',
          padding: '10px 12px',
          fontSize: '0.82rem',
          color: 'var(--text-main)',
          lineHeight: 1.45,
        }}
      >
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginRight: '6px' }}>
          SUMMARY:
        </span>
        {profile.technicalSummary}
      </div>

      {/* Grid: Detected Skills & Key Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
        {/* Left: Detected Technical Stack */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Layers size={13} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Detected Skills
              </span>
              <span className="badge badge-gray" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                {profile.totalSkillsCount}
              </span>
            </div>

            {displayedSkills.length > 14 && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                onClick={() => setShowAllSkills((prev) => !prev)}
              >
                {showAllSkills ? (
                  <>
                    <span>Compact</span>
                    <ChevronUp size={10} />
                  </>
                ) : (
                  <>
                    <span>+{displayedSkills.length - 14} More</span>
                    <ChevronDown size={10} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <button
              type="button"
              onClick={() => { setSelectedCategory('All'); setShowAllSkills(false); }}
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                border: selectedCategory === 'All' ? '1px solid #dc2626' : '1px solid transparent',
                backgroundColor: selectedCategory === 'All' ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                color: selectedCategory === 'All' ? '#ef4444' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              All ({profile.totalSkillsCount})
            </button>
            {categorizedSkills.map(([cat, sks]) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setSelectedCategory(cat); setShowAllSkills(false); }}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedCategory === cat ? '1px solid #dc2626' : '1px solid transparent',
                  backgroundColor: selectedCategory === cat ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                  color: selectedCategory === cat ? '#ef4444' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {CATEGORY_ICONS[cat]}
                <span>{cat} ({sks.length})</span>
              </button>
            ))}
          </div>

          {/* Skill Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '36px' }}>
            {visibleSkills.length === 0 ? (
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                No explicit skills recorded in this category.
              </div>
            ) : (
              visibleSkills.map((skill, sIdx) => {
                const isProjectBacked = profile.projectTechnologies.some(
                  (pt) => pt.toLowerCase() === skill.toLowerCase()
                );
                return (
                  <span
                    key={sIdx}
                    className={isProjectBacked ? 'badge badge-success' : 'badge badge-gray'}
                    style={{ fontSize: '0.7rem', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    title={isProjectBacked ? 'Verified in both skills section & projects' : 'Found in skills section'}
                  >
                    {isProjectBacked && <CheckCircle2 size={10} />}
                    {skill}
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Documented Projects & Applications */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Briefcase size={13} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Documented Projects
            </span>
            <span className="badge badge-gray" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
              {profile.totalProjectsCount}
            </span>
          </div>

          {profile.keyProjects.length === 0 ? (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              No structured project entries identified in this resume. Adding portfolio projects will significantly improve role matching.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {profile.keyProjects.slice(0, 3).map((proj, pIdx) => (
                <div
                  key={pIdx}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                      {proj.name || `Project ${pIdx + 1}`}
                    </span>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="badge badge-gray" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                        {proj.technologies.length} tech
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3, marginBottom: '3px' }}>
                      {proj.description.length > 90 ? `${proj.description.slice(0, 90)}...` : proj.description}
                    </div>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {proj.technologies.slice(0, 4).map((tech, tIdx) => (
                        <span key={tIdx} className="badge badge-sky" style={{ fontSize: '0.64rem', padding: '1px 4px' }}>
                          {tech}
                        </span>
                      ))}
                      {proj.technologies.length > 4 && (
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-subtle)', alignSelf: 'center' }}>
                          +{proj.technologies.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CareerProfileCard;
