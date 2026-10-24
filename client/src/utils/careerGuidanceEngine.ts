import type {
  ResumeAnalysisResponse,
  SkillGapAnalysisResponse,
  ProjectDetail,
} from '../types/resume';

export interface ApparentExperienceLevel {
  level: string;
  evidence: string;
  confidence: 'high' | 'moderate' | 'limited';
}

export interface CareerProfileData {
  technicalSummary: string;
  apparentLevel: ApparentExperienceLevel;
  totalSkillsCount: number;
  totalProjectsCount: number;
  explicitSkills: string[];
  projectTechnologies: string[];
  allDetectedSkills: string[];
  keyProjects: ProjectDetail[];
}

export interface MatchedEvidenceSkill {
  skill: string;
  supportingProjects: string[];
  evidence: string;
}

export interface MissingRoleSkill {
  skill: string;
  importance: string;
  learningAction: string;
  status: 'Not found in resume';
}

export interface WeakEvidenceSkill {
  skill: string;
  issue: string;
  recommendation: string;
}

export interface PracticalExperienceRecommendation {
  title: string;
  focus: string;
  recommendedProject: string;
  deliverables: string[];
}

export interface RoadmapStep {
  id: string;
  stepNumber: number;
  title: string;
  focus: string;
  whatToDo: string;
  whyItMatters: string;
  practicalTask: string;
  dependencies?: string;
  estimatedEffort?: string;
}

export interface NextActionsChecklist {
  whatToLearnFirst: {
    skill: string;
    action: string;
  };
  whatProjectToBuild: {
    title: string;
    description: string;
  };
  whatResumeEvidenceToAdd: {
    guidance: string;
    exampleBulletPoint: string;
  };
  whatToPractiseBeforeApplying: {
    topic: string;
    guidance: string;
  };
}

export interface RecommendedJobRole {
  id: string;
  title: string;
  category: string;
  fitRank: number;
  fitBadge: string;
  fitRationale: string;
  matchedSkills: MatchedEvidenceSkill[];
  skillsToDevelop: string[];
  supportingProjects: string[];
  alreadyHave: MatchedEvidenceSkill[];
  needToImprove: WeakEvidenceSkill[];
  needToLearn: MissingRoleSkill[];
  practicalExperience: PracticalExperienceRecommendation;
  roadmap: RoadmapStep[];
  nextActions: NextActionsChecklist;
  isCustomTarget?: boolean;
}

interface RoleBenchmarkTemplate {
  id: string;
  category: string;
  titleGenerator: (matchedSkills: string[]) => string;
  coreSkills: string[];
  recommendedComplementarySkills: string[];
  skillLearningActions: Record<string, { importance: string; action: string }>;
  projectBlueprintGenerator: (matched: string[], missing: string[]) => PracticalExperienceRecommendation;
  roadmapGenerator: (matched: string[], missing: string[], roleTitle: string) => RoadmapStep[];
  nextActionsGenerator: (matched: string[], missing: string[], roleTitle: string) => NextActionsChecklist;
}

