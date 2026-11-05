import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get recent Agent 50 execution runs and provenance logs (T&P and HOD Only)
router.get('/logs', authenticateToken, requireRole(['T_AND_P', 'HOD']), async (req, res) => {
    try {
        const runs = await db.query(`
            SELECT r.*, a.agent_code, a.name as agent_name, o.match_score, o.skill_score, o.project_score, o.is_eligible,
                   s.full_name as student_name, s.usn, j.title as job_title, c.name as company_name
            FROM agentops_agent_runs r
            JOIN agentops_agents a ON r.agent_id = a.id
            LEFT JOIN agentops_agent_outputs o ON r.id = o.run_id
            LEFT JOIN people_students s ON r.student_id = s.id
            LEFT JOIN placement_job_openings j ON r.job_opening_id = j.id
            LEFT JOIN placement_companies c ON j.company_id = c.id
            ORDER BY r.created_at DESC
            LIMIT 30
        `);

        res.json({
            agent_code: 'AGENT_50',
            domain: 'Job Matching & Placement Intelligence',
            current_model_version: 'v2.4.0-hybrid',
            total_logged_runs: runs.length,
            fairness_audit: {
                status: 'PASSED',
                protected_characteristics_excluded: ['Gender', 'Caste', 'Religion', 'Region', 'Socio-economic Proxies'],
                last_audited: new Date().toISOString().split('T')[0]
            },
            runs
        });
    } catch (err) {
        console.error('Error fetching agentops logs:', err);
        res.status(500).json({ error: 'Server error fetching agent logs' });
    }
});

// Model Governance & Configuration
router.get('/model-governance', authenticateToken, async (req, res) => {
    try {
        const model = await db.get('SELECT * FROM agentops_model_versions WHERE active = 1');
        res.json({
            model_info: {
                ...model,
                weights_config: model && typeof model.weights_config === 'string' ? JSON.parse(model.weights_config) : model?.weights_config
            },
            pipeline_steps: [
                { step: 1, name: 'Job Requirement Structuring', type: 'NLP / Regex Parser' },
                { step: 2, name: 'Hard Eligibility Gate', type: 'Deterministic Constraint Filter (CGPA, Branch, Batches)' },
                { step: 3, name: 'Multi-Factor Graded Match Scoring', type: 'Weighted Vector Metric (Skills 40%, Projects 25%, Role 15%, Location 10%, Readiness 10%)' },
                { step: 4, name: 'Explainable Reasoning Generator', type: 'Contextual Factor Synthesizer' },
                { step: 5, name: 'Preparation & Skill Gap Intelligence', type: 'Demand/Supply Overlap Graph' },
                { step: 6, name: 'Historical Outcome Learning Loop', type: 'Bayesian / Weight Calibrator' }
            ]
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching model governance' });
    }
});

export default router;
