import express from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { authenticateToken, requireRole, denyHODMutation } from '../middleware/auth.js';
import { JDAnalyzer } from '../engine/jdAnalyzer.js';

const router = express.Router();

// List all active jobs with company details
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { branch, role_type, location, search } = req.query;

        let sql = `
            SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.industry as company_industry, c.tier as company_tier, c.website as company_website
            FROM placement_job_openings j
            JOIN placement_companies c ON j.company_id = c.id
            WHERE j.status = 'ACTIVE'
        `;
        const params = [];

        if (role_type && role_type !== 'All') {
            sql += ` AND j.role_type = ?`;
            params.push(role_type);
        }

        if (location && location !== 'All') {
            sql += ` AND j.location LIKE ?`;
            params.push(`%${location}%`);
        }

        if (search) {
            sql += ` AND (j.title LIKE ? OR c.name LIKE ? OR j.required_skills LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        sql += ` ORDER BY j.created_at DESC`;

        const jobs = await db.query(sql, params);

        // Check if student has applied to each job
        let appliedJobIds = new Set();
        if (req.user.role_name === 'STUDENT') {
            const student = await db.get('SELECT id FROM people_students WHERE user_id = ?', [req.user.id]);
            if (student) {
                const apps = await db.query('SELECT job_opening_id FROM placement_drive_applications WHERE student_id = ?', [student.id]);
                appliedJobIds = new Set(apps.map(a => a.job_opening_id));
            }
        }

        const formattedJobs = jobs.map(j => ({
            ...j,
            eligible_branches: typeof j.eligible_branches === 'string' ? JSON.parse(j.eligible_branches) : j.eligible_branches,
            eligible_grad_years: typeof j.eligible_grad_years === 'string' ? JSON.parse(j.eligible_grad_years) : j.eligible_grad_years,
            required_skills: typeof j.required_skills === 'string' ? JSON.parse(j.required_skills) : j.required_skills,
            preferred_skills: typeof j.preferred_skills === 'string' ? JSON.parse(j.preferred_skills) : j.preferred_skills,
            responsibilities: typeof j.responsibilities === 'string' ? JSON.parse(j.responsibilities) : j.responsibilities,
            has_applied: appliedJobIds.has(j.id)
        }));

        res.json({ jobs: formattedJobs });
    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.status(500).json({ error: 'Server error fetching job openings' });
    }
});

// Get detailed job opening
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const job = await db.get(`
            SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.industry as company_industry, 
                   c.tier as company_tier, c.website as company_website, c.description as company_description, c.headquarters as company_headquarters
            FROM placement_job_openings j
            JOIN placement_companies c ON j.company_id = c.id
            WHERE j.id = ?
        `, [req.params.id]);

        if (!job) {
            return res.status(404).json({ error: 'Job opening not found' });
        }

        let application = null;
        if (req.user.role_name === 'STUDENT') {
            const student = await db.get('SELECT id FROM people_students WHERE user_id = ?', [req.user.id]);
            if (student) {
                application = await db.get('SELECT * FROM placement_drive_applications WHERE student_id = ? AND job_opening_id = ?', [student.id, job.id]);
            }
        }

        res.json({
            job: {
                ...job,
                eligible_branches: typeof job.eligible_branches === 'string' ? JSON.parse(job.eligible_branches) : job.eligible_branches,
                eligible_grad_years: typeof job.eligible_grad_years === 'string' ? JSON.parse(job.eligible_grad_years) : job.eligible_grad_years,
                required_skills: typeof job.required_skills === 'string' ? JSON.parse(job.required_skills) : job.required_skills,
                preferred_skills: typeof job.preferred_skills === 'string' ? JSON.parse(job.preferred_skills) : job.preferred_skills,
                responsibilities: typeof job.responsibilities === 'string' ? JSON.parse(job.responsibilities) : job.responsibilities,
                application
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching job details' });
    }
});

// AI Job Description Structuring endpoint
router.post('/analyze-jd', authenticateToken, async (req, res) => {
    try {
        const { raw_text, company_name } = req.body;
        if (!raw_text) {
            return res.status(400).json({ error: 'Job description text is required for AI analysis' });
        }

        const structuredResult = await JDAnalyzer.analyzeJobDescription(raw_text, company_name);
        res.json({
            message: 'Job description successfully parsed and structured by AI',
            structured: structuredResult
        });
    } catch (err) {
        console.error('JD Analysis error:', err);
        res.status(500).json({ error: 'Failed to analyze job description' });
    }
});

// Create new company opportunity (T&P Only, HOD blocked)
router.post('/create', authenticateToken, requireRole(['T_AND_P']), denyHODMutation, async (req, res) => {
    try {
        const {
            company_id, company_name, company_logo, logo_url, title, role_type, work_mode, location,
            ctc_min, ctc_max, min_cgpa, max_backlogs, eligible_branches,
            eligible_grad_years, description, responsibilities, required_skills,
            preferred_skills, deadline_date
        } = req.body;

        let targetCompanyId = company_id;
        const targetLogo = logo_url || company_logo || null;

        // If new company name provided, create company or lookup
        if (!targetCompanyId && company_name) {
            const existingComp = await db.get('SELECT id, logo_url FROM placement_companies WHERE LOWER(name) = LOWER(?)', [company_name.trim()]);
            if (existingComp) {
                targetCompanyId = existingComp.id;
                if (targetLogo) {
                    await db.run('UPDATE placement_companies SET logo_url = ? WHERE id = ?', [targetLogo, existingComp.id]);
                }
            } else {
                targetCompanyId = 'comp_' + crypto.randomBytes(4).toString('hex');
                await db.run(
                    `INSERT INTO placement_companies (id, name, tier, industry, headquarters, description, logo_url) VALUES (?, ?, 'Tier 1', 'Technology', ?, 'Innovative tech organization.', ?)`,
                    [targetCompanyId, company_name.trim(), location || 'Bengaluru, India', targetLogo]
                );
            }
        }

        const jobId = 'job_' + crypto.randomBytes(6).toString('hex');
        const ctcDisplay = `₹ ${ctc_min || 15} - ${ctc_max || 25} LPA`;

        await db.run(`
            INSERT INTO placement_job_openings 
            (id, company_id, title, role_type, work_mode, location, ctc_min, ctc_max, ctc_display, min_cgpa, max_backlogs, eligible_branches, eligible_grad_years, description, responsibilities, required_skills, preferred_skills, deadline_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        `, [
            jobId,
            targetCompanyId,
            title,
            role_type || 'Full-time',
            work_mode || 'Hybrid',
            location || 'Bengaluru, India',
            ctc_min || 15.0,
            ctc_max || 25.0,
            ctcDisplay,
            min_cgpa || 7.0,
            max_backlogs || 0,
            JSON.stringify(eligible_branches || ['CSE', 'ISE', 'ECE']),
            JSON.stringify(eligible_grad_years || [2026, 2027]),
            description || `Role: ${title} at ${company_name}`,
            JSON.stringify(responsibilities || ['Design and deliver software modules', 'Collaborate with engineering teams']),
            JSON.stringify(required_skills || ['Data Structures', 'Python', 'Algorithms', 'SQL']),
            JSON.stringify(preferred_skills || ['Cloud (AWS)', 'Docker']),
            deadline_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        ]);

        res.json({
            message: 'Company opportunity created successfully',
            job_id: jobId
        });
    } catch (err) {
        console.error('Error creating job opening:', err);
        res.status(500).json({ error: 'Server error creating opportunity' });
    }
});

export default router;
