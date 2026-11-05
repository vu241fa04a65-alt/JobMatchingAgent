import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { agent50 } from '../engine/agent50.js';

const router = express.Router();

// Helper to load student full context
async function getStudentContext(studentId) {
    const student = await db.get('SELECT * FROM people_students WHERE id = ?', [studentId]);
    if (!student) return null;

    const skills = await db.query('SELECT * FROM student_skills WHERE student_id = ?', [studentId]);
    const projects = await db.query('SELECT * FROM student_projects WHERE student_id = ?', [studentId]);
    const certs = await db.query('SELECT * FROM student_certifications WHERE student_id = ?', [studentId]);
    const prefs = await db.get('SELECT * FROM student_preferences WHERE student_id = ?', [studentId]);
    const readiness = await db.get('SELECT * FROM placement_readiness_summary WHERE student_id = ?', [studentId]);

    return { student, skills, projects, certs, prefs: prefs || {}, readiness };
}

// Student Matches Endpoint (Recommended vs All Eligible vs Ineligible)
router.get('/student-matches', authenticateToken, async (req, res) => {
    try {
        let studentId = req.query.student_id;

        // Strict Role Authorization: Students can ONLY access their own matches
        if (req.user.role_name === 'STUDENT') {
            const selfStudent = await db.get('SELECT id FROM people_students WHERE user_id = ?', [req.user.id]);
            if (!selfStudent) {
                return res.status(404).json({ error: 'Student profile not found for authenticated user' });
            }
            if (studentId && studentId !== selfStudent.id) {
                return res.status(403).json({ error: 'Unauthorized: Students are restricted from accessing other students\' matching results.' });
            }
            studentId = selfStudent.id;
        } else {
            // T&P / HOD can request specific student, or default to first student if not provided
            if (!studentId) {
                const firstStudent = await db.get('SELECT id FROM people_students ORDER BY cgpa DESC LIMIT 1');
                studentId = firstStudent?.id;
            }
        }

        if (!studentId) {
            return res.status(404).json({ error: 'No student specified or available' });
        }

        const ctx = await getStudentContext(studentId);
        if (!ctx) {
            return res.status(404).json({ error: 'Student context not found' });
        }

        const jobs = await db.query(`
            SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.industry as company_industry, c.tier as company_tier
            FROM placement_job_openings j
            JOIN placement_companies c ON j.company_id = c.id
            WHERE j.status = 'ACTIVE'
        `);

        // Check applications for this student
        const apps = await db.query('SELECT job_opening_id, status FROM placement_drive_applications WHERE student_id = ?', [studentId]);
        const appMap = new Map(apps.map(a => [a.job_opening_id, a.status]));

        // Safe parallelization for matching calculations
        const evaluatedMatches = await Promise.all(jobs.map(async (job) => {
            const match = await agent50.matchStudentToJob(ctx.student, job, ctx.skills, ctx.projects, ctx.prefs, ctx.readiness, ctx.certs);
            
            return {
                job: {
                    ...job,
                    eligible_branches: typeof job.eligible_branches === 'string' ? JSON.parse(job.eligible_branches) : job.eligible_branches,
                    eligible_grad_years: typeof job.eligible_grad_years === 'string' ? JSON.parse(job.eligible_grad_years) : job.eligible_grad_years,
                    required_skills: typeof job.required_skills === 'string' ? JSON.parse(job.required_skills) : job.required_skills,
                    preferred_skills: typeof job.preferred_skills === 'string' ? JSON.parse(job.preferred_skills) : job.preferred_skills,
                    application_status: appMap.get(job.id) || null
                },
                is_eligible: match.is_eligible,
                eligibility_reasons: match.eligibility_reasons,
                overall_match: match.overall_match,
                component_scores: match.component_scores,
                why_strong_candidate: match.why_strong_candidate,
                preparation_gaps: match.preparation_gaps,
                alumni_insights: match.alumni_insights
            };
        }));

        // Sort by match score descending
        evaluatedMatches.sort((a, b) => b.overall_match - a.overall_match);

        const allEligible = evaluatedMatches.filter(m => m.is_eligible);
        const recommended = evaluatedMatches.filter(m => m.is_eligible && m.overall_match >= 75);
        const closingSoon = allEligible.filter(m => {
            if (!m.job.deadline_date) return false;
            const daysLeft = (new Date(m.job.deadline_date) - new Date()) / (1000 * 60 * 60 * 24);
            return daysLeft <= 14 && daysLeft >= 0;
        });

        // Distribution buckets
        let highFitCount = 0;
        let goodFitCount = 0;
        let emergingFitCount = 0;

        for (const m of allEligible) {
            if (m.overall_match >= 80) highFitCount++;
            else if (m.overall_match >= 60) goodFitCount++;
            else emergingFitCount++;
        }

        res.json({
            student_id: studentId,
            counts: {
                total_opportunities: evaluatedMatches.length,
                eligible_count: allEligible.length,
                recommended_count: recommended.length,
                closing_soon_count: closingSoon.length,
                high_fit: highFitCount,
                good_fit: goodFitCount,
                emerging_fit: emergingFitCount
            },
            distribution: [
                { label: 'High Fit (80-100%)', count: highFitCount, color: '#3B82F6', percentage: Math.round((highFitCount / (allEligible.length || 1)) * 100) },
                { label: 'Good Fit (60-80%)', count: goodFitCount, color: '#8B5CF6', percentage: Math.round((goodFitCount / (allEligible.length || 1)) * 100) },
                { label: 'Emerging Fit (40-60%)', count: emergingFitCount, color: '#A855F7', percentage: Math.round((emergingFitCount / (allEligible.length || 1)) * 100) }
            ],
            matches: evaluatedMatches,
            recommended,
            all_eligible: allEligible,
            closing_soon: closingSoon
        });
    } catch (err) {
        console.error('Error in student matches:', err);
        res.status(500).json({ error: 'Server error generating student matches' });
    }
});

