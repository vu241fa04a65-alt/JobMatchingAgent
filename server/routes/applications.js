import express from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { authenticateToken, requireRole, denyHODMutation } from '../middleware/auth.js';

const router = express.Router();

// Helper to resolve student for user
async function getSelfStudent(userId) {
    return await db.get('SELECT * FROM people_students WHERE user_id = ?', [userId]);
}

// Get applications for current student (Strict Data Isolation)
router.get('/my-applications', authenticateToken, async (req, res) => {
    try {
        let studentId = req.query.student_id;

        if (req.user.role_name === 'STUDENT') {
            const selfStudent = await getSelfStudent(req.user.id);
            if (!selfStudent) {
                return res.status(404).json({ error: 'Student profile not found for authenticated user' });
            }
            if (studentId && studentId !== selfStudent.id) {
                return res.status(403).json({ error: 'Unauthorized: Students are restricted from accessing other students\' applications.' });
            }
            studentId = selfStudent.id;
        } else if (!studentId) {
            const firstStudent = await db.get('SELECT id FROM people_students ORDER BY cgpa DESC LIMIT 1');
            studentId = firstStudent?.id;
        }

        if (!studentId) {
            return res.status(404).json({ error: 'No student identifier available' });
        }

        const applications = await db.query(`
            SELECT a.*, j.title as job_title, j.location as job_location, j.role_type, j.ctc_display,
                   c.name as company_name, c.logo_url as company_logo,
                   i.id as interview_id, i.round_name, i.scheduled_time, i.mode as interview_mode, i.meeting_link,
                   o.id as offer_id, o.offered_ctc, o.student_decision
            FROM placement_drive_applications a
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            LEFT JOIN placement_interviews i ON a.id = i.application_id
            LEFT JOIN placement_offers o ON a.id = o.application_id
            WHERE a.student_id = ?
            ORDER BY a.applied_at DESC
        `, [studentId]);

        let underReviewCount = 0;
        let interviewCount = 0;
        let offerCount = 0;
        let notSelectedCount = 0;

        for (const app of applications) {
            if (app.status === 'UNDER_REVIEW' || app.status === 'APPLIED' || app.status === 'SHORTLISTED') underReviewCount++;
            else if (app.status === 'INTERVIEW_SCHEDULED') interviewCount++;
            else if (app.status === 'OFFER_RECEIVED' || app.status === 'SELECTED') offerCount++;
            else if (app.status === 'NOT_SELECTED' || app.status === 'REJECTED') notSelectedCount++;
        }

        res.json({
            total_applications: applications.length,
            counts: {
                total: applications.length,
                under_review: underReviewCount,
                interviews: interviewCount,
                offers: offerCount,
                not_selected: notSelectedCount
            },
            status_overview: [
                { label: 'Offer Received', count: offerCount, color: '#10B981' },
                { label: 'Under Review', count: underReviewCount, color: '#3B82F6' },
                { label: 'Interviews', count: interviewCount, color: '#8B5CF6' },
                { label: 'Not Selected', count: notSelectedCount, color: '#EF4444' }
            ],
            applications
        });
    } catch (err) {
        console.error('Error fetching applications:', err);
        res.status(500).json({ error: 'Server error fetching applications' });
    }
});

// Get all applications (T&P and HOD Only)
router.get('/all', authenticateToken, requireRole(['T_AND_P', 'HOD']), async (req, res) => {
    try {
        const applications = await db.query(`
            SELECT a.*, s.full_name as student_name, s.usn as student_usn, s.branch as student_branch, s.cgpa as student_cgpa,
                   j.title as job_title, j.location as job_location, j.ctc_display,
                   c.name as company_name, c.tier as company_tier,
                   i.round_name, i.scheduled_time, i.mode as interview_mode, i.status as interview_status,
                   o.offered_ctc, o.student_decision
            FROM placement_drive_applications a
            JOIN people_students s ON a.student_id = s.id
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            LEFT JOIN placement_interviews i ON a.id = i.application_id
            LEFT JOIN placement_offers o ON a.id = o.application_id
            ORDER BY a.applied_at DESC
        `);

        res.json({ applications });
    } catch (err) {
        console.error('Error fetching all applications:', err);
        res.status(500).json({ error: 'Server error fetching all applications' });
    }
});

