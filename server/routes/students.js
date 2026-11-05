import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { authenticateToken, requireRole, denyHODMutation } from '../middleware/auth.js';

const router = express.Router();

// Get list of all students (T&P and HOD Only)
router.get('/', authenticateToken, requireRole(['T_AND_P', 'HOD']), async (req, res) => {
    try {
        const students = await db.query(`
            SELECT s.*, u.avatar_url as user_avatar,
                   r.overall_readiness_score, r.technical_score, r.aptitude_score, r.communication_score, r.interview_readiness_score, r.status as readiness_status
            FROM people_students s
            LEFT JOIN identity_users u ON s.user_id = u.id
            LEFT JOIN placement_readiness_summary r ON s.id = r.student_id
            ORDER BY s.cgpa DESC
        `);

        // Attach skills array for each student
        const allSkills = await db.query('SELECT student_id, skill_name, proficiency_level, score FROM student_skills ORDER BY score DESC');
        const skillMap = new Map();
        for (const sk of allSkills) {
            if (!skillMap.has(sk.student_id)) skillMap.set(sk.student_id, []);
            skillMap.get(sk.student_id).push(sk.skill_name);
        }

        // Attach offer status
        const allOffers = await db.query(`
            SELECT a.student_id, o.offered_ctc, o.role_title, c.name as company_name
            FROM placement_offers o
            JOIN placement_drive_applications a ON o.application_id = a.id
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            WHERE o.student_decision = 'ACCEPTED'
        `);
        const offerMap = new Map();
        for (const off of allOffers) {
            offerMap.set(off.student_id, off);
        }

        const enrichedStudents = students.map(s => {
            const offer = offerMap.get(s.id);
            const placementStatus = offer ? 'Placed' : s.overall_readiness_score > 80 ? 'Placement Ready' : 'In Preparation';
            return {
                ...s,
                skills: skillMap.get(s.id) || [],
                skills_list: (skillMap.get(s.id) || []).join(', '),
                placement_status: placementStatus,
                offer_details: offer || null
            };
        });

        res.json({ students: enrichedStudents });
    } catch (err) {
        console.error('Error fetching students list:', err);
        res.status(500).json({ error: 'Server error fetching students list' });
    }
});

// Create new student (T&P Only, HOD blocked)
router.post('/', authenticateToken, requireRole(['T_AND_P']), denyHODMutation, async (req, res) => {
    try {
        const { full_name, usn, email, branch, department, admission_year, graduation_year, semester, cgpa, password } = req.body;

        if (!full_name || !usn || !email || !branch || !cgpa) {
            return res.status(400).json({ error: 'Missing required fields (full_name, usn, email, branch, cgpa)' });
        }

        const cleanUSN = usn.toUpperCase().trim();
        const cleanEmail = email.toLowerCase().trim();

        // Check for existing USN or Email
        const existing = await db.get('SELECT id FROM people_students WHERE usn = ? OR email = ?', [cleanUSN, cleanEmail]);
        if (existing) {
            return res.status(400).json({ error: 'A student with this USN or Email already exists.' });
        }

        const userId = 'usr_' + crypto.randomBytes(6).toString('hex');
        const studentId = 'std_' + crypto.randomBytes(6).toString('hex');
        const plainPassword = password || 'Student@123';
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        // 1. Create Identity User
        await db.run(`
            INSERT INTO identity_users (id, identifier_code, email, password_hash, full_name, role_id)
            VALUES (?, ?, ?, ?, ?, 'role_student')
        `, [userId, cleanUSN, cleanEmail, passwordHash, full_name.trim()]);

        // 2. Create Student Profile
        const dept = department || (branch === 'CSE' ? 'Computer Science and Engineering' : branch === 'ISE' ? 'Information Science and Engineering' : branch === 'ECE' ? 'Electronics & Communication' : branch === 'EEE' ? 'Electrical and Electronics' : branch === 'ME' ? 'Mechanical Engineering' : 'Engineering');
        const adm = admission_year ? parseInt(admission_year) : 2023;
        const grad = graduation_year ? parseInt(graduation_year) : 2027;
        const sem = semester ? parseInt(semester) : 5;
        const numCgpa = parseFloat(cgpa);

        await db.run(`
            INSERT INTO people_students (id, user_id, usn, full_name, email, branch, department, admission_year, graduation_year, semester, cgpa, active_backlogs, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'Engineering student at RV College of Engineering.')
        `, [studentId, userId, cleanUSN, full_name.trim(), cleanEmail, branch.toUpperCase(), dept, adm, grad, sem, numCgpa]);

        // 3. Default Readiness Score
        const readinessScore = Math.min(95, Math.max(50, Math.round(numCgpa * 10)));
        await db.run(`
            INSERT INTO placement_readiness_summary (student_id, overall_readiness_score, technical_score, aptitude_score, communication_score, interview_readiness_score, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Placement Ready')
        `, [studentId, readinessScore, readinessScore + 2, readinessScore - 3, readinessScore, readinessScore]);

        // 4. Default baseline skills
        const defaultSkills = branch === 'CSE' || branch === 'ISE' ? ['Python', 'Data Structures', 'SQL', 'Algorithms', 'Java'] : branch === 'ECE' ? ['C++', 'Embedded C', 'VLSI', 'Verilog', 'MATLAB'] : ['AutoCAD', 'SolidWorks', 'Python', 'MATLAB'];
        for (const sk of defaultSkills) {
            await db.run(`
                INSERT INTO student_skills (id, student_id, skill_name, category, proficiency_level, score, verified)
                VALUES (?, ?, ?, 'Engineering', 'Advanced', 0.85, 1)
            `, ['sk_' + crypto.randomBytes(6).toString('hex'), studentId, sk]);
        }

        res.status(201).json({
            message: 'Student account and academic profile created successfully!',
            student: {
                id: studentId,
                user_id: userId,
                usn: cleanUSN,
                full_name: full_name.trim(),
                email: cleanEmail,
                branch: branch.toUpperCase(),
                cgpa: numCgpa
            }
        });
    } catch (err) {
        console.error('Error creating student account:', err);
        res.status(500).json({ error: 'Server error creating student record' });
    }
});

