import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SCHEMA_SQL } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDatabasePath() {
    if (process.env.DB_PATH) {
        return path.resolve(process.env.DB_PATH);
    }
    const defaultDataDir = path.join(__dirname, '..', 'data');
    return path.join(defaultDataDir, 'jobmatch.db');
}

export class SQLiteDatabase {
    constructor() {
        this.SQL = null;
        this.db = null;
        this.initialized = false;
        this.dbPath = getDatabasePath();
        this.persistTimeout = null;
        this.isDirty = false;
    }

    async init() {
        if (this.initialized && this.db) {
            return Promise.resolve();
        }

        try {
            this.dbPath = getDatabasePath();
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.SQL = await initSqlJs();
            
            if (fs.existsSync(this.dbPath) && fs.statSync(this.dbPath).size > 0) {
                try {
                    const fileBuffer = fs.readFileSync(this.dbPath);
                    this.db = new this.SQL.Database(fileBuffer);
                    console.log('Connected to existing SQLite database at', this.dbPath);
                } catch (readErr) {
                    if (process.env.NODE_ENV === 'production') {
                        console.error('FATAL: Failed to read existing production database at', this.dbPath, readErr);
                        throw new Error(`Production database at ${this.dbPath} failed to load: ${readErr.message}`);
                    }
                    console.warn('Warning: Could not read existing DB file in dev mode, creating fresh DB:', readErr.message);
                    this.db = new this.SQL.Database();
                }
            } else {
                this.db = new this.SQL.Database();
                console.log('Created fresh SQLite database, syncing to', this.dbPath);
            }

            this.db.run('PRAGMA foreign_keys = ON');
            this.db.run(SCHEMA_SQL);
            this.flush();
            this.initialized = true;
            console.log('Database schema verified & indexed.');
            return Promise.resolve();
        } catch (err) {
            console.error('Database initialization error:', err);
            return Promise.reject(err);
        }
    }

    /**
     * Debounced persist to disk: batches multiple write operations and avoids
     * full database exports on every single mutation.
     */
    schedulePersist() {
        this.isDirty = true;
        if (this.persistTimeout) return;
        this.persistTimeout = setTimeout(() => {
            this.persistTimeout = null;
            this.flush();
        }, 300);
    }

    /**
     * Immediately write in-memory SQLite state to disk
     */
    flush() {
        try {
            if (this.db) {
                const data = this.db.export();
                const buffer = Buffer.from(data);
                fs.writeFileSync(this.dbPath, buffer);
                this.isDirty = false;
            }
        } catch (err) {
            console.error('Error persisting database to disk:', err);
        }
    }

    async query(sql, params = []) {
        await this.ensureReady();
        try {
            const cleanParams = Array.isArray(params) ? params.map(v => v === undefined ? null : v) : params;
            const stmt = this.db.prepare(sql);
            if (cleanParams && cleanParams.length > 0) {
                stmt.bind(cleanParams);
            }
            const rows = [];
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();
            return Promise.resolve(rows);
        } catch (err) {
            console.error('Query Error:', sql, err);
            return Promise.reject(err);
        }
    }

    async get(sql, params = []) {
        await this.ensureReady();
        try {
            const cleanParams = Array.isArray(params) ? params.map(v => v === undefined ? null : v) : params;
            const stmt = this.db.prepare(sql);
            if (cleanParams && cleanParams.length > 0) {
                stmt.bind(cleanParams);
            }
            let row = null;
            if (stmt.step()) {
                row = stmt.getAsObject();
            }
            stmt.free();
            return Promise.resolve(row);
        } catch (err) {
            console.error('Get Error:', sql, err);
            return Promise.reject(err);
        }
    }

    async run(sql, params = []) {
        await this.ensureReady();
        try {
            const cleanParams = Array.isArray(params) ? params.map(v => v === undefined ? null : v) : params;
            if (!cleanParams || cleanParams.length === 0) {
                this.db.run(sql);
            } else {
                this.db.run(sql, cleanParams);
            }
            this.schedulePersist();

            let lastID = null;
            let changes = 0;
            try {
                const res = this.db.exec("SELECT last_insert_rowid() as id, changes() as changes");
                if (res && res.length > 0 && res[0].values && res[0].values.length > 0) {
                    lastID = res[0].values[0][0];
                    changes = res[0].values[0][1];
                }
            } catch (e) {
                // Ignore metadata fetch errors for complex DDL scripts
            }

            return Promise.resolve({ id: lastID, changes });
        } catch (err) {
            console.error('Run Error:', sql, err);
            return Promise.reject(err);
        }
    }

    prepare(sql) {
        const self = this;
        const sanitize = (args) => {
            const raw = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
            return raw.map(v => v === undefined ? null : v);
        };
        return {
            get: (...args) => {
                const cleanParams = sanitize(args);
                const stmt = self.db.prepare(sql);
                if (cleanParams.length > 0) stmt.bind(cleanParams);
                let row = null;
                if (stmt.step()) row = stmt.getAsObject();
                stmt.free();
                return row;
            },
            all: (...args) => {
                const cleanParams = sanitize(args);
                const stmt = self.db.prepare(sql);
                if (cleanParams.length > 0) stmt.bind(cleanParams);
                const rows = [];
                while (stmt.step()) rows.push(stmt.getAsObject());
                stmt.free();
                return rows;
            },
            run: (...args) => {
                const cleanParams = sanitize(args);
                if (cleanParams.length === 0) {
                    self.db.run(sql);
                } else {
                    self.db.run(sql, cleanParams);
                }
                self.schedulePersist();
                let lastID = null;
                let changes = 0;
                try {
                    const res = self.db.exec("SELECT last_insert_rowid() as id, changes() as changes");
                    if (res && res.length > 0 && res[0].values && res[0].values.length > 0) {
                        lastID = res[0].values[0][0];
                        changes = res[0].values[0][1];
                    }
                } catch (e) {}
                return { lastInsertRowid: lastID, changes };
            }
        };
    }

    async ensureReady() {
        if (!this.initialized || !this.db) {
            await this.init();
        }
    }

    async close() {
        try {
            if (this.persistTimeout) {
                clearTimeout(this.persistTimeout);
                this.persistTimeout = null;
            }
            if (this.db) {
                this.flush();
                this.db.close();
                this.db = null;
            }
            this.initialized = false;
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

export const db = new SQLiteDatabase();