// Apply to a job opening (Student Only, cannot apply for other students)
router.post('/apply', authenticateToken, denyHODMutation, async (req, res) => {
    try {
        const { job_opening_id } = req.body;
        if (!job_opening_id) {
            return res.status(400).json({ error: 'job_opening_id is required' });
        }

        let targetStudentId = null;

        if (req.user.role_name === 'STUDENT') {
            const selfStudent = await getSelfStudent(req.user.id);
            if (!selfStudent) {
                return res.status(404).json({ error: 'Student profile not found' });
            }
            targetStudentId = selfStudent.id;
        } else if (req.user.role_name === 'T_AND_P') {
            targetStudentId = req.body.student_id;
            if (!targetStudentId) {
                return res.status(400).json({ error: 'student_id is required when application is submitted by T&P' });
            }
        } else {
            return res.status(403).json({ error: 'Unauthorized role for job application' });
        }

        // Verify opening exists and is active
        const job = await db.get('SELECT id, status FROM placement_job_openings WHERE id = ?', [job_opening_id]);
        if (!job) {
            return res.status(404).json({ error: 'Job opening not found' });
        }
        if (job.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'This placement opening is no longer accepting applications' });
        }

        // Check if already applied
        const existing = await db.get('SELECT id FROM placement_drive_applications WHERE student_id = ? AND job_opening_id = ?', [targetStudentId, job_opening_id]);
        if (existing) {
            return res.status(400).json({ error: 'You have already submitted an application for this opportunity.' });
        }

        const appId = 'app_' + crypto.randomBytes(6).toString('hex');
        const stageHistory = [
            { stage: 'APPLIED', title: 'Application Submitted', timestamp: new Date().toISOString(), status: 'COMPLETED', notes: 'Application recorded via JobMatch AI portal.' },
            { stage: 'SCREENING', title: 'Eligibility & Resume Screening', timestamp: new Date().toISOString(), status: 'IN_PROGRESS', notes: 'Profile queued for recruiter evaluation.' }
        ];

        const roundsConfig = [
            { id: 'APPLIED', label: 'Application Submitted' },
            { id: 'SCREENING', label: 'Eligibility Screening' },
            { id: 'SHORTLISTED', label: 'Profile Shortlist' },
            { id: 'CODING', label: 'Coding Assessment' },
            { id: 'TECHNICAL_1', label: 'Technical Round 1' },
            { id: 'TECHNICAL_2', label: 'Technical Round 2' },
            { id: 'HR', label: 'HR Interview' },
            { id: 'OFFER', label: 'Offer Received' }
        ];

        await db.run(`
            INSERT INTO placement_drive_applications (id, student_id, job_opening_id, status, current_stage, stage_progress, stage_history, rounds_config, applied_at, notes)
            VALUES (?, ?, ?, 'UNDER_REVIEW', 'APPLIED', 1, ?, ?, CURRENT_TIMESTAMP, 'Application submitted successfully.')
        `, [appId, targetStudentId, job_opening_id, JSON.stringify(stageHistory), JSON.stringify(roundsConfig)]);

        res.json({
            message: 'Application submitted successfully! Your profile has been sent to the recruiter.',
            application_id: appId
        });
    } catch (err) {
        console.error('Error submitting application:', err);
        res.status(500).json({ error: 'Server error submitting application' });
    }
});

