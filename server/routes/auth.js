import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { JWT_SECRET, authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter state for login endpoint (in-memory sliding window)
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_ATTEMPTS = 10; // max 10 attempts per minute per key

function isRateLimited(key) {
    const now = Date.now();
    const entry = loginAttempts.get(key);
    if (!entry) {
        loginAttempts.set(key, { count: 1, firstAttempt: now });
        return false;
    }
    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
        loginAttempts.set(key, { count: 1, firstAttempt: now });
        return false;
    }
    entry.count++;
    return entry.count > MAX_ATTEMPTS;
}

// Periodic cleanup of rate limiter entries
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of loginAttempts.entries()) {
        if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS * 2) {
            loginAttempts.delete(key);
        }
    }
}, 5 * 60 * 1000).unref();

// Helper to generate JWT token with expiration and validated role
function generateToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role_name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * POST /api/auth/login
 * Strict Authentication:
 * - Rate limited per IP/identifier
 * - Exclusively verifies submitted password against stored bcrypt hash
 * - Generic error responses preventing user enumeration
 * - Role tab enforcement prevents privilege elevation
 */
router.post('/login', async (req, res) => {
    try {
        const { identifier, password, role, role_override } = req.body;
        const requestedRole = role || role_override;

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const rateLimitKey = `${clientIp}:${(identifier || '').trim().toLowerCase()}`;

        if (isRateLimited(rateLimitKey)) {
            return res.status(429).json({ 
                error: 'Too many login attempts. Please wait a moment before trying again.' 
            });
        }

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Identifier (USN / ID / Email) and Password are required.' });
        }

        const trimmedId = identifier.trim();

        // 1. Search user by Email, Identifier Code (USN / Emp ID / Faculty ID)
        let user = await db.get(
            `SELECT u.id, u.identifier_code, u.email, u.password_hash, u.full_name, u.role_id, u.avatar_url, r.name as role_name 
             FROM identity_users u 
             JOIN identity_roles r ON u.role_id = r.id 
             WHERE LOWER(u.email) = LOWER(?) OR LOWER(u.identifier_code) = LOWER(?)`,
            [trimmedId, trimmedId]
        );

        // If not found directly, check people_students table USN
        if (!user) {
            const student = await db.get('SELECT user_id FROM people_students WHERE LOWER(usn) = LOWER(?)', [trimmedId]);
            if (student) {
                user = await db.get(
                    `SELECT u.id, u.identifier_code, u.email, u.password_hash, u.full_name, u.role_id, u.avatar_url, r.name as role_name 
                     FROM identity_users u 
                     JOIN identity_roles r ON u.role_id = r.id 
                     WHERE u.id = ?`,
                    [student.user_id]
                );
            }
        }

        // Return generic error if user does not exist (prevents user enumeration)
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid identifier or password. Please verify your credentials and try again.' 
            });
        }

        // 2. Validate password exclusively via bcrypt compare against stored password_hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ 
                error: 'Invalid identifier or password. Please verify your credentials and try again.' 
            });
        }

        // 3. Validate role tab match if role is provided
        if (requestedRole && user.role_name !== requestedRole) {
            const roleLabels = {
                'STUDENT': 'Student Portal',
                'T_AND_P': 'Training & Placement Portal',
                'HOD': 'Head of Department Portal'
            };
            return res.status(403).json({
                error: `This account is authorized for ${roleLabels[user.role_name] || user.role_name}. Please switch to the correct portal tab to log in.`
            });
        }

        // 4. Generate token with role derived STRICTLY from database record
        const token = generateToken(user);
        let studentProfile = null;
        if (user.role_name === 'STUDENT') {
            studentProfile = await db.get('SELECT * FROM people_students WHERE user_id = ?', [user.id]);
        }

        // Successful login: reset rate limit for this key
        loginAttempts.delete(rateLimitKey);

        // Passwords and hashes are strictly excluded from response
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                identifier_code: user.identifier_code,
                email: user.email,
                full_name: user.full_name,
                role: user.role_name,
                avatar_url: user.avatar_url,
                student: studentProfile
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during authentication' });
    }
});

// Current User Me Endpoint
router.get('/me', authenticateToken, async (req, res) => {
    try {
        let studentProfile = null;
        if (req.user.role_name === 'STUDENT') {
            studentProfile = await db.get('SELECT * FROM people_students WHERE user_id = ?', [req.user.id]);
        }

        const userRecord = await db.get(
            `SELECT u.id, u.identifier_code, u.email, u.full_name, r.name as role_name, u.avatar_url
             FROM identity_users u
             JOIN identity_roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [req.user.id]
        );

        res.json({
            user: {
                id: userRecord?.id || req.user.id,
                identifier_code: userRecord?.identifier_code,
                email: userRecord?.email || req.user.email,
                full_name: userRecord?.full_name || req.user.full_name,
                role: userRecord?.role_name || req.user.role_name,
                avatar_url: userRecord?.avatar_url || req.user.avatar_url,
                student: studentProfile
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user session' });
    }
});

// Authorized Predefined Accounts Directory (Admin / T&P Only)
// Never exposes password hashes, tokens, or private phone/personal details
router.get('/predefined-accounts', authenticateToken, requireRole(['T_AND_P']), async (req, res) => {
    try {
        const users = await db.query(`
            SELECT u.id, u.identifier_code, u.full_name, r.name as role
            FROM identity_users u
            JOIN identity_roles r ON u.role_id = r.id
            ORDER BY r.name, u.full_name
        `);
        res.json({ predefined_accounts: users });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching accounts' });
    }
});

export default router;