// Opportunity Details Deep-Dive
router.get('/opportunity-deep-dive/:jobId', authenticateToken, async (req, res) => {
    try {
        let studentId = req.query.student_id;

        if (req.user.role_name === 'STUDENT') {
            const selfStudent = await db.get('SELECT id FROM people_students WHERE user_id = ?', [req.user.id]);
            if (!selfStudent) return res.status(404).json({ error: 'Student not found' });
            if (studentId && studentId !== selfStudent.id) {
                return res.status(403).json({ error: 'Unauthorized: Students are restricted from accessing other students\' match deep-dives.' });
            }
            studentId = selfStudent.id;
        } else if (!studentId) {
            const firstStudent = await db.get('SELECT id FROM people_students ORDER BY cgpa DESC LIMIT 1');
            studentId = firstStudent?.id;
        }

        const ctx = await getStudentContext(studentId);
        if (!ctx) return res.status(404).json({ error: 'Student context not found' });

        const job = await db.get(`
            SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.industry as company_industry, 
                   c.tier as company_tier, c.website as company_website, c.description as company_description, c.headquarters as company_headquarters
            FROM placement_job_openings j
            JOIN placement_companies c ON j.company_id = c.id
            WHERE j.id = ?
        `, [req.params.jobId]);

        if (!job) return res.status(404).json({ error: 'Job opening not found' });

        const match = await agent50.matchStudentToJob(ctx.student, job, ctx.skills, ctx.projects, ctx.prefs, ctx.readiness, ctx.certs);
        const application = await db.get('SELECT * FROM placement_drive_applications WHERE student_id = ? AND job_opening_id = ?', [studentId, job.id]);

        res.json({
            job: {
                ...job,
                eligible_branches: typeof job.eligible_branches === 'string' ? JSON.parse(job.eligible_branches) : job.eligible_branches,
                eligible_grad_years: typeof job.eligible_grad_years === 'string' ? JSON.parse(job.eligible_grad_years) : job.eligible_grad_years,
                required_skills: typeof job.required_skills === 'string' ? JSON.parse(job.required_skills) : job.required_skills,
                preferred_skills: typeof job.preferred_skills === 'string' ? JSON.parse(job.preferred_skills) : job.preferred_skills,
                responsibilities: typeof job.responsibilities === 'string' ? JSON.parse(job.responsibilities) : job.responsibilities,
                has_applied: !!application,
                application
            },
            match_analysis: match
        });
    } catch (err) {
        console.error('Error in opportunity deep dive:', err);
        res.status(500).json({ error: 'Server error generating deep dive match analysis' });
    }
});