const ROLE_BENCHMARK_TEMPLATES: RoleBenchmarkTemplate[] = [
  // 1. Backend Engineer Track
  {
    id: 'backend-engineer',
    category: 'Backend Engineering',
    titleGenerator: (matched) => {
      const lower = matched.map((s) => s.toLowerCase());
      if (lower.some((s) => s.includes('java') || s.includes('spring'))) {
        return 'Java & Spring Boot Backend Engineer';
      }
      if (lower.some((s) => s.includes('python') || s.includes('django') || s.includes('fastapi'))) {
        return 'Python Backend Engineer (FastAPI/Django)';
      }
      if (lower.some((s) => s.includes('node') || s.includes('express') || s.includes('nest'))) {
        return 'Node.js Backend Systems Engineer';
      }
      if (lower.some((s) => s.includes('go') || s.includes('golang'))) {
        return 'Go Distributed Systems Engineer';
      }
      if (lower.some((s) => s.includes('c#') || s.includes('.net'))) {
        return '.NET Core Backend Engineer';
      }
      return 'Backend Software Engineer';
    },
    coreSkills: [
      'Java', 'Spring Boot', 'Python', 'Node.js', 'Go', 'C#', '.NET', 'SQL',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'REST APIs', 'Microservices',
      'Docker', 'Git', 'Kafka', 'RabbitMQ', 'GraphQL', 'gRPC', 'JUnit', 'Linux'
    ],
    recommendedComplementarySkills: [
      'Redis', 'Kafka', 'Docker', 'Kubernetes', 'PostgreSQL', 'CI/CD', 'Microservices', 'System Design'
    ],
    skillLearningActions: {
      'Redis': {
        importance: 'In-memory caching is essential for low-latency backend architectures.',
        action: 'Implement cache-aside pattern with Redis for database query caching and session state.',
      },
      'Kafka': {
        importance: 'Industry standard for distributed event streaming and asynchronous microservices.',
        action: 'Build an event-driven producer-consumer pipeline with Spring/Node and Kafka brokers.',
      },
      'Docker': {
        importance: 'Standard containerization format for reproducible deployments and cloud hosting.',
        action: 'Create multi-stage Dockerfiles and containerize backend microservices with docker-compose.',
      },
      'Kubernetes': {
        importance: 'Primary container orchestration platform used by modern enterprise engineering teams.',
        action: 'Deploy containerized services to a local Minikube cluster with ConfigMaps and Deployments.',
      },
      'PostgreSQL': {
        importance: 'Dominant enterprise relational database with robust ACID transactions and indexing.',
        action: 'Design normalized schemas with indexed foreign keys and optimize slow queries with EXPLAIN.',
      },
      'Microservices': {
        importance: 'Crucial architectural paradigm for decoupled, independently scalable systems.',
        action: 'Decompose a monolithic endpoint into two communicating services via REST or gRPC.',
      },
      'CI/CD': {
        importance: 'Automated test and build pipelines are non-negotiable in production engineering.',
        action: 'Configure a GitHub Actions workflow to run automated unit tests and build container images.',
      },
      'System Design': {
        importance: 'Required for technical rounds evaluating scalability, caching, and database partitioning.',
        action: 'Study high-level design patterns: rate limiting, load balancing, sharding, and idempotency.',
      },
    },
    projectBlueprintGenerator: (matched, missing) => {
      const primaryLang = matched[0] || 'Java / Python / Node.js';
      const keyMissing = missing[0] || 'Kafka';
      return {
        title: 'Distributed Event-Driven Service with Asynchronous Processing',
        focus: `Bridge existing ${primaryLang} proficiency with ${keyMissing} for production-grade backend depth.`,
        recommendedProject: `Design and implement an asynchronous order/payment processing service using ${primaryLang}, backed by PostgreSQL and ${keyMissing}, with structured logging and Dockerized deployment.`,
        deliverables: [
          'RESTful API with request validation and idempotency keys',
          `Event publishing and consumer retry logic with ${keyMissing}`,
          'Database migration scripts (Flyway/Liquibase) and indexed queries',
          'Automated unit & integration tests achieving >80% code coverage',
        ],
      };
    },
    roadmapGenerator: (matched, missing, roleTitle) => {
      const topMissing = missing.slice(0, 2).join(' & ') || 'Advanced Caching & Message Queuing';
      const primaryLang = matched[0] || 'Core Backend Languages';
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Deepen Backend Architecture Fundamentals',
          focus: `Solidify core ${primaryLang} design patterns and database transaction management.`,
          whatToDo: `Audit your current code for clean SOLID principles, connection pooling, and resilient error handling in ${primaryLang}.`,
          whyItMatters: 'Enterprise backend roles require writing maintainable, clean code that avoids memory leaks and race conditions.',
          practicalTask: `Refactor an existing ${primaryLang} service layer to use repository pattern and comprehensive unit tests with Mockito/JUnit.`,
          dependencies: '',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: `Address Core Missing Requirement: ${topMissing}`,
          focus: `Hands-on implementation of ${topMissing} to meet enterprise hiring requirements.`,
          whatToDo: `Study official documentation and implement hands-on exercises for ${topMissing} in an isolated playground.`,
          whyItMatters: `${topMissing} is frequently listed as a required qualification on job descriptions for ${roleTitle}.`,
          practicalTask: `Build a standalone prototype incorporating ${topMissing} and benchmark its throughput and failure recovery.`,
          dependencies: 'Prerequisite: Step 1',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Production Database Optimization & Caching',
          focus: 'Schema indexing, query performance tuning, and Redis cache-aside patterns.',
          whatToDo: 'Write complex relational queries, examine query plans with EXPLAIN ANALYZE, and introduce Redis caching.',
          whyItMatters: 'Database bottlenecks are the #1 performance issue in real-world production web services.',
          practicalTask: 'Add Redis query caching to your primary service, reducing simulated query response time by >60%.',
          dependencies: 'Prerequisite: Step 2',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Build Distributed System Project with Docker',
          focus: 'Containerized deployment of multi-service application with Docker and docker-compose.',
          whatToDo: 'Create multi-stage Dockerfiles for your backend services and orchestrate them with database and message broker.',
          whyItMatters: 'Recruiters look for verifiable projects showing you can package and run code in isolated cloud environments.',
          practicalTask: 'Publish a clean GitHub repository containing docker-compose.yml and instructions to spin up the entire system in 1 command.',
          dependencies: 'Prerequisite: Step 3',
          estimatedEffort: '2-3 weeks',
        },
        {
          id: 'step-5',
          stepNumber: 5,
          title: 'System Design & High-Throughput Scenarios',
          focus: 'Rate limiting, load balancing, idempotency, and asynchronous worker queues.',
          whatToDo: 'Implement token-bucket rate limiting and idempotent request processing on your REST endpoints.',
          whyItMatters: 'System design questions distinguish senior candidates who know how to protect APIs under heavy load.',
          practicalTask: 'Document architecture decisions (ADR) in your repository and simulate 500 req/sec load test with k6.',
          dependencies: 'Prerequisite: Step 4',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-6',
          stepNumber: 6,
          title: `Interview Rehearsal & ${roleTitle} Applications`,
          focus: 'Live coding prep, technical storytelling, and targeted role applications.',
          whatToDo: `Practice explaining architectural decisions made in Step 4 and apply to ${roleTitle} openings.`,
          whyItMatters: 'Targeted applications with verifiable project evidence achieve significantly higher interview callbacks.',
          practicalTask: 'Apply to 5 targeted companies with tailored resume bullets highlighting your new production backend architecture.',
          dependencies: 'Prerequisite: Step 5',
          estimatedEffort: 'Ongoing',
        },
      ];
    },
    nextActionsGenerator: (matched, missing) => {
      const firstLearn = missing[0] || 'Kafka';
      const secondLearn = missing[1] || 'Redis';
      return {
        whatToLearnFirst: {
          skill: firstLearn,
          action: `Study the fundamentals of ${firstLearn} and build a local proof-of-concept project.`,
        },
        whatProjectToBuild: {
          title: `Distributed Event Processor with ${matched[0] || 'Spring/Node'} & ${firstLearn}`,
          description: `Build an asynchronous transaction pipeline handling order creation, inventory deduction, and email alerts via ${firstLearn} events.`,
        },
        whatResumeEvidenceToAdd: {
          guidance: `Add quantified bullet points highlighting latency reductions, throughput numbers, and ${firstLearn}/${secondLearn} integration.`,
          exampleBulletPoint: `Architected an event-driven payment service using ${matched[0] || 'Java/Spring Boot'} and ${firstLearn}, reducing synchronous API latency by 45% and processing 1,200+ concurrent requests.`,
        },
        whatToPractiseBeforeApplying: {
          topic: 'Database indexing strategies, transaction isolation levels (ACID), and distributed locking.',
          guidance: 'Be ready to draw service architecture on a whiteboard and explain how your database handles deadlocks.',
        },
      };
    },
  },

  // 2. Full Stack Developer Track
  {
    id: 'fullstack-engineer',
    category: 'Full Stack Engineering',
    titleGenerator: (matched) => {
      const lower = matched.map((s) => s.toLowerCase());
      if (lower.some((s) => s.includes('java')) && lower.some((s) => s.includes('react') || s.includes('vue') || s.includes('angular'))) {
        return 'Java Full Stack Developer (React & Spring Boot)';
      }
      if (lower.some((s) => s.includes('react') || s.includes('node') || s.includes('typescript'))) {
        return 'Full Stack TypeScript & React Developer';
      }
      if (lower.some((s) => s.includes('python')) && lower.some((s) => s.includes('react') || s.includes('javascript'))) {
        return 'Python & React Full Stack Developer';
      }
      return 'Full Stack Software Engineer';
    },
    coreSkills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'Spring Boot',
      'Python', 'HTML5', 'CSS3', 'Tailwind', 'PostgreSQL', 'MongoDB', 'REST APIs',
      'Next.js', 'Express', 'Git', 'Docker', 'GraphQL', 'Redux', 'Zustand'
    ],
    recommendedComplementarySkills: [
      'TypeScript', 'Next.js', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'State Management (Zustand/Redux)', 'CI/CD'
    ],
    skillLearningActions: {
      'TypeScript': {
        importance: 'Modern industry standard for type safety across frontend UI components and Node backends.',
        action: 'Migrate JavaScript components and API contracts to strictly typed TypeScript interfaces.',
      },
      'Next.js': {
        importance: 'Leading full stack React framework for server-side rendering, routing, and SEO optimization.',
        action: 'Build a server-rendered web application with App Router, Server Actions, and API routes.',
      },
      'State Management': {
        importance: 'Essential for maintaining clean global state in interactive, multi-view web applications.',
        action: 'Implement centralized state management using Zustand or Redux Toolkit with persistent storage.',
      },
      'Tailwind CSS': {
        importance: 'Standard utility-first styling system used for rapid, responsive UI development.',
        action: 'Build a responsive mobile-first dashboard layout with dark mode using modern CSS/Tailwind.',
      },
      'PostgreSQL': {
        importance: 'Industry standard relational database for structured web application data.',
        action: 'Design a clean relational schema with foreign key constraints, indexes, and parameterized queries.',
      },
      'Docker': {
        importance: 'Ensures the frontend client and backend API run identically across all development environments.',
        action: 'Create a docker-compose setup spinning up client, backend API, and database containers.',
      },
      'CI/CD': {
        importance: 'Automates testing and build checks before merging pull requests.',
        action: 'Setup GitHub Actions pipeline to run linting, unit tests, and production bundle builds.',
      },
    },
    projectBlueprintGenerator: (matched, missing) => {
      const topTech = matched.slice(0, 2).join(' & ') || 'React & Node.js';
      const keyMissing = missing[0] || 'TypeScript';
      return {
        title: 'End-to-End SaaS Web Application with Authentication & Data Visualization',
        focus: `Connect your ${topTech} experience with ${keyMissing} for complete full-stack mastery.`,
        recommendedProject: `Build a production-ready web application featuring role-based authentication, real-time data updates, responsive UI with dark/light themes, and automated end-to-end API communication.`,
        deliverables: [
          `Strictly typed TypeScript client & server with shared schema validation`,
          'Interactive dashboard with responsive mobile, tablet, and desktop layouts',
          'JWT or session-based authentication with secure cookie storage',
          'Automated deployment setup with Docker or Vercel/Render hosting',
        ],
      };
    },
    roadmapGenerator: (_matched, missing, roleTitle) => {
      const primaryMissing = missing[0] || 'TypeScript';
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Strengthen Frontend UI & Responsive Foundations',
          focus: 'Component reusability, semantic HTML, modern styling, and mobile-first responsiveness.',
          whatToDo: 'Audit existing UI projects to eliminate inline style inconsistencies and implement a coherent design system.',
          whyItMatters: 'Full stack developers must demonstrate clean design aesthetics and responsive frontend skills to hiring teams.',
          practicalTask: 'Build a reusable component library (Button, Modal, Input, Card) with dark/light mode support.',
          dependencies: '',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: `Implement Type Safety with ${primaryMissing}`,
          focus: `End-to-end type safety between API responses and UI state using ${primaryMissing}.`,
          whatToDo: `Learn ${primaryMissing} interfaces, generics, and union types. Replace all 'any' types in code.`,
          whyItMatters: `${primaryMissing} is now required in over 85% of full-stack engineering postings to prevent runtime errors.`,
          practicalTask: `Convert at least 3 major components and your API client to strict ${primaryMissing}.`,
          dependencies: 'Prerequisite: Step 1',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Backend API Design & Database Integration',
          focus: 'RESTful endpoints, input validation, database transactions, and relational schema modeling.',
          whatToDo: 'Develop a structured backend with input sanitization, error middleware, and clean DB migrations.',
          whyItMatters: 'Connects the frontend interface with a robust, production-ready persistence layer.',
          practicalTask: 'Create 5 CRUD endpoints with pagination, search filtering, and relational joins.',
          dependencies: 'Prerequisite: Step 2',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Full Stack End-to-End Application Project',
          focus: 'Complete application integrating authentication, state management, and real-time feedback.',
          whatToDo: 'Build out the complete SaaS application blueprint with authentication and state management.',
          whyItMatters: 'This serves as your primary portfolio centerpiece during recruiter screening.',
          practicalTask: 'Deploy the full stack project online with a live public URL and clean GitHub README.',
          dependencies: 'Prerequisite: Step 3',
          estimatedEffort: '2-3 weeks',
        },
        {
          id: 'step-5',
          stepNumber: 5,
          title: 'Testing, Accessibility & Production Optimization',
          focus: 'Unit tests, WCAG accessibility checks, bundle size reduction, and SEO optimization.',
          whatToDo: 'Run Lighthouse audits on your app, add automated component tests, and optimize asset loading.',
          whyItMatters: 'Demonstrates senior-level attention to detail beyond basic prototype building.',
          practicalTask: 'Achieve >90 Lighthouse score on Performance and Accessibility, with passing automated tests.',
          dependencies: 'Prerequisite: Step 4',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-6',
          stepNumber: 6,
          title: `Portfolio Presentation & ${roleTitle} Applications`,
          focus: 'Resume polish with quantifiable metrics and strategic outreach to hiring teams.',
          whatToDo: `Craft resume bullet points showcasing full-stack architectural scope and apply to ${roleTitle} roles.`,
          whyItMatters: 'Demonstrating complete product ownership from UI to database is the greatest advantage of a full stack engineer.',
          practicalTask: 'Submit 5 tailored applications with demo video links or live preview deployments.',
          dependencies: 'Prerequisite: Step 5',
          estimatedEffort: 'Ongoing',
        },
      ];
    },
    nextActionsGenerator: (matched, missing) => {
      const firstLearn = missing[0] || 'TypeScript';
      return {
        whatToLearnFirst: {
          skill: firstLearn,
          action: `Convert a component or build a small project strictly in ${firstLearn}.`,
        },
        whatProjectToBuild: {
          title: 'Complete SaaS Web Application with Authentication & Analytics Dashboard',
          description: `Build an end-to-end full stack web app featuring responsive UI, PostgreSQL database, and automated deployments.`,
        },
        whatResumeEvidenceToAdd: {
          guidance: 'Highlight full stack ownership from database design to responsive frontend components.',
          exampleBulletPoint: `Engineered a full stack web platform using ${matched[0] || 'React'} and ${matched[1] || 'Node/Spring'}, integrating PostgreSQL and achieving sub-200ms API response times across 20+ responsive views.`,
        },
        whatToPractiseBeforeApplying: {
          topic: 'Frontend state management lifecycle, asynchronous API handling, and database indexing.',
          guidance: 'Be ready to code a responsive UI component and its corresponding backend endpoint in live technical rounds.',
        },
      };
    },
  },

  // 3. Frontend Engineer Track
  {
    id: 'frontend-engineer',
    category: 'Frontend Engineering',
    titleGenerator: (matched) => {
      const lower = matched.map((s) => s.toLowerCase());
      if (lower.some((s) => s.includes('react') || s.includes('next'))) {
        return 'React & TypeScript Frontend Engineer';
      }
      if (lower.some((s) => s.includes('vue'))) {
        return 'Vue.js Frontend Developer';
      }
      if (lower.some((s) => s.includes('angular'))) {
        return 'Angular Enterprise Frontend Developer';
      }
      return 'Modern Frontend Software Engineer';
    },
    coreSkills: [
      'JavaScript', 'TypeScript', 'React', 'HTML5', 'CSS3', 'Tailwind',
      'Next.js', 'Redux', 'Zustand', 'Vue', 'Angular', 'Webpack', 'Vite',
      'Jest', 'Cypress', 'Git', 'REST APIs', 'GraphQL', 'Responsive Design'
    ],
    recommendedComplementarySkills: [
      'TypeScript', 'Next.js', 'Tailwind CSS', 'Testing (Jest/React Testing Library)', 'State Management', 'Web Performance (Core Web Vitals)'
    ],
    skillLearningActions: {
      'TypeScript': {
        importance: 'Mandatory standard in modern frontend engineering for bulletproof props and state.',
        action: 'Implement typed component props, event handlers, and API response generics.',
      },
      'Testing': {
        importance: 'Automated frontend testing guarantees UI regression protection.',
        action: 'Write unit tests for UI components with Vitest/Jest and user event testing with React Testing Library.',
      },
      'Web Performance': {
        importance: 'Core Web Vitals directly determine user retention and search ranking.',
        action: 'Optimize images, implement code-splitting with dynamic import(), and minimize bundle size.',
      },
      'Tailwind CSS': {
        importance: 'Rapid modern UI development without bloated CSS files.',
        action: 'Design an accessible design system with customizable color tokens and dark mode.',
      },
    },
    projectBlueprintGenerator: (matched) => {
      const primaryUi = matched[0] || 'React';
      return {
        title: 'Interactive Web Application with Design System & High-Performance Rendering',
        focus: `Demonstrate mastery of ${primaryUi}, state management, and accessible UI engineering.`,
        recommendedProject: `Develop a polished web application featuring complex state interactions, client-side data filtering, keyboard accessibility, and a customizable component design system.`,
        deliverables: [
          'Design system with reusable inputs, modal dialogs, and navigation drawers',
          'Optimized bundle with zero layout shifts (CLS < 0.05) and fast paint',
          'Automated component test suite covering edge cases and loading states',
          'Full keyboard accessibility (WCAG 2.1 AA compliant) with screen reader support',
        ],
      };
    },
    roadmapGenerator: (_matched, missing, roleTitle) => {
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Master Modern JavaScript & DOM Architecture',
          focus: 'ES6+ features, closures, event loop, promises, and browser rendering lifecycle.',
          whatToDo: 'Deep-dive into async/await, debouncing, throttling, and DOM layout recalculation optimization.',
          whyItMatters: 'Frontend technical interview rounds heavily scrutinize core JavaScript mechanics.',
          practicalTask: 'Build a custom search autocomplete widget with debounced input and keyboard arrow navigation.',
          dependencies: '',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: `Type-Safe Component Architecture with ${missing[0] || 'TypeScript'}`,
          focus: 'Strict typing for component props, polymorphic components, and hook returns.',
          whatToDo: `Refactor your core UI components to use strict ${missing[0] || 'TypeScript'} generics.`,
          whyItMatters: 'Eliminates runtime errors and makes code self-documenting for engineering teams.',
          practicalTask: 'Create generic, reusable Table and Form components with strict TypeScript inference.',
          dependencies: 'Prerequisite: Step 1',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'State Architecture & Client-Side Caching',
          focus: 'Server state management (TanStack Query / SWR) vs global UI state (Zustand).',
          whatToDo: 'Separate server data caching from local interactive state to eliminate unnecessary re-renders.',
          whyItMatters: 'Prevents state bugs, stale data, and poor app performance under heavy user interaction.',
          practicalTask: 'Implement optimistic UI updates and cache invalidation in your project.',
          dependencies: 'Prerequisite: Step 2',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Design System Implementation & Accessibility',
          focus: 'WCAG AA compliance, ARIA attributes, semantic HTML, and fluid dark/light styling.',
          whatToDo: 'Build accessible dialogs, dropdowns, and tabs with full keyboard navigation and focus traps.',
          whyItMatters: 'Accessibility is legally required for enterprise applications and signals senior craft.',
          practicalTask: 'Pass automated axe-core audits with 0 critical or serious accessibility violations.',
          dependencies: 'Prerequisite: Step 3',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-5',
          stepNumber: 5,
          title: 'Automated Frontend Testing & Performance Tuning',
          focus: 'Component unit testing with Vitest/React Testing Library, code splitting, and bundle analyzer.',
          whatToDo: 'Write tests verifying user interactions and use bundle analysis to prune heavy third-party packages.',
          whyItMatters: 'Demonstrates ability to maintain long-term production quality in fast-shipping teams.',
          practicalTask: 'Achieve >85% test coverage on shared components and sub-100kB initial JS chunk size.',
          dependencies: 'Prerequisite: Step 4',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-6',
          stepNumber: 6,
          title: `Showcase & Targeted ${roleTitle} Applications`,
          focus: 'Portfolio polish, live deployment links, and strategic outreach.',
          whatToDo: `Deploy interactive demo with source code links and apply to ${roleTitle} openings.`,
          whyItMatters: 'Seeing is believing for frontend engineering managers who want to interact with your work.',
          practicalTask: 'Apply to 5 high-alignment frontend roles with direct links to your accessible UI demo.',
          dependencies: 'Prerequisite: Step 5',
          estimatedEffort: 'Ongoing',
        },
      ];
    },
    nextActionsGenerator: (_matched, missing) => {
      const firstLearn = missing[0] || 'TypeScript';
      return {
        whatToLearnFirst: {
          skill: firstLearn,
          action: `Build a typed component with generic props and strict event types.`,
        },
        whatProjectToBuild: {
          title: 'Accessible SaaS Component Design System & Interactive Dashboard',
          description: 'Build a production-grade web application showcasing state management, dark mode, and zero-defect accessibility.',
        },
        whatResumeEvidenceToAdd: {
          guidance: 'Quantify performance gains, Core Web Vitals improvements, and component adoption.',
          exampleBulletPoint: `Engineered an accessible web interface with React and TypeScript, optimizing Core Web Vitals to achieve a 98/100 Lighthouse score and reducing bundle size by 35%.`,
        },
        whatToPractiseBeforeApplying: {
          topic: 'Event delegation, CSS layout mechanics (Flexbox/Grid), and React render lifecycle optimization.',
          guidance: 'Be ready to build a dynamic UI component live in a 45-minute coding interview without libraries.',
        },
      };
    },
  },

  // 4. Data Engineer Track
  {
    id: 'data-engineer',
    category: 'Data Engineering',
    titleGenerator: (matched) => {
      const lower = matched.map((s) => s.toLowerCase());
      if (lower.some((s) => s.includes('spark') || s.includes('hadoop') || s.includes('pyspark'))) {
        return 'Big Data & Spark Pipeline Engineer';
      }
      if (lower.some((s) => s.includes('snowflake') || s.includes('dbt') || s.includes('airflow'))) {
        return 'Cloud Data Platform & Analytics Engineer';
      }
      return 'Data Pipeline & ETL Software Engineer';
    },
    coreSkills: [
      'SQL', 'Python', 'Spark', 'PySpark', 'ETL', 'Airflow', 'Kafka',
      'PostgreSQL', 'Snowflake', 'BigQuery', 'Databricks', 'dbt', 'Pandas',
      'Data Warehousing', 'Data Modeling', 'Docker', 'AWS', 'GCP', 'Linux'
    ],
    recommendedComplementarySkills: [
      'Apache Spark', 'Apache Airflow', 'dbt', 'Snowflake', 'Kafka', 'Data Modeling', 'Docker'
    ],
    skillLearningActions: {
      'Apache Spark': {
        importance: 'De facto standard for distributed big data processing and large-scale transformations.',
        action: 'Build a PySpark pipeline processing large CSV/JSON datasets with DataFrame transformations.',
      },
      'Apache Airflow': {
        importance: 'Primary workflow orchestrator used to schedule and monitor production DAG pipelines.',
        action: 'Create an Airflow DAG with custom tasks, dependency management, and automated retries.',
      },
      'dbt': {
        importance: 'Modern industry standard for modular data warehouse transformation and testing.',
        action: 'Model staging and mart tables with dbt, adding automated schema tests and documentation.',
      },
      'Data Modeling': {
        importance: 'Star schema and dimensional modeling are mandatory for clean analytical queries.',
        action: 'Design fact and dimension tables with slowly changing dimensions (SCD Type 2).',
      },
    },
    projectBlueprintGenerator: (matched) => {
      const primaryLang = matched.includes('Python') ? 'Python' : 'SQL';
      return {
        title: 'End-to-End Automated Data Warehouse & Ingestion Pipeline',
        focus: `Bridge existing ${primaryLang} proficiency with Airflow, dbt, and cloud data warehouse modeling.`,
        recommendedProject: `Design an automated ETL pipeline that ingests raw transactional data, cleans and deduplicates records, models analytics tables in a data warehouse, and runs automated data quality tests.`,
        deliverables: [
          'Airflow DAG orchestrating scheduled data extraction and validation',
          'Star schema dimensional model with fact and dimension tables',
          'Automated data quality checks (null checks, uniqueness, freshness)',
          'Complete pipeline packaged with Docker and documented data lineage',
        ],
      };
    },
    roadmapGenerator: (_matched, missing, roleTitle) => {
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Advanced SQL & Relational Data Modeling',
          focus: 'Complex analytical queries, window functions, CTEs, and dimensional star schema design.',
          whatToDo: 'Practice writing advanced SQL queries for cumulative sums, retention cohorts, and ranking.',
          whyItMatters: 'SQL query proficiency is tested in 100% of data engineering technical interview rounds.',
          practicalTask: 'Write a suite of 10 complex analytical queries using window functions and CTEs.',
          dependencies: '',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: `Data Transformation & Distributed Processing with ${missing[0] || 'Spark'}`,
          focus: `Large-scale data transformations, partitioning, and memory management in ${missing[0] || 'Spark'}.`,
          whatToDo: `Learn ${missing[0] || 'Spark'} DataFrames, broadcast joins, and distributed shuffle optimization.`,
          whyItMatters: 'Essential for processing datasets that exceed single-machine memory capacity.',
          practicalTask: 'Write a pipeline processing >1M records with optimized partition sizes and zero data skew.',
          dependencies: 'Prerequisite: Step 1',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Workflow Orchestration with Apache Airflow',
          focus: 'DAG design, idempotent task execution, backfilling, and error alerting.',
          whatToDo: 'Build custom Airflow DAGs with PythonOperators, upstream dependencies, and retries.',
          whyItMatters: 'Production data teams require automated, fault-tolerant job scheduling.',
          practicalTask: 'Run an Airflow DAG that handles upstream API failures gracefully with automated retries.',
          dependencies: 'Prerequisite: Step 2',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Modern Analytics Engineering with dbt & Warehouse',
          focus: 'Data warehouse modeling in Snowflake/PostgreSQL with automated dbt testing and lineage.',
          whatToDo: 'Build dimensional models with dbt, adding unique, not_null, and foreign key tests.',
          whyItMatters: 'Ensures business stakeholders receive reliable, validated data without manual checks.',
          practicalTask: 'Publish dbt documentation with lineage graphs and automated passing data tests.',
          dependencies: 'Prerequisite: Step 3',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-5',
          stepNumber: 5,
          title: 'Data Reliability, CI/CD & Production Packaging',
          focus: 'Containerizing data pipelines with Docker and testing code with pytest.',
          whatToDo: 'Add unit tests for transformation functions and package pipeline jobs with Docker.',
          whyItMatters: 'Distinguishes true data engineers from analysts who only write ad-hoc scripts.',
          practicalTask: 'Automate pipeline test execution in GitHub Actions with passing integration tests.',
          dependencies: 'Prerequisite: Step 4',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-6',
          stepNumber: 6,
          title: `Interview Prep & ${roleTitle} Applications`,
          focus: 'System design for data pipelines, data modeling whiteboard questions, and targeted applications.',
          whatToDo: `Practice designing data architectures (batch vs streaming) and apply to ${roleTitle} roles.`,
          whyItMatters: 'High conversion rate when resumes showcase real data architecture with GitHub code proof.',
          practicalTask: 'Apply to 5 targeted data engineering positions with links to your documented pipeline repo.',
          dependencies: 'Prerequisite: Step 5',
          estimatedEffort: 'Ongoing',
        },
      ];
    },
    nextActionsGenerator: (_matched, missing) => {
      const firstLearn = missing[0] || 'Airflow';
      return {
        whatToLearnFirst: {
          skill: firstLearn,
          action: `Set up a local ${firstLearn} environment and write your first automated pipeline DAG.`,
        },
        whatProjectToBuild: {
          title: 'Automated Analytical Warehouse Pipeline with Airflow & dbt',
          description: 'Build an end-to-end data pipeline extracting raw data, orchestrating tasks with Airflow, and modeling analytical tables with dbt.',
        },
        whatResumeEvidenceToAdd: {
          guidance: 'Mention data scale, ingestion frequency, latency reduction, and data quality improvements.',
          exampleBulletPoint: `Built an automated ETL data pipeline processing 500K+ daily records using Python, Airflow, and PostgreSQL, reducing batch processing time by 40% with zero downstream schema violations.`,
        },
        whatToPractiseBeforeApplying: {
          topic: 'SQL window functions, star schema design, distributed joins, and pipeline failure recovery.',
          guidance: 'Be ready to design a scalable clickstream analytics pipeline on a whiteboard in live interviews.',
        },
      };
    },
  },

  // 5. AI / Machine Learning Engineer Track
  {
    id: 'ai-ml-engineer',
    category: 'AI & Machine Learning',
    titleGenerator: (matched) => {
      const lower = matched.map((s) => s.toLowerCase());
      if (lower.some((s) => s.includes('rag') || s.includes('llm') || s.includes('langchain'))) {
        return 'Generative AI & LLM Systems Engineer';
      }
      if (lower.some((s) => s.includes('pytorch') || s.includes('tensorflow') || s.includes('deep learning'))) {
        return 'Machine Learning Software Engineer';
      }
      return 'AI & Machine Learning Engineer';
    },
    coreSkills: [
      'Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy',
      'LLMs', 'LangChain', 'RAG', 'Vector Databases', 'HuggingFace', 'NLP',
      'FastAPI', 'Docker', 'Git', 'SQL', 'Computer Vision', 'Model Evaluation'
    ],
    recommendedComplementarySkills: [
      'LangChain / LlamaIndex', 'Vector Databases (Chroma/Pinecone)', 'RAG Architecture', 'Model Evaluation', 'FastAPI Serving', 'Docker'
    ],
    skillLearningActions: {
      'RAG': {
        importance: 'Primary architecture for connecting LLMs to proprietary documents without hallucinations.',
        action: 'Implement a semantic retrieval pipeline with chunking, embeddings, and vector similarity search.',
      },
      'Vector Databases': {
        importance: 'Essential indexing infrastructure for low-latency similarity queries over high-dimensional vectors.',
        action: 'Integrate ChromaDB or pgvector for storing embeddings with metadata filtering.',
      },
      'Model Evaluation': {
        importance: 'Rigorous benchmark evaluation is required to prove AI response accuracy and safety.',
        action: 'Implement automated RAG evaluation metrics: context relevance, faithfulness, and answer correctness.',
      },
      'FastAPI': {
        importance: 'Standard high-performance web framework for deploying machine learning and LLM endpoints.',
        action: 'Serve model inference endpoints with asynchronous request batching and OpenAPI docs.',
      },
    },
    projectBlueprintGenerator: (matched) => {
      const primaryLang = matched.includes('Python') ? 'Python' : 'AI Frameworks';
      return {
        title: 'Production Retrieval-Augmented Generation (RAG) System with Automated Evaluation',
        focus: `Demonstrate mastery of ${primaryLang}, embeddings, vector indexing, and production serving.`,
        recommendedProject: `Develop an end-to-end intelligent document assistant using Python, vector databases, and semantic search with measurable retrieval accuracy metrics and a fast FastAPI backend.`,
        deliverables: [
          'Document ingestion engine with adaptive text chunking and embedding caching',
          'Vector similarity search with metadata filtering and re-ranking',
          'FastAPI microservice with streaming responses and request validation',
          'Automated evaluation benchmark proving >85% retrieval faithfulness',
        ],
      };
    },
    roadmapGenerator: (_matched, missing, roleTitle) => {
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Python for AI, Vector Math & NumPy Fundamentals',
          focus: 'Matrix operations, vector embeddings, cosine similarity, and efficient tensor slicing.',
          whatToDo: 'Solidify understanding of vector similarity calculations, distance metrics, and embedding spaces.',
          whyItMatters: 'Understanding underlying vector math prevents black-box AI implementation errors.',
          practicalTask: 'Implement cosine similarity and top-k search from scratch in pure NumPy without libraries.',
          dependencies: '',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: `Vector Indexing & Semantic Search with ${missing[0] || 'Vector Databases'}`,
          focus: `Embedding generation, vector indexing algorithms (HNSW/IVF), and ${missing[0] || 'Vector Databases'}.`,
          whatToDo: `Store document embeddings in a vector database with metadata filtering and query tuning.`,
          whyItMatters: 'Vector retrieval is the backbone of all modern conversational AI and search engines.',
          practicalTask: 'Index a 10,000-page document corpus and achieve sub-50ms query response times.',
          dependencies: 'Prerequisite: Step 1',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Advanced RAG Architecture & Context Retrieval',
          focus: 'Chunking strategies, multi-query expansion, context re-ranking, and prompt engineering.',
          whatToDo: 'Implement hybrid search combining keyword (BM25) and semantic vector search with re-ranking.',
          whyItMatters: 'Dramatically improves LLM response accuracy and eliminates hallucinated information.',
          practicalTask: 'Build a multi-document Q&A pipeline with citation references to source pages.',
          dependencies: 'Prerequisite: Step 2',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Production Serving with FastAPI & Streaming',
          focus: 'Async endpoints, Server-Sent Events (SSE) streaming, rate limiting, and Docker packaging.',
          whatToDo: 'Serve your AI application through an asynchronous FastAPI service with Docker.',
          whyItMatters: 'Hiring managers look for AI engineers who can build production web services, not just notebooks.',
          practicalTask: 'Package the AI service in a multi-stage Docker container with live streaming tokens.',
          dependencies: 'Prerequisite: Step 3',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-5',
          stepNumber: 5,
          title: 'AI Reliability, Evaluation Frameworks & Guardrails',
          focus: 'Automated evaluation (Ragas/TruLens), latency monitoring, and prompt injection defense.',
          whatToDo: 'Measure retrieval precision, answer faithfulness, and protect endpoints from adversarial prompts.',
          whyItMatters: 'Enterprise deployments require strict safety, reliability, and accuracy assurances.',
          practicalTask: 'Implement an automated test suite verifying <5% hallucination rate on gold test queries.',
          dependencies: 'Prerequisite: Step 4',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-6',
          stepNumber: 6,
          title: `Showcase Project & ${roleTitle} Applications`,
          focus: 'Technical storytelling, architecture diagrams, and targeted AI company applications.',
          whatToDo: `Publish GitHub repo with benchmark results and apply to ${roleTitle} positions.`,
          whyItMatters: 'Demonstrable production AI repositories immediately separate candidates in hiring pipelines.',
          practicalTask: 'Apply to 5 high-alignment AI openings with demo links and evaluation benchmark graphs.',
          dependencies: 'Prerequisite: Step 5',
          estimatedEffort: 'Ongoing',
        },
      ];
    },
    nextActionsGenerator: (_matched, missing) => {
      const firstLearn = missing[0] || 'Vector Databases & RAG';
      return {
        whatToLearnFirst: {
          skill: firstLearn,
          action: `Study embeddings and vector similarity search with hands-on Python scripts.`,
        },
        whatProjectToBuild: {
          title: 'Production Document Intelligence & Semantic Retrieval System',
          description: 'Build an end-to-end data pipeline transforming raw documents into vectorized embeddings with a fast retrieval API.',
        },
        whatResumeEvidenceToAdd: {
          guidance: 'Mention dataset scale, processing throughput, citation accuracy, and retrieval latency.',
          exampleBulletPoint: `Built a production semantic search service in Python and FastAPI, indexing 25,000+ technical documents and implementing RAG with sub-80ms retrieval latency and 92% answer faithfulness.`,
        },
        whatToPractiseBeforeApplying: {
          topic: 'Embedding generation, vector search algorithms (HNSW), chunking strategies, and AI evaluation metrics.',
          guidance: 'Be ready to explain how to prevent hallucination and evaluate model drift in production.',
        },
      };
    },
  },

  // 6. Cloud & DevOps Engineer Track
  {
    id: 'cloud-devops',
    category: 'Cloud & DevOps Engineering',
    titleGenerator: (matched) => {
      const lower = matched.map((s) => s.toLowerCase());
      if (lower.some((s) => s.includes('kubernetes') || s.includes('docker'))) {
        return 'Kubernetes & Cloud Platform Engineer';
      }
      if (lower.some((s) => s.includes('aws') || s.includes('terraform'))) {
        return 'AWS & Infrastructure Automation Engineer';
      }
      return 'Cloud DevOps & SRE Engineer';
    },
    coreSkills: [
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
      'Linux', 'Git', 'Bash', 'Python', 'Ansible', 'Helm', 'Prometheus',
      'Grafana', 'Nginx', 'Microservices', 'Networking', 'CloudFormation'
    ],
    recommendedComplementarySkills: [
      'Kubernetes', 'Terraform (IaC)', 'CI/CD Pipelines (GitHub Actions)', 'Docker', 'Prometheus & Grafana', 'Linux'
    ],
    skillLearningActions: {
      'Kubernetes': {
        importance: 'Primary enterprise standard for automated container deployment, scaling, and management.',
        action: 'Deploy microservices to Minikube with Deployments, Services, ConfigMaps, and Ingress routing.',
      },
      'Terraform': {
        importance: 'Industry standard for declarative Infrastructure as Code (IaC) across cloud providers.',
        action: 'Write reusable Terraform modules provisioning VPC, subnets, and container clusters.',
      },
      'CI/CD': {
        importance: 'Automated delivery pipelines are the core engine of high-velocity software engineering.',
        action: 'Configure GitHub Actions workflows with test automation, image scanning, and automated deployment.',
      },
      'Prometheus': {
        importance: 'Essential observability stack for metric scraping, alerts, and system health monitoring.',
        action: 'Set up Prometheus to monitor container metrics and visualize service health in Grafana dashboards.',
      },
    },
    projectBlueprintGenerator: (matched) => {
      const topCloud = matched.includes('AWS') ? 'AWS' : 'Cloud';
      return {
        title: `Automated Multi-Environment GitOps & ${topCloud} Infrastructure Blueprint`,
        focus: `Demonstrate production infrastructure provisioning with Terraform, Docker, and Kubernetes.`,
        recommendedProject: `Build an automated CI/CD and cloud platform repository provisioning cloud networking via Terraform, deploying containerized microservices to Kubernetes, and configuring Prometheus monitoring.`,
        deliverables: [
          'Terraform scripts provisioning VPC, compute nodes, and managed databases',
          'Kubernetes manifests with automated horizontal pod autoscaling (HPA)',
          'GitHub Actions CI/CD pipeline building, scanning, and deploying images',
          'Grafana dashboard monitoring service latency, error rates, and resource usage',
        ],
      };
    },
    roadmapGenerator: (_matched, missing, roleTitle) => {
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Linux Systems, Networking & Shell Scripting',
          focus: 'Linux process management, permissions, DNS, TCP/IP, and automated Bash scripts.',
          whatToDo: 'Master command-line troubleshooting: netstat, iptables, systemd, and cron automation.',
          whyItMatters: 'Strong Linux fundamentals are non-negotiable for all DevOps and cloud engineering roles.',
          practicalTask: 'Write a robust Bash script that automates system backups with error logging and status checks.',
          dependencies: '',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Containerization & Multi-Stage Docker Builds',
          focus: 'Layer caching, security scanning, non-root users, and small image footprints.',
          whatToDo: 'Write optimized Dockerfiles reducing image sizes by >60% and eliminating vulnerabilities.',
          whyItMatters: 'Efficient containers reduce deployment times and eliminate security risks in cloud environments.',
          practicalTask: 'Containerize 2 services with multi-stage builds and scan them for vulnerabilities using Trivy.',
          dependencies: 'Prerequisite: Step 1',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: `Infrastructure as Code with ${missing[0] || 'Terraform'}`,
          focus: `Declarative provisioning, remote state management, and reusable cloud modules.`,
          whatToDo: `Write modular ${missing[0] || 'Terraform'} code provisioning cloud network and compute resources.`,
          whyItMatters: 'Eliminates manual cloud console errors and enables reproducible environments.',
          practicalTask: 'Provision a complete cloud VPC with public/private subnets and security groups via code.',
          dependencies: 'Prerequisite: Step 2',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Kubernetes Cluster Orchestration & Ingress',
          focus: 'Pods, Deployments, Services, ConfigMaps, Secrets, Ingress, and Health Probes.',
          whatToDo: 'Deploy a multi-tier web application to a local Kubernetes cluster with automated self-healing.',
          whyItMatters: 'Kubernetes orchestration is the most demanded technical skill in modern platform engineering.',
          practicalTask: 'Configure zero-downtime rolling updates and liveness/readiness probes on Kubernetes.',
          dependencies: 'Prerequisite: Step 3',
          estimatedEffort: '2-3 weeks',
        },
        {
          id: 'step-5',
          stepNumber: 5,
          title: 'Automated CI/CD Pipelines & Observability',
          focus: 'GitHub Actions automation, automated testing, and Prometheus/Grafana monitoring.',
          whatToDo: 'Build an automated pipeline that tests, builds, and deploys on every merge, with metrics tracking.',
          whyItMatters: 'Demonstrates end-to-end automation from git commit to production monitoring.',
          practicalTask: 'Set up Grafana alerts notifying on simulated high CPU usage and 5xx error spikes.',
          dependencies: 'Prerequisite: Step 4',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-6',
          stepNumber: 6,
          title: `Platform Showcase & ${roleTitle} Applications`,
          focus: 'Architecture diagrams, production disaster recovery stories, and targeted applications.',
          whatToDo: `Publish your infrastructure repository with clean documentation and apply to ${roleTitle} roles.`,
          whyItMatters: 'Demonstrable GitOps repositories yield fast interview scheduling from engineering teams.',
          practicalTask: 'Apply to 5 targeted DevOps/SRE positions with links to your automated infrastructure code.',
          dependencies: 'Prerequisite: Step 5',
          estimatedEffort: 'Ongoing',
        },
      ];
    },
    nextActionsGenerator: (_matched, missing) => {
      const firstLearn = missing[0] || 'Terraform';
      return {
        whatToLearnFirst: {
          skill: firstLearn,
          action: `Write your first declarative ${firstLearn} configuration file and deploy cloud resources.`,
        },
        whatProjectToBuild: {
          title: 'Automated Cloud Infrastructure & Kubernetes GitOps Pipeline',
          description: 'Build an automated repository provisioning cloud resources with Terraform and deploying to Kubernetes via CI/CD.',
        },
        whatResumeEvidenceToAdd: {
          guidance: 'Highlight deployment frequency, infrastructure cost savings, and zero-downtime deployments.',
          exampleBulletPoint: `Implemented automated CI/CD pipelines with GitHub Actions and Terraform, provisioning Kubernetes clusters and reducing release cycle time from 2 hours to 8 minutes.`,
        },
        whatToPractiseBeforeApplying: {
          topic: 'Kubernetes networking (CNI/Ingress), DNS resolution, and automated rollbacks.',
          guidance: 'Be ready to troubleshoot a crashing pod and explain how you handle secret management in production.',
        },
      };
    },
  },

  // 7. QA & Test Automation Engineer Track
  {
    id: 'qa-engineer',
    category: 'QA & Test Engineering',
    titleGenerator: (matched) => {
      const lower = matched.map((s) => s.toLowerCase());
      if (lower.some((s) => s.includes('playwright') || s.includes('cypress'))) {
        return 'Modern Web QA Automation Engineer (Playwright/Cypress)';
      }
      if (lower.some((s) => s.includes('selenium') || s.includes('testng'))) {
        return 'QA Automation Engineer (Selenium & Java)';
      }
      return 'Software Development Engineer in Test (SDET)';
    },
    coreSkills: [
      'Selenium', 'Cypress', 'Playwright', 'Test Automation', 'JUnit', 'TestNG',
      'Postman', 'API Testing', 'Java', 'Python', 'JavaScript', 'Cucumber',
      'BDD', 'Performance Testing', 'JMeter', 'CI/CD', 'Git', 'SQL', 'JIRA'
    ],
    recommendedComplementarySkills: [
      'Playwright / Cypress', 'API Testing (Postman/RestAssured)', 'CI/CD Test Integration', 'SQL for Data Verification', 'Performance Testing'
    ],
    skillLearningActions: {
      'Playwright': {
        importance: 'Modern cross-browser automation framework offering fast execution and auto-waiting.',
        action: 'Build an automated end-to-end regression test suite with Playwright and TypeScript.',
      },
      'API Testing': {
        importance: 'API verification detects business logic defects before they reach the user interface.',
        action: 'Automate REST API testing using RestAssured or Newman/Postman with automated assertions.',
      },
      'CI/CD Test Integration': {
        importance: 'Automated test execution prevents broken code from being merged into main branches.',
        action: 'Run automated Playwright/Selenium test suites on pull requests in GitHub Actions.',
      },
    },
    projectBlueprintGenerator: (matched) => {
      const primaryLang = matched[0] || 'Java / JavaScript';
      return {
        title: 'Full-Stack Automated Testing Framework (UI & API) with CI/CD Integration',
        focus: `Demonstrate automated test framework architecture using ${primaryLang} and modern test tooling.`,
        recommendedProject: `Design and build a robust test automation framework from scratch implementing Page Object Model (POM), data-driven testing, API validation, and automated HTML reporting integrated into GitHub Actions.`,
        deliverables: [
          'Page Object Model (POM) test architecture with auto-wait resilience',
          'REST API automated test suite with schema validation and authentication checks',
          'HTML execution reports with automated screenshots on failure',
          'GitHub Actions pipeline executing automated regression tests on pull requests',
        ],
      };
    },
    roadmapGenerator: (_matched, missing, roleTitle) => {
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Testing Fundamentals & Test Strategy Design',
          focus: 'Test pyramid, boundary value analysis, equivalence partitioning, and exploratory testing.',
          whatToDo: 'Write comprehensive test plans and defect reports for a real-world web application.',
          whyItMatters: 'Strong QA engineers are distinguished by rigorous test design methodology, not just scripting.',
          practicalTask: 'Write a comprehensive test plan covering functional, edge, and security scenarios for an API.',
          dependencies: '',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: `Automated UI Testing with ${missing[0] || 'Playwright/Selenium'}`,
          focus: 'Page Object Model (POM), resilient locator strategies, and cross-browser execution.',
          whatToDo: 'Build automated UI tests covering critical user journeys (signup, checkout, search).',
          whyItMatters: 'UI automation eliminates manual regression overhead and catches visual defects.',
          practicalTask: 'Automate 10 critical user journeys with robust locators and zero flaky test failures.',
          dependencies: 'Prerequisite: Step 1',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Automated API Testing & Data Validation',
          focus: 'HTTP status codes, JSON schema validation, auth tokens, and database assertions via SQL.',
          whatToDo: 'Create an automated API testing suite validating status codes, response times, and payloads.',
          whyItMatters: 'API testing is 10x faster and more reliable than UI testing in continuous integration.',
          practicalTask: 'Build an automated API test suite covering 15 endpoints with SQL data verification.',
          dependencies: 'Prerequisite: Step 2',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'CI/CD Pipeline Integration & Test Reporting',
          focus: 'Running headless tests in GitHub Actions, test matrix execution, and reporting.',
          whatToDo: 'Integrate test execution into CI/CD with automated HTML test reports and failure screenshots.',
          whyItMatters: 'Automated test gates protect production stability without manual QA bottlenecks.',
          practicalTask: 'Set up GitHub Actions to run tests automatically on pull request and generate summary artifacts.',
          dependencies: 'Prerequisite: Step 3',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-5',
          stepNumber: 5,
          title: 'Performance & Security Testing Basics',
          focus: 'Load testing with JMeter/k6 and basic security checks (OWASP Top 10).',
          whatToDo: 'Simulate concurrent user traffic and measure API response times under load.',
          whyItMatters: 'SDETs who can identify performance bottlenecks command premium roles in engineering teams.',
          practicalTask: 'Run a 200-concurrent-user load test script and document response latency degradation points.',
          dependencies: 'Prerequisite: Step 4',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-6',
          stepNumber: 6,
          title: `Showcase & Targeted ${roleTitle} Applications`,
          focus: 'Publishing test framework repository and targeted QA role applications.',
          whatToDo: `Share your clean automated framework code on GitHub and apply to ${roleTitle} openings.`,
          whyItMatters: 'Demonstrating a clean, well-architected test repository proves hands-on coding ability.',
          practicalTask: 'Apply to 5 targeted QA/SDET positions with direct links to your framework repository.',
          dependencies: 'Prerequisite: Step 5',
          estimatedEffort: 'Ongoing',
        },
      ];
    },
    nextActionsGenerator: (_matched, missing) => {
      const firstLearn = missing[0] || 'Playwright';
      return {
        whatToLearnFirst: {
          skill: firstLearn,
          action: `Set up a clean project and write your first automated test in ${firstLearn}.`,
        },
        whatProjectToBuild: {
          title: 'End-to-End Automated Testing Framework (UI & API)',
          description: 'Build a modular test automation framework implementing Page Object Model, API validation, and CI/CD test execution.',
        },
        whatResumeEvidenceToAdd: {
          guidance: 'Quantify test coverage percentages, reduction in manual regression time, and defect catch rates.',
          exampleBulletPoint: `Architected an automated test framework using ${firstLearn} and GitHub Actions, automating 120+ regression test cases and reducing manual QA turnaround from 3 days to 45 minutes.`,
        },
        whatToPractiseBeforeApplying: {
          topic: 'Page Object Model design, handling dynamic elements/iframes, and API test assertion strategies.',
          guidance: 'Be ready to write automated tests live during screening interviews on a sample web page.',
        },
      };
    },
  },

  // 8. Mobile Application Developer Track
  {
    id: 'mobile-engineer',
    category: 'Mobile Engineering',
    titleGenerator: (matched) => {
      const lower = matched.map((s) => s.toLowerCase());
      if (lower.some((s) => s.includes('react native'))) {
        return 'React Native Cross-Platform Mobile Engineer';
      }
      if (lower.some((s) => s.includes('flutter') || s.includes('dart'))) {
        return 'Flutter Mobile Application Developer';
      }
      if (lower.some((s) => s.includes('swift') || s.includes('ios'))) {
        return 'iOS Swift Application Developer';
      }
      if (lower.some((s) => s.includes('kotlin') || s.includes('android'))) {
        return 'Android Kotlin Mobile Engineer';
      }
      return 'Mobile Application Software Engineer';
    },
    coreSkills: [
      'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS', 'Dart',
      'JavaScript', 'TypeScript', 'Mobile UI', 'REST APIs', 'Offline Storage',
      'State Management', 'Git', 'App Store Deployment', 'Mobile Performance'
    ],
    recommendedComplementarySkills: [
      'React Native / Flutter', 'Offline Caching & Sync', 'State Management', 'Native Device APIs', 'Mobile Performance'
    ],
    skillLearningActions: {
      'React Native': {
        importance: 'Leading cross-platform framework enabling code reuse across iOS and Android.',
        action: 'Build a mobile app with React Native, React Navigation, and native device feature access.',
      },
      'Offline Caching': {
        importance: 'Mobile apps must function smoothly in poor network conditions with local caching.',
        action: 'Implement local persistence using SQLite or AsyncStorage with automatic background sync.',
      },
    },
    projectBlueprintGenerator: (matched) => {
      const primaryTech = matched[0] || 'Mobile Framework';
      return {
        title: 'Full-Featured Cross-Platform Mobile App with Offline Mode & Push Notifications',
        focus: `Demonstrate production mobile development using ${primaryTech} and offline persistence.`,
        recommendedProject: `Build an interactive mobile app featuring offline data caching, camera/location API integration, animated screen transitions, and authenticated backend sync.`,
        deliverables: [
          'Cross-platform screens for iOS and Android with responsive layouts',
          'Offline persistence and automatic synchronization when reconnected',
          'Integration with device hardware (camera, geolocation, or push notifications)',
          'Complete repository with demo recording and APK/TestFlight build instructions',
        ],
      };
    },
    roadmapGenerator: (_matched, missing, roleTitle) => {
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Mobile Architecture & Navigation Patterns',
          focus: 'Screen lifecycles, gesture handlers, stack/tab navigation, and responsive mobile layouts.',
          whatToDo: 'Master navigation paradigms and responsive UI styling across multiple screen dimensions.',
          whyItMatters: 'Smooth navigation and native feel distinguish professional apps from web wraps.',
          practicalTask: 'Build a multi-screen mobile app with bottom tabs, nested stack navigation, and safe area insets.',
          dependencies: '',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: `Offline Storage & Native Hardware APIs with ${missing[0] || 'React Native/Flutter'}`,
          focus: 'Local database storage, background tasks, and native camera/location access.',
          whatToDo: 'Implement local caching with SQLite or AsyncStorage and connect native device sensors.',
          whyItMatters: 'Mobile users expect instant responses even during intermittent cellular connectivity.',
          practicalTask: 'Build an offline-first notes/todo app that stores data locally and syncs with a server.',
          dependencies: 'Prerequisite: Step 1',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'State Management & Asynchronous API Communication',
          focus: 'Global mobile state management, optimistic UI updates, and token authentication.',
          whatToDo: 'Implement centralized state management and secure token storage (Keychain/Keystore).',
          whyItMatters: 'Prevents state synchronization bugs and ensures secure credential handling.',
          practicalTask: 'Connect your mobile app to a REST API with JWT authentication and secure storage.',
          dependencies: 'Prerequisite: Step 2',
          estimatedEffort: '2 weeks',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Mobile Performance, Animations & Gesture Polish',
          focus: '60 FPS animations, image caching, memory profiling, and gesture responsiveness.',
          whatToDo: 'Optimize list rendering with virtualized lists and build fluid gesture-driven transitions.',
          whyItMatters: 'App performance and smooth animations directly impact user ratings on app stores.',
          practicalTask: 'Achieve smooth 60 FPS scrolling on a 1,000-item virtualized list with image thumbnails.',
          dependencies: 'Prerequisite: Step 3',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-5',
          stepNumber: 5,
          title: 'Automated Testing & App Store Deployment Pipeline',
          focus: 'Unit testing components, Detox/Appium end-to-end tests, and Fastlane build automation.',
          whatToDo: 'Write automated component tests and configure automated build generation.',
          whyItMatters: 'Demonstrates knowledge of real-world release cycles and app packaging standards.',
          practicalTask: 'Generate a signed release build (APK or iOS archive) with passing automated tests.',
          dependencies: 'Prerequisite: Step 4',
          estimatedEffort: '1-2 weeks',
        },
        {
          id: 'step-6',
          stepNumber: 6,
          title: `Showcase & Targeted ${roleTitle} Applications`,
          focus: 'Live app preview recording, GitHub repository showcase, and targeted outreach.',
          whatToDo: `Record a 2-minute video walkthrough of your live mobile app and apply to ${roleTitle} roles.`,
          whyItMatters: 'A visual video demo of a working mobile app immediately captures recruiter attention.',
          practicalTask: 'Apply to 5 targeted mobile development positions with links to your live video demo.',
          dependencies: 'Prerequisite: Step 5',
          estimatedEffort: 'Ongoing',
        },
      ];
    },
    nextActionsGenerator: (_matched, missing) => {
      const firstLearn = missing[0] || 'React Native';
      return {
        whatToLearnFirst: {
          skill: firstLearn,
          action: `Set up a mobile emulator and build your first responsive screen in ${firstLearn}.`,
        },
        whatProjectToBuild: {
          title: 'Offline-First Mobile Application with Native Device Feature Integration',
          description: 'Build a mobile app with cross-platform navigation, offline data persistence, and native device sensor access.',
        },
        whatResumeEvidenceToAdd: {
          guidance: 'Mention cross-platform compatibility, app responsiveness, and native API integration.',
          exampleBulletPoint: `Developed a cross-platform mobile app using ${firstLearn} and TypeScript, implementing offline persistence with SQLite and achieving 60 FPS performance across iOS and Android devices.`,
        },
        whatToPractiseBeforeApplying: {
          topic: 'Mobile lifecycle events, offline data synchronization, and state rehydration.',
          guidance: 'Be ready to demonstrate your working app live on an emulator during technical interviews.',
        },
      };
    },
  },
];