// Get single student profile by ID (Strict Role & Isolation Rules)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        let studentId = req.params.id;

        // If role is STUDENT, strictly enforce data isolation: student can only fetch their own profile
        if (req.user.role_name === 'STUDENT') {
            const selfStudent = await db.get('SELECT * FROM people_students WHERE user_id = ?', [req.user.id]);
            if (!selfStudent) {
                return res.status(404).json({ error: 'Student profile not found for authenticated user' });
            }
            if (studentId !== 'profile' && studentId !== 'me' && studentId !== selfStudent.id && studentId !== selfStudent.user_id) {
                return res.status(403).json({ error: 'Unauthorized: Students are restricted from accessing other students\' profiles.' });
            }
            studentId = selfStudent.id;
        } else if (studentId === 'profile' || studentId === 'me') {
            return res.status(400).json({ error: 'Specific student ID required for administrative profile lookup' });
        }

        const student = await db.get(`
            SELECT s.*, u.avatar_url as user_avatar, u.identifier_code
            FROM people_students s
            LEFT JOIN identity_users u ON s.user_id = u.id
            WHERE s.id = ? OR s.user_id = ?
        `, [studentId, studentId]);

        if (!student) {
            return res.status(404).json({ error: 'Student record not found' });
        }

        const realStudentId = student.id;

        const skills = await db.query('SELECT * FROM student_skills WHERE student_id = ? ORDER BY score DESC', [realStudentId]);
        const projects = await db.query('SELECT * FROM student_projects WHERE student_id = ?', [realStudentId]);
        const parsedProjects = projects.map(p => {
            let techStack = [];
            try {
                techStack = typeof p.tech_stack === 'string' ? JSON.parse(p.tech_stack) : p.tech_stack;
            } catch {
                techStack = p.tech_stack ? [p.tech_stack] : [];
            }
            return {
                ...p,
                tech_stack: techStack
            };
        });

        const certs = await db.query('SELECT * FROM student_certifications WHERE student_id = ?', [realStudentId]);
        const preferences = await db.get('SELECT * FROM student_preferences WHERE student_id = ?', [realStudentId]);
        const readiness = await db.get('SELECT * FROM placement_readiness_summary WHERE student_id = ?', [realStudentId]);

        const parsedPrefs = preferences ? {
            ...preferences,
            preferred_roles: typeof preferences.preferred_roles === 'string' ? JSON.parse(preferences.preferred_roles) : preferences.preferred_roles,
            preferred_locations: typeof preferences.preferred_locations === 'string' ? JSON.parse(preferences.preferred_locations) : preferences.preferred_locations,
            preferred_job_types: typeof preferences.preferred_job_types === 'string' ? JSON.parse(preferences.preferred_job_types) : preferences.preferred_job_types
        } : null;

        // Applications history for this student
        const applications = await db.query(`
            SELECT a.*, j.title as job_title, j.location as job_location, j.ctc_display, c.name as company_name, c.logo_url as company_logo
            FROM placement_drive_applications a
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            WHERE a.student_id = ?
            ORDER BY a.applied_at DESC
        `, [realStudentId]);

        // Offers for this student
        const offers = await db.query(`
            SELECT o.*, j.title as job_title, c.name as company_name
            FROM placement_offers o
            JOIN placement_drive_applications a ON o.application_id = a.id
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            WHERE a.student_id = ?
        `, [realStudentId]);

        res.json({
            student,
            skills,
            projects: parsedProjects,
            certifications: certs,
            preferences: parsedPrefs,
            readiness: readiness || {
                overall_readiness_score: 82,
                technical_score: 85,
                aptitude_score: 80,
                communication_score: 78,
                interview_readiness_score: 85,
                status: 'Placement Ready'
            },
            applications,
            offers,
            stats: {
                total_applications: applications.length,
                interviews_scheduled: applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length,
                offers_count: offers.length,
                learning_hours: 36,
                skills_improved: skills.length,
                profile_completeness: 92
            }
        });
    } catch (err) {
        console.error('Error fetching student profile details:', err);
        res.status(500).json({ error: 'Server error fetching student profile details' });
    }
});

