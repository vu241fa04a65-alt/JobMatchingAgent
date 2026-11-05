import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

function resolveJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production') {
        if (!secret || secret.trim().length < 32 || secret.includes('super_secret_jwt_key_2026')) {
            console.error('FATAL SECURITY ERROR: A strong JWT_SECRET (at least 32 characters) is required in production environment.');
            process.exit(1);
        }
        return secret;
    }
    return secret || 'dev_fallback_secret_jobmatchingagent_minimum_32_chars_2026';
}

export const JWT_SECRET = resolveJwtSecret();

/**
 * Authenticate incoming JWT Bearer token and attach verified user to req.user
 */
export async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.get(
            `SELECT u.id, u.identifier_code, u.email, u.full_name, u.role_id, u.avatar_url, r.name as role_name 
             FROM identity_users u 
             JOIN identity_roles r ON u.role_id = r.id 
             WHERE u.id = ?`,
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({ error: 'User session invalid or account not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }
        return res.status(403).json({ error: 'Invalid authentication token' });
    }
}

/**
 * Role-Based Access Control Middleware
 */
export function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const role = req.user.role_name;
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ 
                error: `Access denied. Role '${role}' is not authorized to access this resource.`,
                requiredRoles: allowedRoles
            });
        }
        next();
    };
}

/**
 * Enforces HOD read-only rule.
 * If user is HOD and performs any mutation (POST, PUT, DELETE, PATCH), rejects with HTTP 403.
 */
export function denyHODMutation(req, res, next) {
    if (req.user && req.user.role_name === 'HOD') {
        return res.status(403).json({
            error: 'HOD Role is strictly READ-ONLY. Institutional administrative mutations (creating/editing jobs, students, shortlisting, communications) are reserved for Training & Placement (T&P) Cell.'
        });
    }
    next();
}

/**
 * Helper to get the people_students record for an authenticated user
 */
export async function getStudentForUser(userId) {
    if (!userId) return null;
    return await db.get('SELECT * FROM people_students WHERE user_id = ?', [userId]);
}