/**
 * Derives the candidate's apparent experience level strictly from resume evidence.
 * Never guesses or fabricates years without citations.
 */
export function deriveApparentExperienceLevel(analysis: ResumeAnalysisResponse): ApparentExperienceLevel {
  const summary = analysis.professionalSummary || '';
  const projectCount = analysis.projects?.length || 0;
  const education = analysis.educationAndCertifications || [];

  // 1. Check for explicit years of experience in summary
  const yearsMatch = summary.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1], 10);
    if (years >= 5) {
      return {
        level: `Senior Software Engineer (~${years}+ years)`,
        evidence: `Professional summary explicitly states "${yearsMatch[0]}", supported by ${projectCount} project(s) in resume.`,
        confidence: 'high',
      };
    }
    if (years >= 2) {
      return {
        level: `Mid-Level Software Engineer (~${years} years)`,
        evidence: `Professional summary explicitly cites "${yearsMatch[0]}", demonstrated across ${projectCount} project(s).`,
        confidence: 'high',
      };
    }
    return {
      level: `Early Career / Associate Developer (~${years} year${years > 1 ? 's' : ''})`,
      evidence: `Professional summary indicates "${yearsMatch[0]}", supported by ${projectCount} project(s).`,
      confidence: 'high',
    };
  }

  // 2. Check for explicit Senior / Lead title in summary
  if (/\b(?:senior|lead|principal|staff|architect)\b/i.test(summary)) {
    const titleMatch = summary.match(/\b(?:senior|lead|principal|staff|architect)\s+[a-zA-Z\s]{3,25}\b/i);
    const title = titleMatch ? titleMatch[0].trim() : 'Senior Technical Contributor';
    return {
      level: title,
      evidence: `Professional summary explicitly references senior leadership role ("${title}"), backed by ${projectCount} project(s).`,
      confidence: 'high',
    };
  }

  // 3. Check for Entry Level / Graduate indicators
  if (/\b(?:entry[- ]level|junior|intern|graduate|student|fresh)\b/i.test(summary)) {
    return {
      level: 'Early Career / Associate Developer',
      evidence: `Professional summary indicates entry-level or academic foundation, supported by ${projectCount} portfolio project(s).`,
      confidence: 'moderate',
    };
  }

  // 4. Derive evidence-based level from projects and credentials
  if (projectCount >= 3) {
    return {
      level: 'Mid-Level Software Engineer',
      evidence: `Evidence based on ${projectCount} distinct technical projects in resume demonstrating production architecture. (Explicit duration not quantified in summary).`,
      confidence: 'moderate',
    };
  }

  if (projectCount >= 1) {
    const hasDegree = education.some((e) => /b\.?tech|b\.?s|bachelor|master|m\.?s|computer science/i.test(e));
    return {
      level: 'Early Career / Associate Developer',
      evidence: `Evidence based on ${projectCount} project(s)${hasDegree ? ' and academic technical degree' : ''}. (Experience timeline not explicitly stated in resume).`,
      confidence: 'moderate',
    };
  }

  return {
    level: 'Technical Profile (Experience Duration Not Specified)',
    evidence: 'The uploaded resume does not explicitly quantify years of experience or project timelines.',
    confidence: 'limited',
  };
}

