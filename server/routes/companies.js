import express from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/database.js';
import { authenticateToken, requireRole, denyHODMutation } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../uploads/company-logos');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const router = express.Router();

const ALLOWED_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
]);

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Helper: validate base64 / mime and write to disk
function saveLogoFile(base64Data, originalName = 'logo.png') {
    if (!base64Data || typeof base64Data !== 'string') {
        throw new Error('No image data provided');
    }

    let mimeType = '';
    let rawBase64 = base64Data;

    if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (!matches || matches.length < 3) {
            throw new Error('Invalid image data format');
        }
        mimeType = matches[1].toLowerCase();
        rawBase64 = matches[2];
    }

    if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new Error(`Unsupported image format (${mimeType}). Allowed formats: PNG, JPG, JPEG, WEBP`);
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File size exceeds 5MB limit (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
    }

    // Determine extension
    let ext = path.extname(originalName || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        ext = mimeType === 'image/png' ? '.png' :
              mimeType === 'image/webp' ? '.webp' : '.jpg';
    }

    // Generate unique sanitized filename
    const uniqueFilename = `logo_${crypto.randomBytes(8).toString('hex')}_${Date.now()}${ext}`;
    const targetPath = path.join(UPLOADS_DIR, uniqueFilename);

    fs.writeFileSync(targetPath, buffer);

    return `/uploads/company-logos/${uniqueFilename}`;
}

// 1. Upload Logo Endpoint (T&P Only, HOD blocked)
router.post('/upload-logo', authenticateToken, requireRole(['T_AND_P']), denyHODMutation, async (req, res) => {
    try {
        const { image_data, data_base64, logo_data, filename } = req.body;
        const payload = image_data || data_base64 || logo_data;
        if (!payload) {
            return res.status(400).json({ error: 'Image data is required (image_data or data_base64)' });
        }

        const logoUrl = saveLogoFile(payload, filename || 'company-logo.png');
        res.status(200).json({
            message: 'Company logo uploaded successfully',
            logo_url: logoUrl
        });
    } catch (err) {
        console.error('Logo upload error:', err.message);
        res.status(400).json({ error: err.message || 'Failed to upload company logo' });
    }
});

// 2. Serve logo directly as fallback route
router.get('/logos/:filename', (req, res) => {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Logo not found' });
    }
    res.sendFile(filePath);
});

// 3. List all companies with opening count
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search, tier, industry } = req.query;

        let sql = `
            SELECT c.*, 
                   COUNT(j.id) as active_openings_count
            FROM placement_companies c
            LEFT JOIN placement_job_openings j ON c.id = j.company_id AND j.status = 'ACTIVE'
            WHERE 1=1
        `;
        const params = [];

        if (tier && tier !== 'All') {
            sql += ` AND c.tier = ?`;
            params.push(tier);
        }

        if (industry && industry !== 'All') {
            sql += ` AND c.industry = ?`;
            params.push(industry);
        }

        if (search && search.trim()) {
            sql += ` AND (c.name LIKE ? OR c.headquarters LIKE ? OR c.description LIKE ?)`;
            params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
        }

        sql += ` GROUP BY c.id ORDER BY c.name ASC`;

        const companies = await db.query(sql, params);
        res.json({ companies });
    } catch (err) {
        console.error('Error fetching companies:', err);
        res.status(500).json({ error: 'Server error fetching companies' });
    }
});

// 4. Get single company details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const company = await db.get('SELECT * FROM placement_companies WHERE id = ?', [req.params.id]);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const openings = await db.query(
            'SELECT * FROM placement_job_openings WHERE company_id = ? ORDER BY created_at DESC',
            [company.id]
        );

        res.json({ company, openings });
    } catch (err) {
        console.error('Error fetching company details:', err);
        res.status(500).json({ error: 'Error fetching company details' });
    }
});

