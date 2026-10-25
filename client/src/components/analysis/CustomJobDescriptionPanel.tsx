import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Target,
  RotateCcw,
  AlertCircle,
  Briefcase,
  Search,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';

export interface CustomTargetMetadata {
  roleTitle?: string;
  companyName?: string;
  rawText: string;
  mode: 'role' | 'jd';
}

interface CustomJobDescriptionPanelProps {
  onRunComparison: (
    targetRoleOrJd: string,
    metadata: CustomTargetMetadata
  ) => Promise<void>;
  isAnalyzing: boolean;
  error?: string | null;
  activeCustomTarget?: CustomTargetMetadata | null;
  onClearCustomTarget?: () => void;
  recommendedRoleTitles?: string[];
}

interface PredefinedRoleItem {
  domain: string;
  title: string;
}

const PREDEFINED_ROLES: PredefinedRoleItem[] = [
  // Backend Development
  { domain: 'Backend Development', title: 'Junior Java Backend Developer' },
  { domain: 'Backend Development', title: 'Senior Java & Spring Boot Engineer' },
  { domain: 'Backend Development', title: 'Java & Microservices Backend Engineer' },
  { domain: 'Backend Development', title: 'Python Backend Developer (FastAPI / Django)' },
  { domain: 'Backend Development', title: 'Go Backend Systems Engineer' },
  { domain: 'Backend Development', title: 'Node.js & Express API Developer' },

  // Full Stack Development
  { domain: 'Full Stack Development', title: 'Full Stack Java & React Developer' },
  { domain: 'Full Stack Development', title: 'Full Stack Developer (React & Node.js)' },
  { domain: 'Full Stack Development', title: 'Full Stack Python & Vue Engineer' },
  { domain: 'Full Stack Development', title: 'MERN Stack Developer' },

  // Frontend Development
  { domain: 'Frontend Development', title: 'React & TypeScript Frontend Engineer' },
  { domain: 'Frontend Development', title: 'Modern Frontend Software Engineer' },
  { domain: 'Frontend Development', title: 'Next.js Frontend Developer' },
  { domain: 'Frontend Development', title: 'Angular Enterprise Frontend Engineer' },

  // Data Engineering
  { domain: 'Data Engineering', title: 'Data Pipeline & ETL Software Engineer' },
  { domain: 'Data Engineering', title: 'Big Data & Spark Pipeline Engineer' },
  { domain: 'Data Engineering', title: 'Cloud Data Platform & Analytics Engineer (dbt / Snowflake)' },

  // AI & Machine Learning
  { domain: 'AI & Machine Learning', title: 'AI & Machine Learning Engineer' },
  { domain: 'AI & Machine Learning', title: 'Generative AI & LLM Systems Engineer' },
  { domain: 'AI & Machine Learning', title: 'Machine Learning Software Engineer (PyTorch)' },

  // DevOps & Cloud
  { domain: 'DevOps & Cloud', title: 'DevOps Engineer (CI/CD & Containers)' },
  { domain: 'DevOps & Cloud', title: 'Cloud Infrastructure Engineer (AWS & Terraform)' },
  { domain: 'DevOps & Cloud', title: 'Site Reliability Engineer (SRE)' },

  // QA & Testing
  { domain: 'QA & Testing', title: 'QA Automation Engineer (Selenium & Playwright)' },
  { domain: 'QA & Testing', title: 'Software Development Engineer in Test (SDET)' },

  // Mobile Development
  { domain: 'Mobile Development', title: 'React Native Mobile Developer' },
  { domain: 'Mobile Development', title: 'iOS / Android Mobile Engineer' },
];