/**
 * Extracts candidate career profile data from the parsed resume.
 */
export function extractCareerProfile(analysis: ResumeAnalysisResponse): CareerProfileData {
  const explicitSkills = (analysis.skills || []).map((s) => s.trim()).filter(Boolean);
  const projectTechSet = new Set<string>();

  (analysis.projects || []).forEach((proj) => {
    (proj.technologies || []).forEach((tech) => {
      const clean = tech.trim();
      if (clean) projectTechSet.add(clean);
    });
  });

  const projectTechnologies = Array.from(projectTechSet);
  const allSet = new Set<string>();
  explicitSkills.forEach((s) => allSet.add(s));
  projectTechnologies.forEach((s) => allSet.add(s));
  const allDetectedSkills = Array.from(allSet);

  const apparentLevel = deriveApparentExperienceLevel(analysis);

  let technicalSummary = analysis.professionalSummary?.trim() || '';
  if (!technicalSummary) {
    const topSkillsStr = allDetectedSkills.slice(0, 5).join(', ');
    technicalSummary = `Technical candidate with demonstrable background in ${topSkillsStr || 'software development'} across ${analysis.projects?.length || 0} documented project(s).`;
  }

  return {
    technicalSummary,
    apparentLevel,
    totalSkillsCount: allDetectedSkills.length,
    totalProjectsCount: analysis.projects?.length || 0,
    explicitSkills,
    projectTechnologies,
    allDetectedSkills,
    keyProjects: analysis.projects || [],
  };
}