// T&P / HOD: Ranked Candidates for a Specific Job Opening (Optimized batch fetching)
router.get('/job-candidates/:jobId', authenticateToken, requireRole(['T_AND_P', 'HOD']), async (req, res) => {
    try {
        const job = await db.get(`
            SELECT j.*, c.name as company_name, c.logo_url as company_logo
            FROM placement_job_openings j
            JOIN placement_companies c ON j.company_id = c.id
            WHERE j.id = ?
        `, [req.params.jobId]);

        if (!job) return res.status(404).json({ error: 'Job opening not found' });

        const students = await db.query('SELECT * FROM people_students ORDER BY cgpa DESC');

        // Batch pre-fetch all skills, projects, preferences, readiness, and applications in single queries
        const [allSkills, allProjects, allPrefs, allReadiness, allApps] = await Promise.all([
            db.query('SELECT * FROM student_skills'),
            db.query('SELECT * FROM student_projects'),
            db.query('SELECT * FROM student_preferences'),
            db.query('SELECT * FROM placement_readiness_summary'),
            db.query('SELECT student_id, status FROM placement_drive_applications WHERE job_opening_id = ?', [job.id])
        ]);

        const skillsMap = new Map();
        for (const sk of allSkills) {
            if (!skillsMap.has(sk.student_id)) skillsMap.set(sk.student_id, []);
            skillsMap.get(sk.student_id).push(sk);
        }

        const projectsMap = new Map();
        for (const pr of allProjects) {
            if (!projectsMap.has(pr.student_id)) projectsMap.set(pr.student_id, []);
            projectsMap.get(pr.student_id).push(pr);
        }

        const prefsMap = new Map(allPrefs.map(p => [p.student_id, p]));
        const readinessMap = new Map(allReadiness.map(r => [r.student_id, r]));
        const appsMap = new Map(allApps.map(a => [a.student_id, a.status]));

        // Parallelize candidate evaluation
        const candidates = await Promise.all(students.map(async (std) => {
            const sSkills = skillsMap.get(std.id) || [];
            const sProjects = projectsMap.get(std.id) || [];
            const sPrefs = prefsMap.get(std.id) || {};
            const sReadiness = readinessMap.get(std.id) || null;
            const appStatus = appsMap.get(std.id) || 'NOT_APPLIED';

            const match = await agent50.matchStudentToJob(std, job, sSkills, sProjects, sPrefs, sReadiness);

            return {
                student: std,
                skills: sSkills.map(s => s.skill_name),
                readiness_score: sReadiness ? sReadiness.overall_readiness_score : 75,
                is_eligible: match.is_eligible,
                eligibility_reasons: match.eligibility_reasons,
                overall_match: match.overall_match,
                component_scores: match.component_scores,
                why_strong_candidate: match.why_strong_candidate,
                preparation_gaps: match.preparation_gaps,
                application_status: appStatus
            };
        }));

        // Sort candidates: eligible first by match score desc, then ineligible
        candidates.sort((a, b) => {
            if (a.is_eligible === b.is_eligible) {
                return b.overall_match - a.overall_match;
            }
            return a.is_eligible ? -1 : 1;
        });

        res.json({
            job_title: job.title,
            company_name: job.company_name,
            total_students_evaluated: students.length,
            eligible_candidates_count: candidates.filter(c => c.is_eligible).length,
            candidates
        });
    } catch (err) {
        console.error('Error fetching job candidates:', err);
        res.status(500).json({ error: 'Server error ranking candidates' });
    }
});