export const CustomJobDescriptionPanel: React.FC<CustomJobDescriptionPanelProps> = ({
  onRunComparison,
  isAnalyzing,
  error,
  activeCustomTarget,
  onClearCustomTarget,
  recommendedRoleTitles = [],
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(Boolean(activeCustomTarget));
  const [activeTab, setActiveTab] = useState<'role' | 'jd'>(activeCustomTarget?.mode || 'role');

  // Option A state
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [selectedPresetRole, setSelectedPresetRole] = useState(
    activeCustomTarget?.mode === 'role' ? activeCustomTarget.roleTitle || '' : ''
  );
  const [customRoleInput, setCustomRoleInput] = useState('');

  // Option B state
  const [jobDescriptionText, setJobDescriptionText] = useState(
    activeCustomTarget?.mode === 'jd' ? activeCustomTarget.rawText : ''
  );
  const [companyName, setCompanyName] = useState(activeCustomTarget?.companyName || '');
  const [jobTitle, setJobTitle] = useState(
    activeCustomTarget?.mode === 'jd' ? activeCustomTarget.roleTitle || '' : ''
  );

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filtered preset roles
  const filteredRoles = useMemo(() => {
    if (!roleSearchQuery.trim()) return PREDEFINED_ROLES;
    const query = roleSearchQuery.toLowerCase();
    return PREDEFINED_ROLES.filter(
      (r) => r.title.toLowerCase().includes(query) || r.domain.toLowerCase().includes(query)
    );
  }, [roleSearchQuery]);

  const handleSelectRole = (title: string) => {
    setSelectedPresetRole(title);
    setCustomRoleInput('');
    setValidationError(null);
  };

  const handleCustomRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomRoleInput(e.target.value);
    setSelectedPresetRole('');
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (activeTab === 'role') {
      const targetTitle = (customRoleInput || selectedPresetRole).trim();
      if (!targetTitle) {
        setValidationError('Please select a predefined job role or enter a custom role title.');
        return;
      }
      if (isAnalyzing) return;

      await onRunComparison(targetTitle, {
        roleTitle: targetTitle,
        rawText: targetTitle,
        mode: 'role',
      });
    } else {
      const cleanJd = jobDescriptionText.trim();
      if (!cleanJd || cleanJd.length < 30) {
        setValidationError(
          'Please enter a meaningful job description (at least 30 characters) to benchmark requirements.'
        );
        return;
      }
      if (isAnalyzing) return;

      // Format rich context for backend AI prompt
      let formatted = '';
      if (jobTitle.trim() && companyName.trim()) {
        formatted += `Target Role: ${jobTitle.trim()} at ${companyName.trim()}\n\n`;
      } else if (jobTitle.trim()) {
        formatted += `Target Role: ${jobTitle.trim()}\n\n`;
      } else if (companyName.trim()) {
        formatted += `Target Company: ${companyName.trim()}\n\n`;
      }
      formatted += `Job Description:\n${cleanJd}`;

      await onRunComparison(formatted, {
        roleTitle: jobTitle.trim() || undefined,
        companyName: companyName.trim() || undefined,
        rawText: cleanJd,
        mode: 'jd',
      });
    }
  };

  const handleClear = () => {
    setSelectedPresetRole('');
    setCustomRoleInput('');
    setJobDescriptionText('');
    setCompanyName('');
    setJobTitle('');
    setValidationError(null);
    if (onClearCustomTarget) {
      onClearCustomTarget();
    }
  };

  return (
    <div
      id="custom-benchmark-panel"
      style={{
        border: activeCustomTarget ? '1px solid #ef4444' : '1px solid var(--border-main)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface)',
        overflow: 'hidden',
        boxShadow: activeCustomTarget ? '0 0 0 1px rgba(239, 68, 68, 0.2)' : 'none',
      }}
    >
      {/* Panel Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-main)',
          textAlign: 'left',
        }}
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Target size={17} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Compare with a Custom Job Description or Role (Optional)
              </span>
              {activeCustomTarget && (
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  Active Custom Target
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Choose a target role or paste a job description to compare its requirements with your resume and generate a personalized learning roadmap.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Panel Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: '0 20px 20px 20px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {/* Active Target Info pill if active */}
            {activeCustomTarget && (
              <div
                style={{
                  marginTop: '14px',
                  marginBottom: '14px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={15} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Active Target: Custom — {activeCustomTarget.roleTitle || 'Custom Job Description Target'}
                    {activeCustomTarget.companyName ? ` (${activeCustomTarget.companyName})` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={handleClear}
                  disabled={isAnalyzing}
                >
                  <RotateCcw size={11} />
                  <span>Clear Custom Benchmark</span>
                </button>
              </div>
            )}

            {/* Error notifications */}
            {(error || validationError) && (
              <div
                className="alert alert-danger"
                style={{ marginTop: '12px', marginBottom: '12px' }}
                role="alert"
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem' }}>{validationError || error}</span>
              </div>
            )}

            {/* Option A vs Option B Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '8px',
              }}
            >
              <button
                type="button"
                className={`btn ${activeTab === 'role' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                onClick={() => {
                  setActiveTab('role');
                  setValidationError(null);
                }}
                disabled={isAnalyzing}
              >
                <Briefcase size={13} />
                <span>Option A — Choose a Job Role</span>
              </button>

              <button
                type="button"
                className={`btn ${activeTab === 'jd' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                onClick={() => {
                  setActiveTab('jd');
                  setValidationError(null);
                }}
                disabled={isAnalyzing}
              >
                <FileText size={13} />
                <span>Option B — Paste a Job Description</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Option A: Searchable predefined roles + custom title input */}
              {activeTab === 'role' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Search box for predefined roles */}
                  <div>
                    <label
                      htmlFor="role-search-input"
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginBottom: '6px',
                      }}
                    >
                      Search Predefined Job Roles across Technical Domains:
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                        }}
                      />
                      <input
                        id="role-search-input"
                        type="text"
                        placeholder="Search domains or titles (e.g., Backend, Java, React, Data, DevOps, QA, Cloud)..."
                        value={roleSearchQuery}
                        onChange={(e) => setRoleSearchQuery(e.target.value)}
                        disabled={isAnalyzing}
                        style={{
                          width: '100%',
                          padding: '7px 10px 7px 32px',
                          fontSize: '0.8rem',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-main)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Predefined roles selection grid */}
                  <div
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
                      gap: '6px',
                      backgroundColor: 'var(--bg-surface-subtle)',
                    }}
                  >
                    {filteredRoles.map((item, idx) => {
                      const isSelected = selectedPresetRole === item.title;
                      const isRecommended = recommendedRoleTitles.some((t) =>
                        t.toLowerCase().includes(item.title.toLowerCase())
                      );

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectRole(item.title)}
                          disabled={isAnalyzing}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                            backgroundColor: isSelected
                              ? 'rgba(239, 68, 68, 0.12)'
                              : 'var(--bg-surface)',
                            color: 'var(--text-main)',
                            fontSize: '0.74rem',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: isSelected ? 700 : 500 }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                              {item.domain} {isRecommended && '• In Recommended Roles'}
                            </div>
                          </div>
                          {isSelected && <Check size={12} style={{ color: '#ef4444', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Role Input */}
                  <div>
                    <label
                      htmlFor="custom-role-input"
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginBottom: '6px',
                      }}
                    >
                      Or enter a custom role title not listed above:
                    </label>
                    <input
                      id="custom-role-input"
                      type="text"
                      placeholder="e.g., Embedded C++ Firmware Engineer, Rust Systems Developer, Security Analyst..."
                      value={customRoleInput}
                      onChange={handleCustomRoleChange}
                      disabled={isAnalyzing}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '0.82rem',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        border: customRoleInput.trim()
                          ? '1px solid #ef4444'
                          : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-main)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Option B: Complete Job Description Textarea + Metadata */}
              {activeTab === 'jd' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="jd-job-title"
                        style={{
                          display: 'block',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          marginBottom: '4px',
                        }}
                      >
                        Target Job Title (Optional):
                      </label>
                      <input
                        id="jd-job-title"
                        type="text"
                        placeholder="e.g., Senior Platform Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        disabled={isAnalyzing}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          fontSize: '0.8rem',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-main)',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="jd-company-name"
                        style={{
                          display: 'block',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          marginBottom: '4px',
                        }}
                      >
                        Company Name (Optional):
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Building2
                          size={14}
                          style={{
                            position: 'absolute',
                            left: '9px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                          }}
                        />
                        <input
                          id="jd-company-name"
                          type="text"
                          placeholder="e.g., Stripe, Amazon, Spotify"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          disabled={isAnalyzing}
                          style={{
                            width: '100%',
                            padding: '7px 10px 7px 30px',
                            fontSize: '0.8rem',
                            backgroundColor: 'var(--bg-surface-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="jd-textarea"
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginBottom: '4px',
                      }}
                    >
                      Complete Job Description:
                    </label>
                    <textarea
                      id="jd-textarea"
                      rows={6}
                      placeholder="Paste the full job description here, including responsibilities, required technical skills, and preferred qualifications..."
                      value={jobDescriptionText}
                      onChange={(e) => setJobDescriptionText(e.target.value)}
                      disabled={isAnalyzing}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '0.82rem',
                        fontFamily: 'inherit',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-main)',
                        resize: 'vertical',
                      }}
                      aria-label="Complete Job Description"
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '4px',
                        fontSize: '0.7rem',
                        color: 'var(--text-subtle)',
                      }}
                    >
                      <span>
                        Distinguishes required skills from preferred skills automatically without treating nice-to-haves as hard blockers.
                      </span>
                      <span>{jobDescriptionText.length} characters</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                }}
              >
                {activeCustomTarget && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.76rem', padding: '6px 12px' }}
                    onClick={handleClear}
                    disabled={isAnalyzing}
                  >
                    <RotateCcw size={12} />
                    <span>Clear Custom Target</span>
                  </button>
                )}

                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  whileTap={{ scale: 0.97 }}
                  style={{ fontSize: '0.82rem', padding: '7px 18px' }}
                  disabled={
                    isAnalyzing ||
                    (activeTab === 'role' && !selectedPresetRole && !customRoleInput.trim()) ||
                    (activeTab === 'jd' && !jobDescriptionText.trim())
                  }
                >
                  {isAnalyzing ? (
                    <>
                      <span className="spinner" style={{ width: '13px', height: '13px' }} />
                      <span>Analyzing & Generating Roadmap...</span>
                    </>
                  ) : (
                    <>
                      <Target size={14} />
                      <span>Analyze & Generate Roadmap</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomJobDescriptionPanel;