/**
 * Evaluates candidate resume evidence against standard career tracks,
 * ranking the top matching roles without fabricated scores.
 * Enforces strict relevance: a role is not recommended merely for 1 incidental skill.
 */
export function evaluateRecommendedRoles(
  analysis: ResumeAnalysisResponse,
  backendSkillGap?: SkillGapAnalysisResponse | null
): RecommendedJobRole[] {
  const profile = extractCareerProfile(analysis);
  const normalizedCandidateSkills = profile.allDetectedSkills.map((s) => s.toLowerCase());

  // Evaluate each template against candidate evidence
  const evaluatedRoles = ROLE_BENCHMARK_TEMPLATES.map((template) => {
    const matchedEvidenceSkills: MatchedEvidenceSkill[] = [];
    const matchedNames: string[] = [];
    let projectBackedCount = 0;

    // Find which template core skills match candidate resume
    template.coreSkills.forEach((coreSkill) => {
      const lower = coreSkill.toLowerCase();
      const isMatch = normalizedCandidateSkills.some((candSkill) => {
        return (
          candSkill === lower ||
          candSkill.includes(lower) ||
          lower.includes(candSkill)
        );
      });

      if (isMatch) {
        // Find which candidate projects used this skill
        const supportingProjects: string[] = [];
        (analysis.projects || []).forEach((p) => {
          const usedInProject = (p.technologies || []).some((t) => {
            const tLower = t.toLowerCase();
            return tLower === lower || tLower.includes(lower) || lower.includes(tLower);
          });
          if (usedInProject && p.name) {
            supportingProjects.push(p.name);
          }
        });

        if (supportingProjects.length > 0) {
          projectBackedCount++;
        }

        matchedNames.push(coreSkill);
        matchedEvidenceSkills.push({
          skill: coreSkill,
          supportingProjects,
          evidence: supportingProjects.length > 0
            ? `Demonstrated in project(s): ${supportingProjects.join(', ')}`
            : 'Explicitly declared in resume technical skills list.',
        });
      }
    });

    // Identify skills to develop (not found in resume)
    const skillsToDevelop = template.recommendedComplementarySkills.filter((compSkill) => {
      const lower = compSkill.toLowerCase();
      return !normalizedCandidateSkills.some((cs) => cs === lower || cs.includes(lower) || lower.includes(cs));
    });

    // Calculate evidence score: matched skills + (projects supporting * 1.5)
    const projectsWithEvidence = new Set<string>();
    matchedEvidenceSkills.forEach((m) => m.supportingProjects.forEach((p) => projectsWithEvidence.add(p)));
    const evidenceOverlapScore = matchedEvidenceSkills.length * 2 + projectsWithEvidence.size * 3;

    // Strict relevance: Role must have at least 2 matched core skills, OR at least 1 project-backed core skill
    const isGenuinelyRelevant = (matchedEvidenceSkills.length >= 2) || (matchedEvidenceSkills.length >= 1 && projectBackedCount >= 1);

    // Generate dynamic role title based on candidate stack
    const roleTitle = template.titleGenerator(matchedNames);

    // Build evidence rationale
    let fitRationale = '';
    if (matchedEvidenceSkills.length > 0) {
      const topMatchedStr = matchedEvidenceSkills.slice(0, 4).map((m) => m.skill).join(', ');
      const projStr = projectsWithEvidence.size > 0
        ? ` and demonstrated in ${Array.from(projectsWithEvidence).slice(0, 2).join(', ')}`
        : '';
      fitRationale = `Strong candidate fit supported by ${matchedEvidenceSkills.length} verified resume skill(s) (${topMatchedStr})${projStr}.`;
    } else {
      fitRationale = 'Foundational potential based on general engineering capability in resume.';
    }

    const alreadyHave = matchedEvidenceSkills;

    // Need to improve: skills mentioned in resume skills list but without project context or weak depth
    const needToImprove: WeakEvidenceSkill[] = [];
    matchedEvidenceSkills.forEach((item) => {
      if (item.supportingProjects.length === 0) {
        needToImprove.push({
          skill: item.skill,
          issue: 'Listed in resume skills but not demonstrated in detailed project bullet points.',
          recommendation: `Add a practical project link or production metrics illustrating hands-on usage of ${item.skill}.`,
        });
      }
    });

    // Need to learn: top missing skills for this role track
    const needToLearn: MissingRoleSkill[] = skillsToDevelop.slice(0, 4).map((skill) => {
      const info = template.skillLearningActions[skill] || {
        importance: `Standard requirement for production ${roleTitle} positions.`,
        action: `Complete hands-on tutorials and build a feature demonstrating ${skill} in your portfolio.`,
      };
      return {
        skill,
        importance: info.importance,
        learningAction: info.action,
        status: 'Not found in resume',
      };
    });

    const practicalExperience = template.projectBlueprintGenerator(matchedNames, skillsToDevelop);
    const roadmap = template.roadmapGenerator(matchedNames, skillsToDevelop, roleTitle);
    const nextActions = template.nextActionsGenerator(matchedNames, skillsToDevelop, roleTitle);

    return {
      id: template.id,
      title: roleTitle,
      category: template.category,
      fitRank: 0,
      fitBadge: '',
      fitRationale,
      matchedSkills: matchedEvidenceSkills,
      skillsToDevelop: skillsToDevelop.slice(0, 5),
      supportingProjects: Array.from(projectsWithEvidence),
      alreadyHave,
      needToImprove,
      needToLearn,
      practicalExperience,
      roadmap,
      nextActions,
      _score: evidenceOverlapScore,
      _relevant: isGenuinelyRelevant,
    };
  });

  // Filter only genuinely relevant roles where candidate has actual evidence
  let filtered = evaluatedRoles.filter((r) => r._relevant && r.matchedSkills.length > 0);
  if (filtered.length === 0) {
    // Fallback: take roles with at least 1 match, sorted by score
    filtered = evaluatedRoles.filter((r) => r.matchedSkills.length > 0);
  }
  if (filtered.length === 0) {
    filtered = evaluatedRoles.slice(0, 2);
  }

  // Sort by evidence overlap score descending
  filtered.sort((a, b) => b._score - a._score);

  // Take top 3 or 4 relevant roles
  const topRoles = filtered.slice(0, 4);

  // Assign ranks and badges
  const rankLabels = [
    '#1 Strongest Evidence Match',
    '#2 High Suitability',
    '#3 Viable Career Track',
    '#4 Growth Path',
  ];

  return topRoles.map((role, idx) => {
    // If backend skill gap analysis matches this specific role, merge its insights!
    const roleTitleNormalized = role.title.toLowerCase();
    const isMatchingBackend = backendSkillGap && (
      backendSkillGap.targetRoleOrJobDescription.toLowerCase().includes(roleTitleNormalized) ||
      roleTitleNormalized.includes(backendSkillGap.targetRoleOrJobDescription.toLowerCase())
    );

    let alreadyHave = role.alreadyHave;
    let needToImprove = role.needToImprove;
    let needToLearn = role.needToLearn;
    let roadmap = role.roadmap;

    if (isMatchingBackend && backendSkillGap) {
      if (backendSkillGap.matchedSkills && backendSkillGap.matchedSkills.length > 0) {
        alreadyHave = backendSkillGap.matchedSkills.map((m) => ({
          skill: m.skill,
          supportingProjects: m.supportingProjects || [],
          evidence: m.evidence || 'Verified by deep AI analysis of resume text.',
        }));
      }

      if (backendSkillGap.skillsNeedingEvidence && backendSkillGap.skillsNeedingEvidence.length > 0) {
        needToImprove = backendSkillGap.skillsNeedingEvidence.map((e) => ({
          skill: e.skill,
          issue: e.issue,
          recommendation: e.recommendation,
        }));
      }

      if (backendSkillGap.missingSkills && backendSkillGap.missingSkills.length > 0) {
        needToLearn = backendSkillGap.missingSkills.map((m) => ({
          skill: m.skill,
          importance: m.importance || 'Important for target role proficiency.',
          learningAction: m.learningAction || 'Prioritize hands-on project implementation.',
          status: 'Not found in resume',
        }));
      }

      if (backendSkillGap.roadmap && backendSkillGap.roadmap.length === 6) {
        roadmap = backendSkillGap.roadmap.map((s) => ({
          id: `step-${s.stepNumber}`,
          stepNumber: s.stepNumber,
          title: s.title,
          focus: s.focus || `Stage ${s.stepNumber}`,
          whatToDo: s.whatToDo,
          whyItMatters: s.whyItMatters,
          practicalTask: s.practicalTask,
          dependencies: s.dependencies || (s.stepNumber > 1 ? `Prerequisite: Step ${s.stepNumber - 1}` : ''),
          estimatedEffort: s.estimatedEffort || '1-2 weeks',
        }));
      }
    }

    return {
      id: role.id,
      title: role.title,
      category: role.category,
      fitRank: idx + 1,
      fitBadge: rankLabels[idx] || `#${idx + 1} Match`,
      fitRationale: role.fitRationale,
      matchedSkills: role.matchedSkills,
      skillsToDevelop: role.skillsToDevelop,
      supportingProjects: role.supportingProjects,
      alreadyHave,
      needToImprove,
      needToLearn,
      practicalExperience: role.practicalExperience,
      roadmap,
      nextActions: role.nextActions,
    };
  });
}

