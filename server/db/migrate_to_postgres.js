/**
 * PostgreSQL Database Migration Utility
 * Exports all SQLite schema and production records to a PostgreSQL-compatible dump script,
 * allowing instant migration to a persistent managed PostgreSQL database (e.g. Render PostgreSQL, Supabase, Neon).
 *
 * Usage:
 *   node server/db/migrate_to_postgres.js
 *   psql "$DATABASE_URL" -f server/data/postgres_migration_dump.sql
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, '../data/postgres_migration_dump.sql');

function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return `'${val.toString().replace(/'/g, "''")}'`;
}

async function exportToPostgres() {
    console.log('🔄 Initializing SQLite database to export records...');
    await db.init();

    const tables = [
        'identity_roles',
        'identity_users',
        'people_students',
        'student_skills',
        'student_projects',
        'student_certifications',
        'student_preferences',
        'placement_readiness_summary',
        'placement_companies',
        'placement_job_openings',
        'placement_drive_applications',
        'placement_interviews',
        'placement_offers',
        'learning_modules',
        'learning_enrollments',
        'agentops_agents',
        'agentops_model_versions',
        'agentops_agent_runs',
        'agentops_agent_outputs',
        'system_notifications',
        'institution_events'
    ];

    let sqlDump = `-- ================================================================
-- JobMatch AI — PostgreSQL Production Database Migration Script
-- Generated at: ${new Date().toISOString()}
-- ================================================================

BEGIN;

`;

    // Add DDL schema
    sqlDump += `
-- Drop existing tables with CASCADE to ensure clean initialization
DROP TABLE IF EXISTS system_notifications CASCADE;
DROP TABLE IF EXISTS learning_enrollments CASCADE;
DROP TABLE IF EXISTS learning_modules CASCADE;
DROP TABLE IF EXISTS placement_offers CASCADE;
DROP TABLE IF EXISTS placement_interviews CASCADE;
DROP TABLE IF EXISTS placement_drive_applications CASCADE;
DROP TABLE IF EXISTS agentops_agent_outputs CASCADE;
DROP TABLE IF EXISTS agentops_agent_runs CASCADE;
DROP TABLE IF EXISTS agentops_model_versions CASCADE;
DROP TABLE IF EXISTS agentops_agents CASCADE;
DROP TABLE IF EXISTS placement_job_openings CASCADE;
DROP TABLE IF EXISTS placement_companies CASCADE;
DROP TABLE IF EXISTS placement_readiness_summary CASCADE;
DROP TABLE IF EXISTS student_preferences CASCADE;
DROP TABLE IF EXISTS student_certifications CASCADE;
DROP TABLE IF EXISTS student_projects CASCADE;
DROP TABLE IF EXISTS student_skills CASCADE;
DROP TABLE IF EXISTS people_students CASCADE;
DROP TABLE IF EXISTS identity_users CASCADE;
DROP TABLE IF EXISTS identity_roles CASCADE;
DROP TABLE IF EXISTS institution_events CASCADE;

CREATE TABLE identity_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE identity_users (
    id TEXT PRIMARY KEY,
    identifier_code TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES identity_roles(id),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE people_students (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES identity_users(id),
    usn TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    branch TEXT NOT NULL,
    department TEXT NOT NULL,
    admission_year INTEGER NOT NULL,
    graduation_year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    cgpa NUMERIC(4,2) NOT NULL,
    active_backlogs INTEGER DEFAULT 0,
    history_backlogs INTEGER DEFAULT 0,
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    avatar_url TEXT,
    resume_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_skills (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES people_students(id),
    skill_name TEXT NOT NULL,
    category TEXT,
    proficiency_level TEXT,
    score NUMERIC(3,2) DEFAULT 0.8,
    verified BOOLEAN DEFAULT TRUE
);

CREATE TABLE student_projects (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES people_students(id),
    title TEXT NOT NULL,
    description TEXT,
    tech_stack TEXT,
    role TEXT,
    github_link TEXT,
    live_link TEXT,
    featured BOOLEAN DEFAULT TRUE
);

CREATE TABLE student_certifications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES people_students(id),
    title TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date TEXT,
    credential_id TEXT,
    verification_url TEXT
);

CREATE TABLE student_preferences (
    student_id TEXT PRIMARY KEY REFERENCES people_students(id),
    preferred_roles TEXT,
    preferred_locations TEXT,
    min_expected_ctc NUMERIC(6,2),
    willing_to_relocate BOOLEAN DEFAULT TRUE,
    preferred_job_types TEXT
);

CREATE TABLE placement_readiness_summary (
    student_id TEXT PRIMARY KEY REFERENCES people_students(id),
    overall_readiness_score NUMERIC(5,2) NOT NULL,
    technical_score NUMERIC(5,2) NOT NULL,
    aptitude_score NUMERIC(5,2) NOT NULL,
    communication_score NUMERIC(5,2) NOT NULL,
    interview_readiness_score NUMERIC(5,2) NOT NULL,
    status TEXT DEFAULT 'Placement Ready',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE placement_companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    tier TEXT DEFAULT 'Tier 1',
    industry TEXT NOT NULL,
    website TEXT,
    headquarters TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE placement_job_openings (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES placement_companies(id),
    title TEXT NOT NULL,
    role_type TEXT NOT NULL,
    work_mode TEXT NOT NULL,
    location TEXT NOT NULL,
    ctc_min NUMERIC(6,2),
    ctc_max NUMERIC(6,2),
    ctc_display TEXT NOT NULL,
    min_cgpa NUMERIC(4,2) DEFAULT 7.0,
    max_backlogs INTEGER DEFAULT 0,
    eligible_branches TEXT NOT NULL,
    eligible_grad_years TEXT NOT NULL,
    description TEXT,
    responsibilities TEXT,
    required_skills TEXT NOT NULL,
    preferred_skills TEXT,
    deadline_date TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE placement_drive_applications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES people_students(id),
    job_opening_id TEXT NOT NULL REFERENCES placement_job_openings(id),
    status TEXT DEFAULT 'UNDER_REVIEW',
    current_stage TEXT DEFAULT 'APPLIED',
    stage_progress INTEGER DEFAULT 1,
    stage_history TEXT,
    rounds_config TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(student_id, job_opening_id)
);

CREATE TABLE placement_interviews (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES placement_drive_applications(id),
    round_name TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    mode TEXT DEFAULT 'Virtual',
    meeting_link TEXT,
    interviewer_name TEXT,
    status TEXT DEFAULT 'SCHEDULED',
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE placement_offers (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES placement_drive_applications(id),
    offered_ctc NUMERIC(6,2) NOT NULL,
    role_title TEXT NOT NULL,
    joining_date TEXT,
    student_decision TEXT DEFAULT 'ACCEPTED',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE learning_modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    level TEXT NOT NULL,
    duration_hours INTEGER NOT NULL,
    target_skills TEXT NOT NULL,
    description TEXT,
    enrolled_count INTEGER DEFAULT 0,
    completion_rate NUMERIC(5,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE learning_enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES people_students(id),
    module_id TEXT NOT NULL REFERENCES learning_modules(id),
    status TEXT DEFAULT 'ENROLLED',
    progress_pct INTEGER DEFAULT 0,
    assigned_by TEXT DEFAULT 'TP_CELL',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, module_id)
);

CREATE TABLE agentops_agents (
    id TEXT PRIMARY KEY,
    agent_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE agentops_model_versions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agentops_agents(id),
    version_tag TEXT NOT NULL,
    model_type TEXT NOT NULL,
    weights_config TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agentops_agent_runs (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    student_id TEXT,
    job_opening_id TEXT,
    execution_type TEXT NOT NULL,
    inputs_hash TEXT,
    duration_ms INTEGER,
    status TEXT DEFAULT 'SUCCESS',
    reasoning_summary TEXT,
    model_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agentops_agent_outputs (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES agentops_agent_runs(id),
    student_id TEXT,
    job_opening_id TEXT,
    match_score NUMERIC(5,2),
    skill_score NUMERIC(5,2),
    project_score NUMERIC(5,2),
    role_score NUMERIC(5,2),
    location_score NUMERIC(5,2),
    readiness_score NUMERIC(5,2),
    is_eligible BOOLEAN DEFAULT TRUE,
    explanation_json TEXT,
    skill_gaps_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES identity_users(id),
    role_target TEXT DEFAULT 'STUDENT',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    link_view TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institution_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT NOT NULL,
    location TEXT NOT NULL,
    organizer TEXT NOT NULL,
    registered_count INTEGER DEFAULT 0,
    mode TEXT DEFAULT 'Offline'
);

-- PostgreSQL Performance Indexes
CREATE INDEX idx_users_email ON identity_users(email);
CREATE INDEX idx_users_identifier ON identity_users(identifier_code);
CREATE INDEX idx_students_user_id ON people_students(user_id);
CREATE INDEX idx_students_usn ON people_students(usn);
CREATE INDEX idx_student_skills_student_id ON student_skills(student_id);
CREATE INDEX idx_placement_apps_student_id ON placement_drive_applications(student_id);
CREATE INDEX idx_placement_apps_job_id ON placement_drive_applications(job_opening_id);
CREATE INDEX idx_placement_jobs_company_id ON placement_job_openings(company_id);

`;

    let totalRows = 0;
    for (const table of tables) {
        try {
            const rows = await db.query(`SELECT * FROM ${table}`);
            if (rows.length === 0) continue;

            const cols = Object.keys(rows[0]);
            sqlDump += `\n-- Table: ${table} (${rows.length} rows)\n`;

            for (const row of rows) {
                const values = cols.map(c => escapeSql(row[c])).join(', ');
                sqlDump += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
                totalRows++;
            }
        } catch (e) {
            // Table might not exist or empty
        }
    }

    sqlDump += `\nCOMMIT;\n`;

    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, sqlDump, 'utf8');

    console.log(`✅ PostgreSQL migration script successfully generated!`);
    console.log(`   Exported ${totalRows} rows across ${tables.length} tables.`);
    console.log(`   Target file: ${OUTPUT_FILE}`);
}

exportToPostgres().catch(console.error);
