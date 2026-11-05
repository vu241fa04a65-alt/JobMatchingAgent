// Database Schema definitions aligned with the Academic Agent Platform specification
// Schema prefixes mirror canonical schemas: identity, people, placement, agentops, engagement, governance

export const SCHEMA_SQL = `
-- Identity Schema
CREATE TABLE IF NOT EXISTS identity_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS identity_users (
    id TEXT PRIMARY KEY,
    identifier_code TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_id TEXT NOT NULL,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES identity_roles(id)
);

-- People Schema (Student profiles, academics)
CREATE TABLE IF NOT EXISTS people_students (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    usn TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    branch TEXT NOT NULL, -- e.g. CSE, ISE, ECE, ME, BT
    department TEXT NOT NULL,
    admission_year INTEGER NOT NULL,
    graduation_year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    cgpa REAL NOT NULL,
    active_backlogs INTEGER DEFAULT 0,
    history_backlogs INTEGER DEFAULT 0,
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    avatar_url TEXT,
    resume_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES identity_users(id)
);

CREATE TABLE IF NOT EXISTS student_skills (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    category TEXT, -- e.g. Programming, Cloud, Database, AI/ML, Tools
    proficiency_level TEXT, -- Beginner, Intermediate, Advanced, Expert
    score REAL DEFAULT 0.8, -- 0.0 to 1.0
    verified BOOLEAN DEFAULT 1,
    FOREIGN KEY (student_id) REFERENCES people_students(id)
);

CREATE TABLE IF NOT EXISTS student_projects (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tech_stack TEXT, -- JSON array or comma list
    role TEXT,
    github_link TEXT,
    live_link TEXT,
    featured BOOLEAN DEFAULT 1,
    FOREIGN KEY (student_id) REFERENCES people_students(id)
);

CREATE TABLE IF NOT EXISTS student_certifications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    title TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date TEXT,
    credential_id TEXT,
    verification_url TEXT,
    FOREIGN KEY (student_id) REFERENCES people_students(id)
);

CREATE TABLE IF NOT EXISTS student_preferences (
    student_id TEXT PRIMARY KEY,
    preferred_roles TEXT, -- JSON array of strings
    preferred_locations TEXT, -- JSON array of strings
    min_expected_ctc REAL,
    willing_to_relocate BOOLEAN DEFAULT 1,
    preferred_job_types TEXT, -- Full-time, Internship
    FOREIGN KEY (student_id) REFERENCES people_students(id)
);

-- Placement Schema (Readiness, Companies, Openings, Applications, Offers)
CREATE TABLE IF NOT EXISTS placement_readiness_summary (
    student_id TEXT PRIMARY KEY,
    overall_readiness_score REAL NOT NULL, -- 0-100
    technical_score REAL NOT NULL,
    aptitude_score REAL NOT NULL,
    communication_score REAL NOT NULL,
    interview_readiness_score REAL NOT NULL,
    status TEXT NOT NULL, -- Placement Ready, In Preparation, Needs Attention, Not Started
    last_evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    computed_by_agent TEXT DEFAULT 'Agent 49 / 50',
    FOREIGN KEY (student_id) REFERENCES people_students(id)
);

CREATE TABLE IF NOT EXISTS placement_companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT DEFAULT 'Tier 1', -- Tier 1 (Dream), Tier 2, Mass
    industry TEXT NOT NULL,
    website TEXT,
    logo_url TEXT,
    headquarters TEXT,
    description TEXT,
    is_partner BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placement_job_openings (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    title TEXT NOT NULL,
    role_type TEXT NOT NULL, -- Full-time, Internship
    work_mode TEXT DEFAULT 'Onsite', -- Onsite, Hybrid, Remote
    location TEXT NOT NULL,
    ctc_min REAL NOT NULL, -- in LPA e.g. 30.0
    ctc_max REAL NOT NULL, -- in LPA e.g. 45.0
    ctc_display TEXT NOT NULL, -- e.g. "₹ 30 - 45 LPA"
    min_cgpa REAL DEFAULT 7.0,
    max_backlogs INTEGER DEFAULT 0,
    eligible_branches TEXT NOT NULL, -- JSON array e.g. ["CSE", "ISE", "ECE"]
    eligible_grad_years TEXT NOT NULL, -- JSON array e.g. [2026, 2027]
    description TEXT NOT NULL,
    responsibilities TEXT, -- JSON array or text
    required_skills TEXT NOT NULL, -- JSON array
    preferred_skills TEXT, -- JSON array
    experience_level TEXT DEFAULT '0 - 2 years (Fresher)',
    deadline_date TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, CLOSED, DRAFT
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES placement_companies(id)
);

CREATE TABLE IF NOT EXISTS placement_drive_applications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    job_opening_id TEXT NOT NULL,
    status TEXT DEFAULT 'APPLIED', -- APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW_SCHEDULED, SELECTED, OFFER_RECEIVED, NOT_SELECTED, WITHDRAWN
    current_stage TEXT DEFAULT 'APPLIED', -- APPLIED, SCREENING, SHORTLISTED, CODING, TECHNICAL_1, TECHNICAL_2, HR, SELECTED, OFFER, REJECTED, WITHDRAWN
    stage_progress INTEGER DEFAULT 1, -- 1: Applied, 2: Shortlisted, 3: Interview, 4: Offer
    stage_history TEXT, -- JSON array of [{ stage, timestamp, notes, status, round_title }]
    rounds_config TEXT, -- JSON array of configured stages for the drive
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (student_id) REFERENCES people_students(id),
    FOREIGN KEY (job_opening_id) REFERENCES placement_job_openings(id),
    UNIQUE(student_id, job_opening_id)
);

CREATE TABLE IF NOT EXISTS placement_interviews (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL,
    round_name TEXT NOT NULL, -- Technical Round 1, System Design, HR Round
    scheduled_time TEXT NOT NULL,
    mode TEXT DEFAULT 'Google Meet (Virtual)',
    meeting_link TEXT,
    interviewer_name TEXT,
    status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED
    feedback TEXT,
    FOREIGN KEY (application_id) REFERENCES placement_drive_applications(id)
);

CREATE TABLE IF NOT EXISTS placement_offers (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL,
    offered_ctc REAL NOT NULL,
    role_title TEXT NOT NULL,
    joining_date TEXT,
    offer_letter_url TEXT,
    student_decision TEXT DEFAULT 'ACCEPTED', -- ACCEPTED, DECLINED, PENDING
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES placement_drive_applications(id)
);

-- Historical placement signals to calibrate match rankings
CREATE TABLE IF NOT EXISTS placement_historical_signals (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    role_category TEXT NOT NULL,
    successful_skill_weights TEXT NOT NULL, -- JSON object of skill -> weight
    average_hired_cgpa REAL DEFAULT 8.2,
    top_contributing_branch TEXT DEFAULT 'CSE',
    interview_conversion_rate REAL DEFAULT 0.78,
    sample_size INTEGER DEFAULT 45
);

-- Learning & Skills Modules
CREATE TABLE IF NOT EXISTS learning_modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Programming, Cloud, AI/ML, System Design, Aptitude, Core
    level TEXT DEFAULT 'Intermediate', -- Beginner, Intermediate, Advanced
    duration_hours INTEGER DEFAULT 20,
    target_skills TEXT NOT NULL, -- JSON array of skills
    description TEXT,
    enrolled_count INTEGER DEFAULT 0,
    completion_rate REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    status TEXT DEFAULT 'IN_PROGRESS', -- ENROLLED, IN_PROGRESS, COMPLETED
    progress_pct INTEGER DEFAULT 0,
    assigned_by TEXT DEFAULT 'SELF', -- SELF, TP_CELL
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (student_id) REFERENCES people_students(id),
    FOREIGN KEY (module_id) REFERENCES learning_modules(id),
    UNIQUE(student_id, module_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS system_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT, -- NULL for role broadcast
    role_target TEXT, -- 'STUDENT', 'T_AND_P', 'HOD', 'ALL'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO', -- DRIVE, INTERVIEW, READINESS, SYSTEM
    is_read BOOLEAN DEFAULT 0,
    link_view TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AgentOps Schema (Model governance, execution provenance, run logs)
CREATE TABLE IF NOT EXISTS agentops_agents (
    id TEXT PRIMARY KEY,
    agent_code TEXT UNIQUE NOT NULL, -- 'AGENT_50'
    name TEXT NOT NULL,
    domain TEXT NOT NULL, -- 'Placement Intelligence'
    version TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS agentops_model_versions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    version_tag TEXT NOT NULL,
    model_type TEXT NOT NULL, -- 'Hybrid Rule-Scored + Semantic Embeddings'
    weights_config TEXT NOT NULL, -- JSON
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agentops_agents(id)
);

CREATE TABLE IF NOT EXISTS agentops_agent_runs (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    student_id TEXT,
    job_opening_id TEXT,
    execution_type TEXT NOT NULL, -- 'STUDENT_RECOMMENDATION', 'CANDIDATE_RANKING', 'JD_STRUCTURING', 'GAP_ANALYSIS'
    inputs_hash TEXT,
    duration_ms INTEGER,
    status TEXT DEFAULT 'SUCCESS',
    reasoning_summary TEXT,
    model_version TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agentops_agent_outputs (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    student_id TEXT,
    job_opening_id TEXT,
    match_score REAL,
    skill_score REAL,
    project_score REAL,
    role_score REAL,
    location_score REAL,
    readiness_score REAL,
    is_eligible BOOLEAN DEFAULT 1,
    explanation_json TEXT,
    skill_gaps_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES agentops_agent_runs(id)
);

-- Institutional Engagements & Events
CREATE TABLE IF NOT EXISTS institution_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Industry Talk, Placement Drive, Workshop, Hackathon
    event_date TEXT NOT NULL,
    event_time TEXT NOT NULL,
    location TEXT NOT NULL,
    organizer TEXT NOT NULL,
    registered_count INTEGER DEFAULT 0,
    mode TEXT DEFAULT 'Offline'
);

-- Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON identity_users(email);
CREATE INDEX IF NOT EXISTS idx_users_identifier ON identity_users(identifier_code);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON identity_users(role_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON people_students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_usn ON people_students(usn);
CREATE INDEX IF NOT EXISTS idx_students_branch ON people_students(branch);
CREATE INDEX IF NOT EXISTS idx_student_skills_student_id ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_name ON student_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_student_projects_student_id ON student_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_apps_student_id ON placement_drive_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_apps_job_id ON placement_drive_applications(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_placement_apps_status ON placement_drive_applications(status);
CREATE INDEX IF NOT EXISTS idx_placement_jobs_company_id ON placement_job_openings(company_id);
CREATE INDEX IF NOT EXISTS idx_placement_jobs_status ON placement_job_openings(status);
CREATE INDEX IF NOT EXISTS idx_placement_offers_app_id ON placement_offers(application_id);
CREATE INDEX IF NOT EXISTS idx_learning_enr_student_id ON learning_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_enr_module_id ON learning_enrollments(module_id);
`;