// Unmatched Student Intelligence (T&P / HOD Only)
router.get('/unmatched-students', authenticateToken, requireRole(['T_AND_P', 'HOD']), async (req, res) => {
    try {
        const students = await db.query('SELECT * FROM people_students');
        const jobs = await db.query('SELECT * FROM placement_job_openings WHERE status = "ACTIVE"');

        // Batch fetch
        const [allSkills, allProjects, allReadiness] = await Promise.all([
            db.query('SELECT student_id, skill_name FROM student_skills'),
            db.query('SELECT student_id, id FROM student_projects'),
            db.query('SELECT * FROM placement_readiness_summary')
        ]);

        const skillCountMap = new Map();
        for (const sk of allSkills) {
            skillCountMap.set(sk.student_id, (skillCountMap.get(sk.student_id) || 0) + 1);
        }

        const projectCountMap = new Map();
        for (const pr of allProjects) {
            projectCountMap.set(pr.student_id, (projectCountMap.get(pr.student_id) || 0) + 1);
        }

        const readinessMap = new Map(allReadiness.map(r => [r.student_id, r]));

        const studentMatchReports = [];
        let factorCgpa = 0;
        let factorBacklog = 0;
        let factorSkills = 0;
        let factorProjects = 0;

        for (const std of students) {
            let eligibleMatchCount = 0;
            for (const job of jobs) {
                const eligibility = agent50.checkEligibility(std, job);
                if (eligibility.is_eligible) {
                    eligibleMatchCount++;
                }
            }

            const readiness = readinessMap.get(std.id);
            const skillsCount = skillCountMap.get(std.id) || 0;
            const projectsCount = projectCountMap.get(std.id) || 0;

            if (eligibleMatchCount <= 3 || (readiness && readiness.status === 'Needs Attention')) {
                const reasons = [];
                if (std.cgpa < 7.5) {
                    reasons.push('CGPA threshold constraint (< 7.5 cutoff for tier-1 openings)');
                    factorCgpa++;
                }
                if (std.active_backlogs > 0) {
                    reasons.push('Active backlog restriction');
                    factorBacklog++;
                }
                if (skillsCount < 5) {
                    reasons.push('Fewer verified technical competencies on profile');
                    factorSkills++;
                }
                if (projectsCount === 0) {
                    reasons.push('No portfolio projects recorded');
                    factorProjects++;
                }
                if (reasons.length === 0) {
                    reasons.push('Skill alignment with high-demand Cloud/DevOps stacks needed');
                    factorSkills++;
                }

                studentMatchReports.push({
                    student: std,
                    eligible_opportunities_count: eligibleMatchCount,
                    high_fit_count: eligibleMatchCount > 0 ? 1 : 0,
                    readiness_score: readiness ? readiness.overall_readiness_score : 50,
                    status: readiness ? readiness.status : 'Needs Attention',
                    contributing_factors: reasons,
                    recommended_interventions: [
                        'Assign fast-track skill bootcamp in Cloud & Distributed Systems',
                        'Offer mock technical interview session with alumni mentor',
                        'Guide student on capstone portfolio project creation'
                    ]
                });
            }
        }

        const totalBottlenecks = factorCgpa + factorBacklog + factorSkills + factorProjects || 1;

        res.json({
            total_unmatched_or_at_risk: studentMatchReports.length,
            bottlenecks_distribution: [
                { factor: 'Technical Skill Portfolio Depth', impact_count: factorSkills, percentage: Math.round((factorSkills / totalBottlenecks) * 100) },
                { factor: 'Academic CGPA Cutoff Thresholds', impact_count: factorCgpa, percentage: Math.round((factorCgpa / totalBottlenecks) * 100) },
                { factor: 'Lack of Recorded Portfolio Projects', impact_count: factorProjects, percentage: Math.round((factorProjects / totalBottlenecks) * 100) },
                { factor: 'Active Academic Backlogs', impact_count: factorBacklog, percentage: Math.round((factorBacklog / totalBottlenecks) * 100) }
            ],
            students: studentMatchReports
        });
    } catch (err) {
        console.error('Error fetching unmatched students:', err);
        res.status(500).json({ error: 'Server error analyzing unmatched students' });
    }
});

export default router;
