import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Preparation Center Summary Endpoint
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        let studentId = req.query.student_id;
        if (req.user.role_name === 'STUDENT') {
            const student = await db.get('SELECT id FROM people_students WHERE user_id = ?', [req.user.id]);
            if (!student) {
                return res.status(404).json({ error: 'Student profile not found' });
            }
            if (studentId && studentId !== student.id) {
                return res.status(403).json({ error: 'Unauthorized: Students are restricted from accessing other students\' preparation summaries.' });
            }
            studentId = student.id;
        } else if (!studentId) {
            const firstStudent = await db.get('SELECT id FROM people_students ORDER BY cgpa DESC LIMIT 1');
            studentId = firstStudent?.id;
        }

        if (!studentId) {
            return res.status(404).json({ error: 'No student specified' });
        }

        const readiness = await db.get('SELECT * FROM placement_readiness_summary WHERE student_id = ?', [studentId]);

        // Top skill gaps aggregate across active opportunities
        const topGaps = [
            {
                skill: 'Docker',
                category: 'DevOps & Containers',
                required_in_count: 6,
                companies: [
                    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
                    { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
                    { name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg' }
                ],
                remaining_companies_count: 3,
                urgency: 'High Priority',
                learning_time: '2-3 weeks',
                description: 'Docker containerization is essential for backend deployment across 6 hiring companies.'
            },
            {
                skill: 'AWS',
                category: 'Cloud Infrastructure',
                required_in_count: 4,
                companies: [
                    { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
                    { name: 'Deloitte', logo: '/deloitte-logo.png' },
                    { name: 'TCS', logo: '/tcs-logo.webp' }
                ],
                remaining_companies_count: 1,
                urgency: 'High Priority',
                learning_time: '3-4 weeks',
                description: 'AWS Cloud fundamentals (EC2, S3, RDS, IAM) required for scalable cloud roles.'
            },
            {
                skill: 'System Design',
                category: 'Architecture',
                required_in_count: 3,
                companies: [
                    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
                    { name: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.png' },
                    { name: 'Uber', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png' }
                ],
                remaining_companies_count: 1,
                urgency: 'High Priority',
                learning_time: '4 weeks',
                description: 'High-level and low-level system design patterns for Tier-1 engineering drives.'
            },
            {
                skill: 'DevOps',
                category: 'CI/CD & Infra',
                required_in_count: 3,
                companies: [
                    { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
                    { name: 'TCS', logo: '/tcs-logo.webp' },
                    { name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg' }
                ],
                remaining_companies_count: 1,
                urgency: 'Medium Priority',
                learning_time: '2 weeks',
                description: 'Continuous Integration and Deployment automation workflows.'
            },
            {
                skill: 'DSA',
                category: 'Core Algorithms',
                required_in_count: 2,
                companies: [
                    { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
                    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' }
                ],
                remaining_companies_count: 0,
                urgency: 'High Priority',
                learning_time: 'Daily Practice',
                description: 'Trees, Graphs, Dynamic Programming and amortized analysis.'
            }
        ];

        res.json({
            readiness: readiness || {
                overall_readiness_score: 82,
                technical_score: 88,
                aptitude_score: 85,
                communication_score: 78,
                interview_readiness_score: 76,
                status: 'Placement Ready'
            },
            metrics: {
                overall_readiness: 82,
                skills_to_improve: 8,
                high_priority_skills: 6,
                recommended_resources: 12
            },
            top_skill_gaps: topGaps,
            skill_demand_distribution: [
                { category: 'Backend / APIs', percentage: 28, color: '#3B82F6' },
                { category: 'Cloud & DevOps', percentage: 22, color: '#8B5CF6' },
                { category: 'Data & Analytics', percentage: 17, color: '#06B6D4' },
                { category: 'System Design', percentage: 16, color: '#F59E0B' },
                { category: 'Tools & Others', percentage: 17, color: '#10B981' }
            ],
            learning_progress: [
                { skill: 'Python', percentage: 70, color: '#10B981' },
                { skill: 'SQL', percentage: 60, color: '#3B82F6' },
                { skill: 'System Design', percentage: 40, color: '#8B5CF6' },
                { skill: 'AWS', percentage: 30, color: '#F59E0B' }
            ]
        });
    } catch (err) {
        console.error('Error fetching preparation summary:', err);
        res.status(500).json({ error: 'Server error fetching preparation data' });
    }
});

// Interactive Skill-to-Company Network Graph Data
router.get('/skill-network-graph', authenticateToken, (req, res) => {
    const selectedSkill = req.query.skill || 'Docker';

    const graphData = {
        'Docker': {
            skill: 'Docker',
            total_opportunities: 6,
            companies: [
                { id: 'c1', name: 'Google', role: 'SWE Intern', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', location: 'Bengaluru' },
                { id: 'c2', name: 'Microsoft', role: 'SDE', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', location: 'Hyderabad' },
                { id: 'c3', name: 'Amazon', role: 'Backend Engineer', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', location: 'Bengaluru' },
                { id: 'c4', name: 'Infosys', role: 'Systems Engineer', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg', location: 'Pune' },
                { id: 'c5', name: 'TCS', role: 'Digital (Backend)', logo: '/tcs-logo.webp', location: 'Chennai' },
                { id: 'c6', name: 'Deloitte', role: 'Technology Analyst', logo: '/deloitte-logo.png', location: 'Hyderabad' }
            ]
        },
        'AWS': {
            skill: 'AWS',
            total_opportunities: 4,
            companies: [
                { id: 'c3', name: 'Amazon', role: 'Data Analyst', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', location: 'Bengaluru' },
                { id: 'c6', name: 'Deloitte', role: 'Cloud Consultant', logo: '/deloitte-logo.png', location: 'Hyderabad' },
                { id: 'c5', name: 'TCS', role: 'Cloud Engineer', logo: '/tcs-logo.webp', location: 'Chennai' },
                { id: 'c2', name: 'Microsoft', role: 'Cloud SDE', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', location: 'Hyderabad' }
            ]
        },
        'System Design': {
            skill: 'System Design',
            total_opportunities: 3,
            companies: [
                { id: 'c1', name: 'Google', role: 'Software Engineer', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', location: 'Bengaluru' },
                { id: 'c7', name: 'Adobe', role: 'Software Engineer', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.png', location: 'Bengaluru' },
                { id: 'c8', name: 'Uber', role: 'Systems Engineer', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png', location: 'Hyderabad' }
            ]
        }
    };

    res.json(graphData[selectedSkill] || graphData['Docker']);
});

export default router;