// Update Placement Lifecycle Stage (T&P Authorized Only)
router.put('/:id/stage', authenticateToken, requireRole(['T_AND_P']), denyHODMutation, async (req, res) => {
    try {
        const { stage, status, progress, notes, interview, offer } = req.body;
        const appId = req.params.id;

        const app = await db.get(`
            SELECT a.*, s.user_id as student_user_id, s.full_name as student_name, j.title as job_title, c.name as company_name
            FROM placement_drive_applications a
            JOIN people_students s ON a.student_id = s.id
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            WHERE a.id = ?
        `, [appId]);

        if (!app) {
            return res.status(404).json({ error: 'Application record not found' });
        }

        let stageHistory = [];
        try {
            stageHistory = typeof app.stage_history === 'string' ? JSON.parse(app.stage_history) : (app.stage_history || []);
        } catch {
            stageHistory = [];
        }

        const newStageTitle = stage === 'SHORTLISTED' ? 'Shortlisting & Profile Review' :
                              stage === 'CODING' ? 'Online Coding Assessment' :
                              stage === 'TECHNICAL_1' ? 'Technical Interview 1' :
                              stage === 'TECHNICAL_2' ? 'Technical Interview 2' :
                              stage === 'HR' ? 'HR & Cultural Alignment Round' :
                              stage === 'SELECTED' ? 'Final Selection Approved' :
                              stage === 'OFFER' ? 'Official Offer Issued' :
                              stage === 'REJECTED' ? 'Application Closed / Not Selected' :
                              stage;

        stageHistory.push({
            stage,
            title: newStageTitle,
            timestamp: new Date().toISOString(),
            status: status === 'NOT_SELECTED' || status === 'REJECTED' ? 'REJECTED' : 'COMPLETED',
            notes: notes || `Candidate moved to ${newStageTitle} by T&P Cell.`
        });

        await db.run(`
            UPDATE placement_drive_applications 
            SET current_stage = ?, status = ?, stage_progress = ?, stage_history = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [stage, status || 'UNDER_REVIEW', progress || 2, JSON.stringify(stageHistory), notes || '', appId]);

        // If interview scheduled, insert or update placement_interviews
        if (interview && interview.round_name) {
            const intId = 'int_' + crypto.randomBytes(6).toString('hex');
            await db.run(`
                INSERT INTO placement_interviews (id, application_id, round_name, scheduled_time, mode, meeting_link, interviewer_name, status, feedback)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)
            `, [intId, appId, interview.round_name, interview.scheduled_time || 'TBD', interview.mode || 'Google Meet', interview.meeting_link || '', interview.interviewer_name || 'T&P Panel', notes || '']);
        }

        // If offer issued, insert or update placement_offers
        if (offer && offer.ctc) {
            const offId = 'off_' + crypto.randomBytes(6).toString('hex');
            await db.run(`
                INSERT INTO placement_offers (id, application_id, offered_ctc, role_title, joining_date, student_decision)
                VALUES (?, ?, ?, ?, ?, 'ACCEPTED')
            `, [offId, appId, parseFloat(offer.ctc), app.job_title, offer.joining_date || '2027-07-01']);
        }

        // Notify Student
        if (app.student_user_id) {
            const notifId = 'notif_' + crypto.randomBytes(6).toString('hex');
            await db.run(`
                INSERT INTO system_notifications (id, user_id, role_target, title, message, type, is_read, link_view)
                VALUES (?, ?, 'STUDENT', ?, ?, 'DRIVE', 0, 'student-applications')
            `, [notifId, app.student_user_id, `Application Update: ${app.company_name}`, `Your application for ${app.job_title} has advanced to: ${newStageTitle}.`]);
        }

        res.json({
            message: `Candidate application successfully advanced to ${newStageTitle}.`,
            application_id: appId,
            current_stage: stage,
            status: status
        });
    } catch (err) {
        console.error('Error updating application stage:', err);
        res.status(500).json({ error: 'Failed to update candidate application stage' });
    }
});

// Dynamic Application Status Timeline (Authorized access only)
router.get('/timeline/:appId', authenticateToken, async (req, res) => {
    try {
        const app = await db.get(`
            SELECT a.*, j.title as job_title, j.location as job_location, c.name as company_name, c.logo_url as company_logo,
                   i.round_name, i.scheduled_time, i.mode, i.meeting_link, i.interviewer_name
            FROM placement_drive_applications a
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            LEFT JOIN placement_interviews i ON a.id = i.application_id
            WHERE a.id = ?
        `, [req.params.appId]);

        if (!app) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Authorization check: students can only view their own applications
        if (req.user.role_name === 'STUDENT') {
            const selfStudent = await getSelfStudent(req.user.id);
            if (!selfStudent || selfStudent.id !== app.student_id) {
                return res.status(403).json({ error: 'Unauthorized: You cannot access other students\' application timelines.' });
            }
        }

        let stageHistory = [];
        try {
            stageHistory = typeof app.stage_history === 'string' ? JSON.parse(app.stage_history) : (app.stage_history || []);
        } catch {
            stageHistory = [];
        }

        res.json({
            application: app,
            stage_history: stageHistory
        });
    } catch (err) {
        console.error('Error fetching timeline:', err);
        res.status(500).json({ error: 'Error fetching application timeline' });
    }
});

// Detailed Interview Preparation & Schedule Info (Authorized access only)
router.get('/interview-details/:appId', authenticateToken, async (req, res) => {
    try {
        const app = await db.get(`
            SELECT a.*, j.title as job_title, j.location as job_location, c.name as company_name, c.logo_url as company_logo,
                   i.round_name, i.scheduled_time, i.mode, i.meeting_link, i.interviewer_name, i.feedback
            FROM placement_drive_applications a
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            LEFT JOIN placement_interviews i ON a.id = i.application_id
            WHERE a.id = ?
        `, [req.params.appId]);

        if (!app) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Authorization check: students can only view their own interview details
        if (req.user.role_name === 'STUDENT') {
            const selfStudent = await getSelfStudent(req.user.id);
            if (!selfStudent || selfStudent.id !== app.student_id) {
                return res.status(403).json({ error: 'Unauthorized: You cannot view other students\' interview records.' });
            }
        }

        res.json({
            interview: {
                application_id: app.id,
                company_name: app.company_name,
                company_logo: app.company_logo,
                role: app.job_title,
                round_name: app.round_name || 'Technical Round 1',
                scheduled_date: 'Upcoming Round',
                scheduled_time: app.scheduled_time || '10:00 AM – 11:30 AM (IST)',
                mode: app.mode || 'Virtual Meeting',
                meeting_link: app.meeting_link || '',
                interviewer: app.interviewer_name || 'Technical Evaluation Panel',
                feedback: app.feedback || 'Review core technical skills, data structures, and practical projects.'
            },
            preparation_checklist: [
                { task: 'Revise core data structures and problem-solving patterns', completed: true },
                { task: 'Practice system architecture fundamentals and scalability concepts', completed: true },
                { task: 'Review company tech stack and engineering principles', completed: true },
                { task: 'Solve hands-on technical problems within time constraints', completed: true },
                { task: 'Prepare structured examples using the STAR methodology', completed: false },
                { task: 'Verify webcam, microphone, and coding development environment', completed: false }
            ],
            practice_questions: [
                'Explain how you would optimize database queries and indexes for high concurrency.',
                'Design an in-memory cache with eviction policy and thread safety.',
                'Describe the trade-offs between monolithic architectures and microservices.',
                'Walk through how you debugged a critical production bottleneck in a project.'
            ],
            interview_tips: [
                { title: 'Communicate Intent', text: 'Talk through your problem-solving thought process before implementing code.' },
                { title: 'Modular Design', text: 'Break down complex logic into clean, testable helper functions.' },
                { title: 'Clarify Constraints', text: 'Confirm input sizes, bounds, edge conditions, and complexity targets up front.' },
                { title: 'Demonstrate Ownership', text: 'Highlight specific technical contributions you personally made in projects.' }
            ]
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching interview details' });
    }
});

export default router;