/**
 * Builds a dynamic RecommendedJobRole for a custom target (user-selected role or pasted job description).
 * Uses backend AI skill gap results when available, or dynamically evaluates against resume evidence.
 */
export function buildCustomTargetRole(
  customTargetText: string,
  analysis: ResumeAnalysisResponse,
  backendSkillGap?: SkillGapAnalysisResponse | null,
  companyName?: string,
  jobTitle?: string
): RecommendedJobRole {
  const profile = extractCareerProfile(analysis);

  // Determine a clean role title
  let displayTitle = '';
  if (jobTitle && jobTitle.trim()) {
    displayTitle = companyName && companyName.trim()
      ? `${jobTitle.trim()} (${companyName.trim()})`
      : jobTitle.trim();
  } else if (customTargetText.length <= 60 && !customTargetText.includes('\n')) {
    displayTitle = customTargetText.trim();
  } else {
    // Extract first line or clean title from JD
    const firstLine = customTargetText.split('\n')[0].trim();
    if (firstLine.length > 5 && firstLine.length <= 60 && !firstLine.toLowerCase().startsWith('job description')) {
      displayTitle = companyName ? `${firstLine} (${companyName})` : firstLine;
    } else {
      displayTitle = companyName ? `Custom Role — ${companyName}` : 'Custom Job Description Target';
    }
  }

  const targetRoleId =
    'custom-' +
    (displayTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 35) || 'target');

  // 1. If backend AI skill gap analysis is available, use its exact findings!
  if (backendSkillGap) {
    const alreadyHave: MatchedEvidenceSkill[] = (backendSkillGap.matchedSkills || []).map((m) => ({
      skill: m.skill,
      supportingProjects: m.supportingProjects || [],
      evidence: m.evidence || 'Verified by deep AI analysis of resume text.',
    }));

    const needToImprove: WeakEvidenceSkill[] = (backendSkillGap.skillsNeedingEvidence || []).map((e) => ({
      skill: e.skill,
      issue: e.issue,
      recommendation: e.recommendation,
    }));

    const needToLearn: MissingRoleSkill[] = (backendSkillGap.missingSkills || []).map((m) => ({
      skill: m.skill,
      importance: m.importance || `Required for ${displayTitle}.`,
      learningAction: m.learningAction || 'Prioritize hands-on project implementation.',
      status: 'Not found in resume',
    }));

    // Generate or use dynamic 6-step roadmap from backend
    let roadmap: RoadmapStep[] = [];
    if (backendSkillGap.roadmap && backendSkillGap.roadmap.length === 6) {
      roadmap = backendSkillGap.roadmap.map((s) => ({
        id: `step-${s.stepNumber}`,
        stepNumber: s.stepNumber,
        title: s.title,
        focus: s.focus || `Stage ${s.stepNumber}`,
        whatToDo: s.whatToDo,
        whyItMatters: s.whyItMatters,
        practicalTask: s.practicalTask,
        dependencies: s.dependencies || (s.stepNumber > 1 ? `Prerequisite: Step ${s.stepNumber - 1}` : ''),
        estimatedEffort: s.estimatedEffort || '1-2 weeks',
      }));
    } else {
      roadmap = generateCanonicalRoadmap(displayTitle, alreadyHave.map((m) => m.skill), needToLearn.map((m) => m.skill));
    }

    const topMissing = needToLearn[0]?.skill || 'Advanced Target Technologies';
    const topMatched = alreadyHave[0]?.skill || 'Core Engineering';

    const practicalExperience: PracticalExperienceRecommendation = {
      title: `${displayTitle} — Custom Demonstration Project`,
      focus: `Bridge existing ${topMatched} evidence with ${topMissing} requirements.`,
      recommendedProject: `Design and build a specialized project directly showcasing the requirements specified in this custom target, with automated tests and public GitHub repository documentation.`,
      deliverables: [
        `Architecture implementation demonstrating ${topMatched} and ${topMissing}`,
        'Automated unit & integration tests covering core business workflows',
        'Clean repository with deployment instructions and API documentation',
        'Quantified performance metrics and error-handling resilience',
      ],
    };

    const nextActions: NextActionsChecklist = {
      whatToLearnFirst: {
        skill: topMissing,
        action: needToLearn[0]?.learningAction || `Study ${topMissing} documentation and complete a hands-on proof-of-concept module.`,
      },
      whatProjectToBuild: {
        title: `Custom ${displayTitle} Showcase Application`,
        description: `Build a focused prototype application demonstrating the core requirements from this job description.`,
      },
      whatResumeEvidenceToAdd: {
        guidance: `Add quantified bullet points highlighting skills matched to this specific job description.`,
        exampleBulletPoint: `Engineered an application tailored to ${displayTitle} requirements, utilizing ${topMatched} and ${topMissing} to achieve reliable execution and high test coverage.`,
      },
      whatToPractiseBeforeApplying: {
        topic: `System architecture, trade-offs, and key requirements specified in ${displayTitle}.`,
        guidance: `Prepare concise stories explaining your experience with ${topMatched} and your implementation plan for ${topMissing}.`,
      },
    };

    return {
      id: targetRoleId,
      title: displayTitle,
      category: 'Custom Benchmark',
      fitRank: 0,
      fitBadge: `Custom Target (${backendSkillGap.matchPercentage}% Match)`,
      fitRationale: `Custom benchmark evaluated against your active resume. Found ${alreadyHave.length} matching skill(s) and ${needToLearn.length} gap(s).`,
      matchedSkills: alreadyHave,
      skillsToDevelop: needToLearn.map((m) => m.skill),
      supportingProjects: Array.from(new Set(alreadyHave.flatMap((m) => m.supportingProjects))),
      alreadyHave,
      needToImprove,
      needToLearn,
      practicalExperience,
      roadmap,
      nextActions,
      isCustomTarget: true,
    };
  }

  // 2. Client-side evaluation fallback (prior to or alongside backend call)
  const lowerText = customTargetText.toLowerCase();
  const matchedEvidence: MatchedEvidenceSkill[] = [];

  profile.allDetectedSkills.forEach((skill) => {
    const sLower = skill.toLowerCase();
    if (lowerText.includes(sLower)) {
      const supportingProjects: string[] = [];
      (analysis.projects || []).forEach((p) => {
        if ((p.technologies || []).some((t) => t.toLowerCase() === sLower)) {
          if (p.name) supportingProjects.push(p.name);
        }
      });

      matchedEvidence.push({
        skill,
        supportingProjects,
        evidence: supportingProjects.length > 0
          ? `Demonstrated in project(s): ${supportingProjects.join(', ')}`
          : 'Explicitly declared in resume technical skills list.',
      });
    }
  });

  const roadmap = generateCanonicalRoadmap(displayTitle, matchedEvidence.map((m) => m.skill), ['Target Domain Requirements']);

  return {
    id: targetRoleId,
    title: displayTitle,
    category: 'Custom Benchmark',
    fitRank: 0,
    fitBadge: 'Custom Target',
    fitRationale: `Custom target benchmark evaluating your active resume against ${displayTitle}.`,
    matchedSkills: matchedEvidence,
    skillsToDevelop: ['Domain-Specific Requirements'],
    supportingProjects: Array.from(new Set(matchedEvidence.flatMap((m) => m.supportingProjects))),
    alreadyHave: matchedEvidence,
    needToImprove: [],
    needToLearn: [
      {
        skill: 'Custom Requirements',
        importance: `Key qualifications specified in ${displayTitle}.`,
        learningAction: 'Run AI Verification for granular requirement extraction.',
        status: 'Not found in resume',
      },
    ],
    practicalExperience: {
      title: `${displayTitle} Blueprint`,
      focus: 'Targeted implementation project.',
      recommendedProject: `Build an application demonstrating the specific requirements of ${displayTitle}.`,
      deliverables: [
        'Core architecture matching target specifications',
        'Automated test suite and documentation',
      ],
    },
    roadmap,
    nextActions: {
      whatToLearnFirst: {
        skill: 'Target Skill Gaps',
        action: 'Review target requirements and execute initial tutorial exercises.',
      },
      whatProjectToBuild: {
        title: `${displayTitle} Project`,
        description: 'Implement a working demonstration project meeting target criteria.',
      },
      whatResumeEvidenceToAdd: {
        guidance: 'Align resume project descriptions with target role keywords.',
        exampleBulletPoint: `Implemented solution meeting ${displayTitle} specifications with verified test coverage.`,
      },
      whatToPractiseBeforeApplying: {
        topic: 'Domain-specific design patterns and interview scenarios.',
        guidance: 'Rehearse technical explanations for key technologies in the target specification.',
      },
    },
    isCustomTarget: true,
  };
}