// Update student profile (Self or Authorized T&P, HOD blocked)
router.put('/profile', authenticateToken, denyHODMutation, async (req, res) => {
    try {
        let studentId = null;
        let userId = null;

        if (req.user.role_name === 'STUDENT') {
            const selfStudent = await db.get('SELECT id, user_id FROM people_students WHERE user_id = ?', [req.user.id]);
            if (!selfStudent) {
                return res.status(404).json({ error: 'Student profile not found' });
            }
            studentId = selfStudent.id;
            userId = selfStudent.user_id;
        } else if (req.user.role_name === 'T_AND_P') {
            studentId = req.body.student_id;
            if (!studentId) {
                return res.status(400).json({ error: 'student_id is required for T&P profile updates' });
            }
            const targetStudent = await db.get('SELECT id, user_id FROM people_students WHERE id = ?', [studentId]);
            if (!targetStudent) {
                return res.status(404).json({ error: 'Target student not found' });
            }
            userId = targetStudent.user_id;
        } else {
            return res.status(403).json({ error: 'Unauthorized role for profile modification' });
        }

        const { full_name, bio, linkedin_url, github_url, phone, avatar_url, preferred_roles, preferred_locations } = req.body;

        await db.run(
            `UPDATE people_students 
             SET full_name = COALESCE(?, full_name),
                 bio = COALESCE(?, bio), 
                 linkedin_url = COALESCE(?, linkedin_url), 
                 github_url = COALESCE(?, github_url), 
                 phone = COALESCE(?, phone),
                 avatar_url = COALESCE(?, avatar_url)
             WHERE id = ?`,
            [full_name, bio, linkedin_url, github_url, phone, avatar_url, studentId]
        );

        if (userId) {
            await db.run(
                `UPDATE identity_users 
                 SET full_name = COALESCE(?, full_name),
                     avatar_url = COALESCE(?, avatar_url)
                 WHERE id = ?`,
                [full_name, avatar_url, userId]
            );
        }

        // Update preferences if provided
        if (preferred_roles || preferred_locations) {
            await db.run(`
                INSERT INTO student_preferences (student_id, preferred_roles, preferred_locations, willing_to_relocate)
                VALUES (?, ?, ?, 1)
                ON CONFLICT(student_id) DO UPDATE SET
                    preferred_roles = COALESCE(excluded.preferred_roles, preferred_roles),
                    preferred_locations = COALESCE(excluded.preferred_locations, preferred_locations)
            `, [studentId, preferred_roles ? JSON.stringify(preferred_roles) : null, preferred_locations ? JSON.stringify(preferred_locations) : null]);
        }

        res.json({ 
            message: 'Profile updated successfully!',
            updated: { full_name, bio, linkedin_url, github_url, phone, avatar_url }
        });
    } catch (err) {
        console.error('Error updating student profile:', err);
        res.status(500).json({ error: 'Error updating student profile' });
    }
});

export default router;