// 5. Register / Add New Company (T&P Only, HOD blocked)
router.post('/', authenticateToken, requireRole(['T_AND_P']), denyHODMutation, async (req, res) => {
    try {
        const {
            name,
            tier = 'Tier 1',
            industry = 'Technology',
            headquarters = 'Bengaluru, India',
            website = '',
            description = '',
            logo_url = null,
            image_data = null,
            image_filename = null
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        // Check for duplicate company
        const existing = await db.get(
            'SELECT id, name FROM placement_companies WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
            [name.trim()]
        );
        if (existing) {
            return res.status(409).json({
                error: `A company named "${existing.name}" is already registered. Please edit the existing company instead.`,
                existing_company_id: existing.id
            });
        }

        // Handle inline logo upload if provided
        let resolvedLogoUrl = logo_url ? String(logo_url).trim() : null;
        if (image_data) {
            resolvedLogoUrl = saveLogoFile(image_data, image_filename || `${name.trim().toLowerCase()}-logo.png`);
        }

        const companyId = 'comp_' + crypto.randomBytes(6).toString('hex');

        await db.run(
            `INSERT INTO placement_companies 
            (id, name, tier, industry, headquarters, website, description, logo_url, is_partner)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                companyId,
                name.trim(),
                tier || 'Tier 1',
                industry || 'Technology',
                headquarters || 'Bengaluru, India',
                website ? website.trim() : null,
                description ? description.trim() : `Partner company registered with RVCE Placement Cell.`,
                resolvedLogoUrl
            ]
        );

        const created = await db.get('SELECT * FROM placement_companies WHERE id = ?', [companyId]);

        res.status(201).json({
            message: 'Company registered successfully!',
            company: created
        });
    } catch (err) {
        console.error('Error registering company:', err);
        res.status(500).json({ error: err.message || 'Failed to register company' });
    }
});

// 6. Edit Existing Company (T&P Only, HOD blocked)
router.put('/:id', authenticateToken, requireRole(['T_AND_P']), denyHODMutation, async (req, res) => {
    try {
        const companyId = req.params.id;
        const existing = await db.get('SELECT * FROM placement_companies WHERE id = ?', [companyId]);
        if (!existing) {
            return res.status(404).json({ error: 'Company record not found' });
        }

        const {
            name,
            tier,
            industry,
            headquarters,
            website,
            description,
            logo_url,
            image_data,
            image_filename,
            remove_logo
        } = req.body;

        if (name && !name.trim()) {
            return res.status(400).json({ error: 'Company name cannot be empty' });
        }

        // If renaming, ensure not colliding with another company
        if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
            const collision = await db.get(
                'SELECT id FROM placement_companies WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?',
                [name.trim(), companyId]
            );
            if (collision) {
                return res.status(409).json({ error: `Another company named "${name.trim()}" already exists` });
            }
        }

        let updatedLogoUrl = existing.logo_url;

        if (remove_logo === true) {
            // Remove logo
            updatedLogoUrl = null;
        } else if (image_data) {
            // New uploaded image
            updatedLogoUrl = saveLogoFile(image_data, image_filename || `${(name || existing.name).trim()}-logo.png`);
        } else if (logo_url !== undefined) {
            updatedLogoUrl = logo_url ? String(logo_url).trim() : null;
        }

        await db.run(
            `UPDATE placement_companies 
             SET name = COALESCE(?, name),
                 tier = COALESCE(?, tier),
                 industry = COALESCE(?, industry),
                 headquarters = COALESCE(?, headquarters),
                 website = ?,
                 description = COALESCE(?, description),
                 logo_url = ?
             WHERE id = ?`,
            [
                name ? name.trim() : null,
                tier || null,
                industry || null,
                headquarters || null,
                website !== undefined ? (website ? website.trim() : null) : existing.website,
                description !== undefined ? (description ? description.trim() : null) : existing.description,
                updatedLogoUrl,
                companyId
            ]
        );

        const updated = await db.get('SELECT * FROM placement_companies WHERE id = ?', [companyId]);

        res.json({
            message: 'Company updated successfully!',
            company: updated
        });
    } catch (err) {
        console.error('Error updating company:', err);
        res.status(500).json({ error: err.message || 'Failed to update company' });
    }
});

export default router;