/**
 * Generates canonical 6-stage roadmap for any target role.
 */
function generateCanonicalRoadmap(roleTitle: string, matchedSkills: string[], missingSkills: string[]): RoadmapStep[] {
  const topMatched = matchedSkills[0] || 'Core Engineering Fundamentals';
  const topMissing = missingSkills[0] || 'Role-Specific Architecture';
  const secondMissing = missingSkills[1] || 'Testing & Production Deployment';

  return [
    {
      id: 'step-1',
      stepNumber: 1,
      title: `Foundation: Strengthen ${topMatched} Prerequisites`,
      focus: 'Architecture & Language Prerequisites',
      whatToDo: `Solidify core design patterns, clean code principles, and robust exception handling in ${topMatched}.`,
      whyItMatters: `A reliable foundation prevents architectural debt when tackling advanced requirements for ${roleTitle}.`,
      practicalTask: `Audit your existing ${topMatched} codebase and write thorough unit tests with Mockito/Jest.`,
      dependencies: '',
      estimatedEffort: '1-2 weeks',
    },
    {
      id: 'step-2',
      stepNumber: 2,
      title: `Priority Skill Gaps: Bridge ${topMissing} Requirements`,
      focus: 'Primary Skill Gap Remediation',
      whatToDo: `Acquire practical fluency in ${topMissing} via focused exercises and official documentation.`,
      whyItMatters: `${topMissing} is a primary hiring filter and mandatory qualification for ${roleTitle} openings.`,
      practicalTask: `Build an isolated prototype module integrating ${topMissing} with verifiable test outputs.`,
      dependencies: 'Prerequisite: Step 1',
      estimatedEffort: '1-2 weeks',
    },
    {
      id: 'step-3',
      stepNumber: 3,
      title: `Practical Implementation: Master ${secondMissing} Integration`,
      focus: 'Toolchain & Service Integration',
      whatToDo: `Connect ${topMatched} and ${topMissing} with ${secondMissing} in a working pipeline.`,
      whyItMatters: 'Demonstrating cross-toolchain integration bridges conceptual knowledge with production workflows.',
      practicalTask: 'Implement end-to-end service communication with automated validation and error logging.',
      dependencies: 'Prerequisite: Step 2',
      estimatedEffort: '2 weeks',
    },
    {
      id: 'step-4',
      stepNumber: 4,
      title: 'Project and Validation: Production-Grade Portfolio Milestone',
      focus: 'Comprehensive Demonstration Project',
      whatToDo: `Build or upgrade a standout full-lifecycle application tailored for ${roleTitle}, with CI/CD and containerization.`,
      whyItMatters: 'Hiring managers evaluate verifiable project architecture and commit histories over self-proclaimed skills.',
      practicalTask: 'Publish an open-source GitHub repository with clean architecture, interactive demo, and CI test badge.',
      dependencies: 'Prerequisite: Step 3',
      estimatedEffort: '2-3 weeks',
    },
    {
      id: 'step-5',
      stepNumber: 5,
      title: 'Career Evidence and Interview Prep: System Design & Deep Dive',
      focus: 'Technical Articulation & Whiteboard Scenarios',
      whatToDo: `Practice explaining architectural trade-offs, scalability bottlenecks, and debugging stories for ${roleTitle}.`,
      whyItMatters: 'Technical interviews evaluate trade-off reasoning and problem-solving clarity as much as code syntax.',
      practicalTask: 'Complete 5 mock interview rounds covering system design, live coding, and behavioral STAR stories.',
      dependencies: 'Prerequisite: Step 4',
      estimatedEffort: '1-2 weeks',
    },
    {
      id: 'step-6',
      stepNumber: 6,
      title: 'Job Readiness and Applications: Portfolio Launch & Targeted Search',
      focus: 'Resume Polish & Strategic Job Applications',
      whatToDo: `Update resume bullet points with quantified business impacts, deliverables from Step 4, and target ${roleTitle} openings.`,
      whyItMatters: 'Tailored applications with demonstrable repository links yield significantly higher response rates.',
      practicalTask: 'Submit 5 high-alignment applications per week with customized cover notes referencing your validated project.',
      dependencies: 'Prerequisite: Step 5',
      estimatedEffort: 'Ongoing',
    },
  ];
}
