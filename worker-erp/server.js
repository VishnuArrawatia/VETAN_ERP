import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// ============ DATABASE SETUP ============
const DB_FILE = path.join(__dirname, 'worker_erp.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table (authentication + authorization)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'reviewer',
    -- role: 'super_admin' | 'hr' | 'reviewer'
    units TEXT DEFAULT '[]',
    -- JSON array of allowed units: ["SVN-I","SVN-II"] or ["*"] for all
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Sessions table
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Workers table
  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT,
    gender TEXT DEFAULT 'M',
    dob TEXT,
    doj TEXT,
    dol TEXT,
    unit TEXT,
    type TEXT,
    source TEXT,
    department TEXT,
    designation TEXT,
    working_hours INTEGER DEFAULT 8,
    pf_flag TEXT DEFAULT 'NO',
    esic_flag TEXT DEFAULT 'NO',
    uan TEXT,
    aadhaar TEXT,
    basic_wage REAL DEFAULT 0,
    hra REAL DEFAULT 0,
    other_allowance REAL DEFAULT 0,
    total_wage REAL DEFAULT 0,
    ctc REAL DEFAULT 0,
    min_wage REAL DEFAULT 0,
    transport TEXT,
    transport_by TEXT,
    location_source TEXT,
    vehicle_group TEXT,
    pay_group TEXT,
    active_status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Attendance table
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    present INTEGER DEFAULT 0,
    absent INTEGER DEFAULT 0,
    weekly_off INTEGER DEFAULT 0,
    paid_holiday INTEGER DEFAULT 0,
    leave INTEGER DEFAULT 0,
    lwp INTEGER DEFAULT 0,
    ot_hours REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_code, month, year),
    FOREIGN KEY (worker_code) REFERENCES workers(worker_code)
  );

  -- Contractors table
  CREATE TABLE IF NOT EXISTS contractors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    gst_number TEXT,
    pan_number TEXT,
    pf_percentage REAL DEFAULT 12,
    esic_percentage REAL DEFAULT 0.75,
    tds_percentage REAL DEFAULT 2,
    gst_percentage REAL DEFAULT 18,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Units table (dynamic units management)
  CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Import history
  CREATE TABLE IF NOT EXISTS import_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    import_date TEXT DEFAULT CURRENT_TIMESTAMP,
    total_records INTEGER,
    new_records INTEGER,
    updated_records INTEGER,
    duplicate_records INTEGER,
    error_records INTEGER,
    status TEXT
  );

  -- Audit log
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT,
    details TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_workers_unit ON workers(unit);
  CREATE INDEX IF NOT EXISTS idx_workers_source ON workers(source);
  CREATE INDEX IF NOT EXISTS idx_workers_department ON workers(department);
  CREATE INDEX IF NOT EXISTS idx_workers_active ON workers(active_status);
  CREATE INDEX IF NOT EXISTS idx_workers_code ON workers(worker_code);
  CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance(worker_code);
  CREATE INDEX IF NOT EXISTS idx_attendance_month ON attendance(month, year);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

  -- Leave Balance
  CREATE TABLE IF NOT EXISTS leave_balance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT NOT NULL,
    year INTEGER NOT NULL,
    total_allocated INTEGER DEFAULT 0,
    total_taken INTEGER DEFAULT 0,
    total_lwp INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_code, year)
  );

  -- Leave Transactions
  CREATE TABLE IF NOT EXISTS leave_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT NOT NULL,
    year INTEGER NOT NULL,
    leave_type TEXT NOT NULL DEFAULT 'casual',
    from_date TEXT NOT NULL,
    to_date TEXT NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    applied_by INTEGER,
    approved_by INTEGER,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
    approved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_code) REFERENCES workers(worker_code)
  );

  -- Wage History
  CREATE TABLE IF NOT EXISTS wage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT NOT NULL,
    effective_from TEXT NOT NULL,
    effective_to TEXT,
    old_wage REAL DEFAULT 0,
    new_wage REAL DEFAULT 0,
    basic_wage REAL DEFAULT 0,
    hra REAL DEFAULT 0,
    other_allowance REAL DEFAULT 0,
    ctc REAL DEFAULT 0,
    change_type TEXT NOT NULL DEFAULT 'revision',
    reason TEXT,
    changed_by INTEGER,
    changed_by_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_code) REFERENCES workers(worker_code)
  );

  -- Increments
  CREATE TABLE IF NOT EXISTS increments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT NOT NULL,
    increment_type TEXT NOT NULL,
    effective_from TEXT NOT NULL,
    old_wage REAL DEFAULT 0,
    new_wage REAL DEFAULT 0,
    increment_amount REAL DEFAULT 0,
    increment_percentage REAL DEFAULT 0,
    reason TEXT,
    approved_by INTEGER,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_code) REFERENCES workers(worker_code)
  );

  -- Indexes for new tables
  CREATE INDEX IF NOT EXISTS idx_leave_balance_worker ON leave_balance(worker_code);
  CREATE INDEX IF NOT EXISTS idx_leave_transactions_worker ON leave_transactions(worker_code);
  CREATE INDEX IF NOT EXISTS idx_wage_history_worker ON wage_history(worker_code);
  CREATE INDEX IF NOT EXISTS idx_wage_history_effective ON wage_history(effective_from);
  CREATE INDEX IF NOT EXISTS idx_increments_worker ON increments(worker_code);
  CREATE INDEX IF NOT EXISTS idx_increments_type ON increments(increment_type);

  -- Loan/Recovery table
  CREATE TABLE IF NOT EXISTS loan_recovery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    loan_amount REAL DEFAULT 0,
    loan_deduction REAL DEFAULT 0,
    advance_amount REAL DEFAULT 0,
    advance_deduction REAL DEFAULT 0,
    other_deductions REAL DEFAULT 0,
    outstanding_balance REAL DEFAULT 0,
    remarks TEXT,
    created_by INTEGER,
    created_by_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_code, month, year)
  );

  CREATE INDEX IF NOT EXISTS idx_loan_recovery_worker ON loan_recovery(worker_code);
  CREATE INDEX IF NOT EXISTS idx_loan_recovery_month ON loan_recovery(month, year);
`);

// Add exit columns if not present
try { db.exec(`ALTER TABLE workers ADD COLUMN exit_date TEXT`); } catch (e) {}
try { db.exec(`ALTER TABLE workers ADD COLUMN exit_reason TEXT`); } catch (e) {}

// ============ SEED DEFAULT DATA ============

// Default super admin (password: admin123)
const defaultAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!defaultAdmin) {
  const hash = crypto.createHash('sha256').update('admin123').digest('hex');
  db.prepare(`INSERT INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)`).run(
    'admin', hash, 'Super Admin', 'super_admin', '["*"]'
  );
  console.log('✅ Default admin created: admin / admin123');
}

// Default units
const defaultUnits = ['SVN-I', 'SVN-II', 'Sakar-I', 'Sakar-III'];
for (const unit of defaultUnits) {
  db.prepare('INSERT OR IGNORE INTO units (name, display_name) VALUES (?, ?)').run(unit, unit);
}

// ============ HELPER FUNCTIONS ============

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function logAudit(userId, username, action, details) {
  db.prepare('INSERT INTO audit_log (user_id, username, action, details) VALUES (?, ?, ?, ?)').run(
    userId, username, action, details
  );
}

// ============ AUTH MIDDLEWARE ============

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const session = db.prepare(`
    SELECT s.*, u.id as uid, u.username, u.display_name, u.role, u.units
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
  `).get(token);

  if (!session) return res.status(401).json({ error: 'Session expired' });

  req.user = {
    id: session.uid,
    username: session.username,
    displayName: session.display_name,
    role: session.role,
    units: JSON.parse(session.units || '[]')
  };
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Unit access check — super_admin sees everything, others see only assigned units
function filterByUnits(userUnits, queryUnit) {
  if (userUnits.includes('*')) return true; // super_admin
  if (!queryUnit) return true; // no filter = show all accessible
  return userUnits.includes(queryUnit);
}

function getUnitFilterSQL(userUnits, alias = 'w') {
  if (userUnits.includes('*')) return { where: '', params: [] };
  if (userUnits.length === 0) return { where: ' AND 1=0', params: [] }; // no access
  const placeholders = userUnits.map(() => '?').join(',');
  return {
    where: ` AND ${alias}.unit IN (${placeholders})`,
    params: userUnits
  };
}

// ============ AUTH API ============

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const hash = hashPassword(password);
    if (hash !== user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

    // Create session (24 hours)
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt);

    logAudit(user.id, user.username, 'LOGIN', `Logged in from ${req.ip}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        units: JSON.parse(user.units || '[]')
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', authenticate, (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    logAudit(req.user.id, req.user.username, 'LOGOUT', '');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/change-password', authenticate, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (hashPassword(currentPassword) !== user.password_hash) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      hashPassword(newPassword), req.user.id
    );
    logAudit(req.user.id, req.user.username, 'PASSWORD_CHANGE', '');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ============ USER MANAGEMENT (Super Admin only) ============

app.get('/api/users', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, display_name, role, units, is_active, created_at FROM users ORDER BY username').all();
    res.json(users.map(u => ({ ...u, units: JSON.parse(u.units || '[]') })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const { username, password, displayName, role, units } = req.body;

    if (!username || !password || !displayName || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const result = db.prepare(
      'INSERT INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hashPassword(password), displayName, role, JSON.stringify(units || []));

    logAudit(req.user.id, req.user.username, 'CREATE_USER', `Created user: ${username} (${role})`);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const { displayName, role, units, isActive, password } = req.body;
    const userId = req.params.id;

    let sql = 'UPDATE users SET display_name = ?, role = ?, units = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [displayName, role, JSON.stringify(units || []), isActive ? 1 : 0];

    if (password) {
      sql += ', password_hash = ?';
      params.push(hashPassword(password));
    }

    sql += ' WHERE id = ?';
    params.push(userId);

    db.prepare(sql).run(...params);
    logAudit(req.user.id, req.user.username, 'UPDATE_USER', `Updated user ID: ${userId}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    db.prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    logAudit(req.user.id, req.user.username, 'DELETE_USER', `Deactivated user ID: ${userId}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============ UNITS API ============

app.get('/api/units', authenticate, (req, res) => {
  try {
    const units = db.prepare('SELECT * FROM units WHERE is_active = 1 ORDER BY name').all();
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

app.post('/api/units', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const { name, displayName } = req.body;
    if (!name) return res.status(400).json({ error: 'Unit name required' });

    const existing = db.prepare('SELECT id FROM units WHERE name = ?').get(name);
    if (existing) return res.status(400).json({ error: 'Unit already exists' });

    db.prepare('INSERT INTO units (name, display_name) VALUES (?, ?)').run(name, displayName || name);
    logAudit(req.user.id, req.user.username, 'CREATE_UNIT', `Created unit: ${name}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

app.delete('/api/units/:id', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    db.prepare('UPDATE units SET is_active = 0 WHERE id = ?').run(req.params.id);
    logAudit(req.user.id, req.user.username, 'DELETE_UNIT', `Deactivated unit ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

// ============ WORKER API (with unit filtering) ============

app.get('/api/workers', authenticate, (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', unit = '', type = '', department = '', source = '', status = '' } = req.query;
    const unitFilter = getUnitFilterSQL(req.user.units, 'w');

    let whereClause = 'WHERE 1=1' + unitFilter.where;
    const params = [...unitFilter.params];

    if (search) {
      whereClause += ' AND (w.worker_code LIKE ? OR w.name LIKE ? OR w.father_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (unit && req.user.units.includes('*')) {
      whereClause += ' AND w.unit = ?';
      params.push(unit);
    }
    if (type) { whereClause += ' AND w.type = ?'; params.push(type); }
    if (department) { whereClause += ' AND w.department = ?'; params.push(department); }
    if (source) { whereClause += ' AND w.source = ?'; params.push(source); }
    if (status === 'active') whereClause += ' AND w.active_status = 1';
    else if (status === 'inactive') whereClause += ' AND w.active_status = 0';

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM workers w ${whereClause}`).get(...params);
    const total = countResult.total;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const workers = db.prepare(`SELECT w.* FROM workers w ${whereClause} ORDER BY w.worker_code ASC LIMIT ? OFFSET ?`)
      .all(...params, parseInt(limit), offset);

    res.json({
      workers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

app.get('/api/workers/:code', authenticate, (req, res) => {
  try {
    const worker = db.prepare('SELECT * FROM workers WHERE worker_code = ?').get(req.params.code);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

app.post('/api/workers', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { worker_code } = req.body;
    // Check unit access
    if (!req.user.units.includes('*') && req.body.unit && !req.user.units.includes(req.body.unit)) {
      return res.status(403).json({ error: 'You do not have access to this unit' });
    }

    const existing = db.prepare('SELECT worker_code FROM workers WHERE worker_code = ?').get(worker_code);
    if (existing) return res.status(400).json({ error: 'Worker code already exists' });

    const stmt = db.prepare(`
      INSERT INTO workers (worker_code, name, father_name, gender, dob, doj, unit, type, source, department, designation, working_hours, pf_flag, esic_flag, uan, aadhaar, basic_wage, hra, other_allowance, total_wage, ctc, min_wage, transport, transport_by, location_source, vehicle_group, pay_group, active_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const r = stmt.run(
      req.body.worker_code, req.body.name, req.body.father_name, req.body.gender,
      req.body.dob, req.body.doj, req.body.unit, req.body.type,
      req.body.source, req.body.department, req.body.designation, req.body.working_hours || 8,
      req.body.pf_flag || 'NO', req.body.esic_flag || 'NO', req.body.uan, req.body.aadhaar,
      req.body.basic_wage || 0, req.body.hra || 0, req.body.other_allowance || 0,
      req.body.total_wage || 0, req.body.ctc || 0, req.body.min_wage || 0,
      req.body.transport, req.body.transport_by, req.body.location_source, req.body.vehicle_group, req.body.pay_group
    );

    logAudit(req.user.id, req.user.username, 'ADD_WORKER', `Added worker: ${worker_code}`);
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (error) {
    console.error('Error adding worker:', error);
    res.status(500).json({ error: 'Failed to add worker' });
  }
});

app.put('/api/workers/:code', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    // Check unit access
    if (!req.user.units.includes('*') && req.body.unit && !req.user.units.includes(req.body.unit)) {
      return res.status(403).json({ error: 'You do not have access to this unit' });
    }

    db.prepare(`
      UPDATE workers SET name=?, father_name=?, gender=?, dob=?, doj=?, dol=?, unit=?, type=?, source=?, department=?, designation=?, working_hours=?, pf_flag=?, esic_flag=?, uan=?, aadhaar=?, basic_wage=?, hra=?, other_allowance=?, total_wage=?, ctc=?, min_wage=?, transport=?, transport_by=?, location_source=?, vehicle_group=?, pay_group=?, active_status=?, updated_at=CURRENT_TIMESTAMP
      WHERE worker_code=?
    `).run(
      req.body.name, req.body.father_name, req.body.gender,
      req.body.dob, req.body.doj, req.body.dol, req.body.unit, req.body.type,
      req.body.source, req.body.department, req.body.designation, req.body.working_hours,
      req.body.pf_flag, req.body.esic_flag, req.body.uan, req.body.aadhaar,
      req.body.basic_wage, req.body.hra, req.body.other_allowance,
      req.body.total_wage, req.body.ctc, req.body.min_wage,
      req.body.transport, req.body.transport_by, req.body.location_source, req.body.vehicle_group, req.body.pay_group,
      req.body.active_status, req.params.code
    );

    logAudit(req.user.id, req.user.username, 'UPDATE_WORKER', `Updated worker: ${req.params.code}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

app.delete('/api/workers/:code', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    db.prepare('UPDATE workers SET active_status = 0, updated_at = CURRENT_TIMESTAMP WHERE worker_code = ?').run(req.params.code);
    logAudit(req.user.id, req.user.username, 'DEACTIVATE_WORKER', `Deactivated: ${req.params.code}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate worker' });
  }
});

app.post('/api/workers/:code/restore', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    db.prepare('UPDATE workers SET active_status = 1, updated_at = CURRENT_TIMESTAMP WHERE worker_code = ?').run(req.params.code);
    logAudit(req.user.id, req.user.username, 'RESTORE_WORKER', `Restored: ${req.params.code}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore worker' });
  }
});

// ============ MERGE IMPORT API ============

app.post('/api/import/preview', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath || !fs.existsSync(filePath)) return res.status(400).json({ error: 'File not found' });

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames.find(s => s.toUpperCase().includes('MASTER') || s.toUpperCase().includes('WORKER'));
    if (!sheetName) return res.status(400).json({ error: 'MASTER_Workers sheet not found in Excel' });

    const sheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(sheet);
    const existingCodes = new Set(db.prepare('SELECT worker_code FROM workers').all().map(w => w.worker_code));

    const preview = { totalRecords: excelData.length, newWorkers: [], duplicateWorkers: [], invalidRecords: [] };

    excelData.forEach((row, index) => {
      const workerCode = row.Worker_Code || row.worker_code || '';
      const name = row.Name || row.name || '';

      if (!workerCode || !name) {
        preview.invalidRecords.push({ row: index + 1, worker_code: workerCode, name, reason: !workerCode ? 'Missing Worker Code' : 'Missing Name' });
        return;
      }
      if (existingCodes.has(workerCode)) {
        preview.duplicateWorkers.push({ row: index + 1, worker_code: workerCode, name, unit: row.Unit || row.unit || '', reason: 'Already exists' });
      } else {
        preview.newWorkers.push({ row: index + 1, worker_code: workerCode, name, unit: row.Unit || row.unit || '', department: row.Department || row.department || '', source: row.Source || row.source || '' });
        existingCodes.add(workerCode);
      }
    });

    res.json({
      success: true, preview,
      summary: {
        existingWorkers: existingCodes.size - preview.newWorkers.length,
        newWorkers: preview.newWorkers.length,
        duplicateWorkers: preview.duplicateWorkers.length,
        invalidRecords: preview.invalidRecords.length,
        finalTotal: (existingCodes.size - preview.newWorkers.length) + preview.newWorkers.length
      }
    });
  } catch (error) {
    console.error('Error previewing import:', error);
    res.status(500).json({ error: 'Failed to preview import: ' + error.message });
  }
});

app.post('/api/import/execute', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { filePath, skipDuplicates = true } = req.body;
    if (!filePath || !fs.existsSync(filePath)) return res.status(400).json({ error: 'File not found' });

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames.find(s => s.toUpperCase().includes('MASTER') || s.toUpperCase().includes('WORKER'));
    if (!sheetName) return res.status(400).json({ error: 'MASTER_Workers sheet not found' });

    const sheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(sheet);
    const stats = { total: excelData.length, new: 0, updated: 0, duplicates: 0, errors: 0 };

    const insertStmt = db.prepare(`INSERT OR IGNORE INTO workers (worker_code, name, father_name, gender, dob, doj, unit, type, source, department, designation, working_hours, pf_flag, esic_flag, uan, aadhaar, basic_wage, hra, other_allowance, total_wage, ctc, min_wage, transport, transport_by, location_source, vehicle_group, pay_group, active_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);

    const importMany = db.transaction((workers) => {
      for (const row of workers) {
        try {
          const workerCode = row.Worker_Code || row.worker_code || '';
          const name = row.Name || row.name || '';
          if (!workerCode || !name) { stats.errors++; continue; }

          const existing = db.prepare('SELECT worker_code FROM workers WHERE worker_code = ?').get(workerCode);
          if (existing) { stats.duplicates++; continue; }

          insertStmt.run(workerCode, name, row.Father_Name || row.father_name || '', row.Gender || row.gender || 'M',
            row.DOB || row.dob || '', row.DOJ || row.doj || '', row.Unit || row.unit || '',
            row.Type || row.type || '', row.Source || row.source || '', row.Department || row.department || '',
            row.Designation || row.designation || '', row.Working_Hour || row.working_hours || 8,
            row.PF_Flag || row.pf_flag || 'NO', row.ESIC_Flag || row.esic_flag || 'NO',
            row.UAN || row.uan || '', row.Aadhaar || row.aadhaar || '',
            row.Basic_Wage || row.basic_wage || 0, row.HRA || row.hra || 0,
            row.Other_Allowance || row.other_allowance || 0, row.Total_Wage || row.total_wage || 0,
            row.CTC || row.ctc || 0, row.Min_Wage || row.min_wage || 0,
            row.Transport || row.transport || '', row.Transport_By || row.transport_by || '',
            row.Location_Source || row.location_source || '', row.Vehicle_Group || row.vehicle_group || '',
            row.Pay_Group || row.pay_group || '');
          stats.new++;
        } catch (err) { stats.errors++; }
      }
    });

    importMany(excelData);
    db.prepare('INSERT INTO import_history (filename, total_records, new_records, duplicate_records, error_records, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      path.basename(filePath), stats.total, stats.new, stats.duplicates, stats.errors, 'completed'
    );
    logAudit(req.user.id, req.user.username, 'IMPORT', `Imported: ${stats.new} new, ${stats.duplicates} dupes from ${path.basename(filePath)}`);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute import: ' + error.message });
  }
});

// ============ ATTENDANCE API ============

app.get('/api/attendance', authenticate, (req, res) => {
  try {
    const { month, year, worker_code, unit } = req.query;
    const unitFilter = getUnitFilterSQL(req.user.units, 'w');

    let query = `SELECT a.*, w.name, w.unit, w.department, w.source FROM attendance a JOIN workers w ON a.worker_code = w.worker_code WHERE 1=1${unitFilter.where}`;
    const params = [...unitFilter.params];

    if (month) { query += ' AND a.month = ?'; params.push(month); }
    if (year) { query += ' AND a.year = ?'; params.push(parseInt(year)); }
    if (worker_code) { query += ' AND a.worker_code = ?'; params.push(worker_code); }
    if (unit && req.user.units.includes('*')) { query += ' AND w.unit = ?'; params.push(unit); }

    query += ' ORDER BY a.worker_code, a.year DESC, a.month DESC';
    const attendance = db.prepare(query).all(...params);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/attendance', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { worker_code, month, year, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours } = req.body;
    db.prepare(`INSERT INTO attendance (worker_code, month, year, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(worker_code, month, year) DO UPDATE SET present=excluded.present, absent=excluded.absent, weekly_off=excluded.weekly_off, paid_holiday=excluded.paid_holiday, leave=excluded.leave, lwp=excluded.lwp, ot_hours=excluded.ot_hours`)
      .run(worker_code, month, year, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// ============ DASHBOARD API (unit-filtered) ============

app.get('/api/dashboard', authenticate, (req, res) => {
  try {
    const uf = getUnitFilterSQL(req.user.units, 'w');
    const prefix = ' WHERE w.active_status = 1' + uf.where;
    const params = uf.params;

    // --- Basic counts ---
    const totalWorkers = db.prepare(`SELECT COUNT(*) as count FROM workers w${prefix}`).get(...params).count;
    const activeWorkers = db.prepare(`SELECT COUNT(*) as count FROM workers w${prefix}`).get(...params).count;
    const inactiveWorkers = db.prepare(`SELECT COUNT(*) as count FROM workers w WHERE active_status = 0${uf.where.replace('AND', 'AND')}`).get(...params).count;

    const unitWise = db.prepare(`SELECT w.unit, COUNT(*) as count FROM workers w${prefix} GROUP BY w.unit ORDER BY count DESC`).all(...params);
    const contractorWise = db.prepare(`SELECT w.source, COUNT(*) as count FROM workers w${prefix} GROUP BY w.source ORDER BY count DESC`).all(...params);
    const departmentWise = db.prepare(`SELECT w.department, COUNT(*) as count FROM workers w${prefix} GROUP BY w.department ORDER BY count DESC`).all(...params);
    const pfStats = db.prepare(`SELECT w.pf_flag, COUNT(*) as count FROM workers w${prefix} GROUP BY w.pf_flag`).all(...params);
    const esicStats = db.prepare(`SELECT w.esic_flag, COUNT(*) as count FROM workers w${prefix} GROUP BY w.esic_flag`).all(...params);

    const totalCTC = db.prepare(`SELECT SUM(w.ctc) as total FROM workers w${prefix}`).get(...params).total || 0;
    const avgWage = db.prepare(`SELECT AVG(w.total_wage) as avg FROM workers w${prefix}`).get(...params).avg || 0;

    // --- Unit-wise: Total, Left, Joined, Active ---
    const now = new Date();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const curYear = now.getFullYear();
    const curMonthStr = curYear + '-' + curMonth;

    // Left workers = workers with exit_date in current month
    const leftThisMonth = db.prepare(`SELECT w.unit, COUNT(*) as count FROM workers w WHERE w.exit_date IS NOT NULL AND w.exit_date != '' AND strftime('%Y-%m', w.exit_date) = ?${uf.where.replace('AND', ' AND')}`).all(curMonthStr, ...params);

    // Joined this month = workers with DOJ in current month
    const joinedThisMonth = db.prepare(`SELECT w.unit, COUNT(*) as count FROM workers w WHERE w.doj IS NOT NULL AND w.doj != '' AND strftime('%Y-%m', w.doj) = ?${uf.where.replace('AND', ' AND')}`).all(curMonthStr, ...params);

    // Build unit summary
    const unitSummary = unitWise.map(u => {
      const left = (leftThisMonth.find(l => l.unit === u.unit) || { count: 0 }).count;
      const joined = (joinedThisMonth.find(j => j.unit === u.unit) || { count: 0 }).count;
      return { unit: u.unit, total: u.count, left, joined, active: u.count };
    });

    // --- Unit-wise & Month-wise Worker Cost ---
    // Accept FY param: default = current FY
    const fyParam = req.query.fy; // e.g. '2026' means FY 2026-27 (Apr 2026 - Mar 2027)
    const fyStartYear = fyParam ? parseInt(fyParam) : now.getFullYear();
    // FY months: Apr(4) of fyStartYear through Mar(3) of fyStartYear+1
    const months = [];
    for (let m = 4; m <= 12; m++) {
      months.push({ month: String(m).padStart(2, '0'), year: fyStartYear, label: new Date(fyStartYear, m - 1).toLocaleString('en', { month: 'short' }) + ' ' + fyStartYear });
    }
    for (let m = 1; m <= 3; m++) {
      months.push({ month: String(m).padStart(2, '0'), year: fyStartYear + 1, label: new Date(fyStartYear + 1, m - 1).toLocaleString('en', { month: 'short' }) + ' ' + (fyStartYear + 1) });
    }

    const allUnits = unitWise.map(u => u.unit);
    const unitWiseCostProper = [];
    for (const m of months) {
      const costData = db.prepare(`
        SELECT w.unit,
          SUM((COALESCE(w.basic_wage,0) + COALESCE(w.hra,0) + COALESCE(w.other_allowance,0)) * a.present) as totalCost,
          COUNT(DISTINCT a.worker_code) as workerCount
        FROM attendance a
        JOIN workers w ON a.worker_code = w.worker_code
        WHERE a.month = ? AND a.year = ? AND a.present > 0
        ${uf.where.replace('AND', ' AND')}
        GROUP BY w.unit
      `).all(m.month, m.year, ...params);

      const monthRow2 = { month: m.label, monthKey: m.month + '/' + m.year };
      let gTotal = 0, gCount = 0;
      for (const u of allUnits) {
        const ud = costData.find(c => c.unit === u);
        const cost = ud ? Math.round(ud.totalCost) : 0;
        const cnt = ud ? ud.workerCount : 0;
        monthRow2[u + '_cost'] = cost;
        monthRow2[u + '_count'] = cnt;
        monthRow2[u + '_avg'] = cnt > 0 ? Math.round(cost / cnt) : 0;
        gTotal += cost;
        gCount += cnt;
      }
      monthRow2['grandTotal'] = Math.round(gTotal);
      monthRow2['grandAvg'] = gCount > 0 ? Math.round(gTotal / gCount) : 0;
      unitWiseCostProper.push(monthRow2);
    }

    // Compute FY total
    let fyGrandTotal = 0, fyGrandCount = 0;
    unitWiseCostProper.forEach(r => { fyGrandTotal += r.grandTotal || 0; });

    res.json({
      totalWorkers, activeWorkers, inactiveWorkers,
      unitWise, contractorWise, departmentWise, pfStats, esicStats,
      totalCTC: Math.round(totalCTC), avgWage: Math.round(avgWage),
      unitSummary, unitWiseCost: unitWiseCostProper, months: months.map(m => m.label),
      allUnits, fyStartYear, fyLabel: 'FY ' + fyStartYear + '-' + String(fyStartYear + 1).slice(-2),
      fyGrandTotal: Math.round(fyGrandTotal)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ============ CONTRACTOR API ============

app.get('/api/contractors', authenticate, (req, res) => {
  try {
    const contractors = db.prepare('SELECT * FROM contractors ORDER BY name').all();
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
});

app.post('/api/contractors', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { name } = req.body;
    const existing = db.prepare('SELECT name FROM contractors WHERE name = ?').get(name);
    if (existing) return res.status(400).json({ error: 'Contractor already exists' });
    const r = db.prepare('INSERT INTO contractors (name, gst_number, pan_number, pf_percentage, esic_percentage, tds_percentage, gst_percentage) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      name, req.body.gst_number, req.body.pan_number, req.body.pf_percentage || 12, req.body.esic_percentage || 0.75, req.body.tds_percentage || 2, req.body.gst_percentage || 18
    );
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add contractor' });
  }
});

// ============ EXPORT API (unit-filtered) ============

app.get('/api/export/workers', authenticate, (req, res) => {
  try {
    const uf = getUnitFilterSQL(req.user.units, 'w');
    const workers = db.prepare(`SELECT w.* FROM workers w WHERE 1=1${uf.where} ORDER BY w.worker_code`).all(...uf.params);
    const ws = XLSX.utils.json_to_sheet(workers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workers');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=workers_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export workers' });
  }
});

app.get('/api/export/unit-report', authenticate, (req, res) => {
  try {
    const uf = getUnitFilterSQL(req.user.units, 'w');
    const data = db.prepare(`SELECT w.unit, COUNT(*) as total, SUM(CASE WHEN w.active_status = 1 THEN 1 ELSE 0 END) as active, SUM(CASE WHEN w.pf_flag = 'YES' THEN 1 ELSE 0 END) as pf_eligible, ROUND(AVG(w.total_wage), 0) as avg_wage FROM workers w WHERE 1=1${uf.where} GROUP BY w.unit`).all(...uf.params);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Unit Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=unit_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export unit report' });
  }
});

app.get('/api/export/contractor-report', authenticate, (req, res) => {
  try {
    const uf = getUnitFilterSQL(req.user.units, 'w');
    const data = db.prepare(`SELECT w.source as contractor, w.unit, COUNT(*) as workers, ROUND(AVG(w.total_wage), 0) as avg_wage, SUM(CASE WHEN w.pf_flag = 'YES' THEN 1 ELSE 0 END) as pf_count FROM workers w WHERE 1=1${uf.where} GROUP BY w.source, w.unit ORDER BY w.source`).all(...uf.params);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contractor Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=contractor_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export contractor report' });
  }
});

app.get('/api/export/attendance-report', authenticate, (req, res) => {
  try {
    const { month, year } = req.query;
    const uf = getUnitFilterSQL(req.user.units, 'w');
    let query = `SELECT a.worker_code, w.name, w.unit, w.department, a.month, a.year, a.present, a.absent, a.weekly_off, a.paid_holiday, a.leave, a.lwp, a.ot_hours FROM attendance a JOIN workers w ON a.worker_code = w.worker_code WHERE 1=1${uf.where}`;
    const params = [...uf.params];
    if (month) { query += ' AND a.month = ?'; params.push(month); }
    if (year) { query += ' AND a.year = ?'; params.push(parseInt(year)); }
    query += ' ORDER BY w.unit, a.worker_code';
    const data = db.prepare(query).all(...params);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${month || 'all'}_${year || 'all'}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export attendance report' });
  }
});

app.get('/api/export/department-report', authenticate, (req, res) => {
  try {
    const uf = getUnitFilterSQL(req.user.units, 'w');
    const data = db.prepare(`SELECT w.department, w.unit, COUNT(*) as total, SUM(CASE WHEN w.active_status = 1 THEN 1 ELSE 0 END) as active, SUM(CASE WHEN w.pf_flag = 'YES' THEN 1 ELSE 0 END) as pf_count FROM workers w WHERE 1=1${uf.where} GROUP BY w.department, w.unit ORDER BY w.department`).all(...uf.params);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Department Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=department_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export department report' });
  }
});

app.get('/api/export/pf-report', authenticate, (req, res) => {
  try {
    const uf = getUnitFilterSQL(req.user.units, 'w');
    const data = db.prepare(`SELECT w.worker_code, w.name, w.unit, w.department, w.pf_flag, w.esic_flag, w.uan, w.basic_wage, w.hra, w.total_wage, w.ctc FROM workers w WHERE w.pf_flag = 'YES' AND w.active_status = 1${uf.where} ORDER BY w.unit, w.worker_code`).all(...uf.params);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PF Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=pf_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PF report' });
  }
});

// ============ AUDIT LOG ============

app.get('/api/audit-log', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 100').all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// ============ BACKUP/RESTORE ============

app.post('/api/backup', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `worker_erp_backup_${timestamp}.db`);
    fs.copyFileSync(DB_FILE, backupFile);

    const excelBackup = path.join(backupDir, `worker_erp_backup_${timestamp}.xlsx`);
    const workers = db.prepare('SELECT * FROM workers ORDER BY worker_code').all();
    const ws = XLSX.utils.json_to_sheet(workers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workers');
    XLSX.writeFile(wb, excelBackup);

    logAudit(req.user.id, req.user.username, 'BACKUP', `Backup created: ${timestamp}`);
    res.json({ success: true, backupFile: path.basename(backupFile), excelFile: path.basename(excelBackup), workerCount: workers.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

app.get('/api/backups', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) return res.json([]);
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db') || f.endsWith('.xlsx'))
      .map(f => ({ name: f, size: fs.statSync(path.join(backupDir, f)).size, date: fs.statSync(path.join(backupDir, f)).mtime }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// ============ IMPORT HISTORY ============

app.get('/api/import/history', authenticate, (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM import_history ORDER BY import_date DESC LIMIT 10').all();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
});

// ============ LEAVE CONTROL API ============

// Get leave balance for a worker
app.get('/api/leave/balance/:workerCode', authenticate, (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const worker = db.prepare('SELECT worker_code, name, unit, type FROM workers WHERE worker_code = ?').get(req.params.workerCode);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Company workers only
    if (worker.type !== 'Company') {
      return res.status(400).json({ error: 'Leave management is only for company-roll workers', isContractor: true });
    }

    // Check unit access
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access to this worker' });
    }

    let balance = db.prepare('SELECT *, (total_allocated - total_taken) as remaining FROM leave_balance WHERE worker_code = ? AND year = ?').get(req.params.workerCode, year);
    if (!balance) {
      db.prepare('INSERT INTO leave_balance (worker_code, year, total_allocated) VALUES (?, ?, 24)').run(req.params.workerCode, year);
      balance = db.prepare('SELECT *, (total_allocated - total_taken) as remaining FROM leave_balance WHERE worker_code = ? AND year = ?').get(req.params.workerCode, year);
    }

    const transactions = db.prepare('SELECT * FROM leave_transactions WHERE worker_code = ? AND year = ? ORDER BY created_at DESC').all(req.params.workerCode, year);

    res.json({ worker, balance, transactions });
  } catch (error) {
    console.error('Leave balance error:', error);
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
});

// Get all leave balances for a unit (HR/Reviewer view)
app.get('/api/leave/summary', authenticate, (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const uf = getUnitFilterSQL(req.user.units, 'w');

    const query = `
      SELECT w.worker_code, w.name, w.unit, w.type,
        COALESCE(lb.total_allocated, 0) as total_allocated,
        COALESCE(lb.total_taken, 0) as total_taken,
        COALESCE(lb.total_allocated, 0) - COALESCE(lb.total_taken, 0) as remaining
      FROM workers w
      LEFT JOIN leave_balance lb ON w.worker_code = lb.worker_code AND lb.year = ?
      WHERE w.active_status = 1 AND w.type = 'Company'${uf.where}
      ORDER BY w.unit, w.worker_code
    `;
    const data = db.prepare(query).all(year, ...uf.params);
    res.json(data);
  } catch (error) {
    console.error('Leave summary error:', error);
    res.status(500).json({ error: 'Failed to fetch leave summary' });
  }
});

// Apply for leave
app.post('/api/leave/apply', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { worker_code, leave_type, from_date, to_date, days, reason } = req.body;

    // Validate worker is company type
    const worker = db.prepare('SELECT worker_code, unit, type FROM workers WHERE worker_code = ?').get(worker_code);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (worker.type !== 'Company') return res.status(400).json({ error: 'Leave only for company workers' });

    // Check unit access
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access to this worker' });
    }

    // Check leave balance
    const year = new Date(from_date).getFullYear();
    let balance = db.prepare('SELECT *, (total_allocated - total_taken) as remaining FROM leave_balance WHERE worker_code = ? AND year = ?').get(worker_code, year);
    if (!balance) {
      db.prepare('INSERT INTO leave_balance (worker_code, year, total_allocated) VALUES (?, ?, 24)').run(worker_code, year);
      balance = db.prepare('SELECT *, (total_allocated - total_taken) as remaining FROM leave_balance WHERE worker_code = ? AND year = ?').get(worker_code, year);
    }

    if (leave_type !== 'lwp' && balance.remaining < days) {
      return res.status(400).json({ error: `Insufficient leave balance. Available: ${balance.remaining} days` });
    }

    // Insert leave transaction
    const result = db.prepare(
      `INSERT INTO leave_transactions (worker_code, year, leave_type, from_date, to_date, days, reason, status, applied_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?)`
    ).run(worker_code, year, leave_type, from_date, to_date, days, reason || '', req.user.id);

    // Update balance
    if (leave_type === 'lwp') {
      db.prepare('UPDATE leave_balance SET total_lwp = total_lwp + ?, updated_at = CURRENT_TIMESTAMP WHERE worker_code = ? AND year = ?').run(days, worker_code, year);
    } else {
      db.prepare('UPDATE leave_balance SET total_taken = total_taken + ?, updated_at = CURRENT_TIMESTAMP WHERE worker_code = ? AND year = ?').run(days, worker_code, year);
    }

    logAudit(req.user.id, req.user.username, 'LEAVE_APPLY', `Leave applied: ${worker_code}, ${leave_type}, ${from_date} to ${to_date}, ${days} days`);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Leave apply error:', error);
    res.status(500).json({ error: 'Failed to apply leave' });
  }
});

// Cancel leave
app.post('/api/leave/cancel/:id', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const leave = db.prepare('SELECT * FROM leave_transactions WHERE id = ?').get(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave not found' });
    if (leave.status !== 'approved') return res.status(400).json({ error: 'Can only cancel approved leave' });

    db.prepare(`UPDATE leave_transactions SET status = 'cancelled' WHERE id = ?`).run(req.params.id);

    // Restore balance
    if (leave.leave_type === 'lwp') {
      db.prepare('UPDATE leave_balance SET total_lwp = total_lwp - ?, updated_at = CURRENT_TIMESTAMP WHERE worker_code = ? AND year = ?').run(leave.days, leave.worker_code, leave.year);
    } else {
      db.prepare('UPDATE leave_balance SET total_taken = total_taken - ?, updated_at = CURRENT_TIMESTAMP WHERE worker_code = ? AND year = ?').run(leave.days, leave.worker_code, leave.year);
    }

    logAudit(req.user.id, req.user.username, 'LEAVE_CANCEL', `Leave cancelled: ID ${req.params.id}, ${leave.worker_code}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel leave' });
  }
});

// Leave report export
app.get('/api/export/leave-report', authenticate, (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const uf = getUnitFilterSQL(req.user.units, 'w');
    const data = db.prepare(`
      SELECT w.worker_code, w.name, w.unit, w.type, w.department,
        COALESCE(lb.total_allocated, 0) as allocated, COALESCE(lb.total_taken, 0) as taken,
        COALESCE(lb.total_lwp, 0) as lwp, COALESCE(lb.total_allocated, 0) - COALESCE(lb.total_taken, 0) as remaining
      FROM workers w
      LEFT JOIN leave_balance lb ON w.worker_code = lb.worker_code AND lb.year = ?
      WHERE w.active_status = 1 AND w.type = 'Company'${uf.where}
      ORDER BY w.unit, w.worker_code
    `).all(year, ...uf.params);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=leave_report_${year}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export leave report' });
  }
});

// ============ WAGE HISTORY API ============

// Get wage history for a worker
app.get('/api/wage-history/:workerCode', authenticate, (req, res) => {
  try {
    const worker = db.prepare('SELECT worker_code, name, unit, type, total_wage FROM workers WHERE worker_code = ?').get(req.params.workerCode);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access' });
    }
    const history = db.prepare('SELECT * FROM wage_history WHERE worker_code = ? ORDER BY effective_from DESC').all(req.params.workerCode);
    res.json({ worker, history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wage history' });
  }
});

// Add wage revision
app.post('/api/wage-history', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { worker_code, effective_from, new_wage, basic_wage, hra, other_allowance, ctc, change_type, reason } = req.body;

    const worker = db.prepare('SELECT worker_code, unit, type, total_wage FROM workers WHERE worker_code = ?').get(worker_code);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access to this worker' });
    }

    const old_wage = worker.total_wage || 0;

    // Insert wage history record
    db.prepare(`INSERT INTO wage_history (worker_code, effective_from, old_wage, new_wage, basic_wage, hra, other_allowance, ctc, change_type, reason, changed_by, changed_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(worker_code, effective_from, old_wage, new_wage, basic_wage || 0, hra || 0, other_allowance || 0, ctc || new_wage, change_type || 'revision', reason || '', req.user.id, req.user.displayName);

    // Update current wage on worker
    db.prepare('UPDATE workers SET total_wage = ?, basic_wage = ?, hra = ?, other_allowance = ?, ctc = ?, updated_at = CURRENT_TIMESTAMP WHERE worker_code = ?')
      .run(new_wage, basic_wage || 0, hra || 0, other_allowance || 0, ctc || new_wage, worker_code);

    logAudit(req.user.id, req.user.username, 'WAGE_CHANGE', `Wage: ${worker_code}, ₹${old_wage} → ₹${new_wage} effective ${effective_from}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Wage history error:', error);
    res.status(500).json({ error: 'Failed to add wage revision' });
  }
});

// ============ INCREMENT API ============

// Get increments for a worker
app.get('/api/increments/:workerCode', authenticate, (req, res) => {
  try {
    const worker = db.prepare('SELECT worker_code, name, unit, type, total_wage FROM workers WHERE worker_code = ?').get(req.params.workerCode);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access' });
    }
    const increments = db.prepare('SELECT * FROM increments WHERE worker_code = ? ORDER BY effective_from DESC').all(req.params.workerCode);
    res.json({ worker, increments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch increments' });
  }
});

// Add increment
app.post('/api/increments', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { worker_code, increment_type, effective_from, new_wage, reason } = req.body;

    const worker = db.prepare('SELECT worker_code, unit, type, total_wage FROM workers WHERE worker_code = ?').get(worker_code);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access to this worker' });
    }

    const old_wage = worker.total_wage || 0;
    const increment_amount = new_wage - old_wage;
    const increment_percentage = old_wage > 0 ? ((increment_amount / old_wage) * 100).toFixed(1) : 0;

    // Insert increment record
    db.prepare(`INSERT INTO increments (worker_code, increment_type, effective_from, old_wage, new_wage, increment_amount, increment_percentage, reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(worker_code, increment_type, effective_from, old_wage, new_wage, increment_amount, increment_percentage, reason || '', req.user.id);

    // Also add to wage history
    db.prepare(`INSERT INTO wage_history (worker_code, effective_from, old_wage, new_wage, change_type, reason, changed_by, changed_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(worker_code, effective_from, old_wage, new_wage, increment_type === 'may' ? 'may_increment' : increment_type === 'november' ? 'november_increment' : 'special', reason || '', req.user.id, req.user.displayName);

    // Update current wage
    db.prepare('UPDATE workers SET total_wage = ?, updated_at = CURRENT_TIMESTAMP WHERE worker_code = ?').run(new_wage, worker_code);

    logAudit(req.user.id, req.user.username, 'INCREMENT', `${increment_type} increment: ${worker_code}, ₹${old_wage} → ₹${new_wage} effective ${effective_from}`);
    res.json({ success: true, increment_amount, increment_percentage });
  } catch (error) {
    console.error('Increment error:', error);
    res.status(500).json({ error: 'Failed to add increment' });
  }
});

// Get all increments by type and year
app.get('/api/increments', authenticate, (req, res) => {
  try {
    const { type, year } = req.query;
    const uf = getUnitFilterSQL(req.user.units, 'w');
    let query = `SELECT i.*, w.name, w.unit, w.department FROM increments i JOIN workers w ON i.worker_code = w.worker_code WHERE 1=1${uf.where}`;
    const params = [...uf.params];
    if (type) { query += ' AND i.increment_type = ?'; params.push(type); }
    if (year) { query += " AND strftime('%Y', i.effective_from) = ?"; params.push(year); }
    query += ' ORDER BY i.effective_from DESC';
    const data = db.prepare(query).all(...params);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch increments' });
  }
});

// ============ ATTRITION / WORKER EXIT API ============

// Worker exit
app.post('/api/workers/:code/exit', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { exit_date, exit_reason } = req.body;
    const worker = db.prepare('SELECT worker_code, unit, type FROM workers WHERE worker_code = ?').get(req.params.code);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access to this worker' });
    }

    db.prepare('UPDATE workers SET active_status = 0, exit_date = ?, exit_reason = ?, dol = ?, updated_at = CURRENT_TIMESTAMP WHERE worker_code = ?')
      .run(exit_date, exit_reason || '', exit_date, req.params.code);

    logAudit(req.user.id, req.user.username, 'WORKER_EXIT', `Worker exited: ${req.params.code}, Date: ${exit_date}, Reason: ${exit_reason}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record exit' });
  }
});

// Attrition report
app.get('/api/attrition-report', authenticate, (req, res) => {
  try {
    const { month, year, unit } = req.query;
    const uf = getUnitFilterSQL(req.user.units, 'w');

    let query = `SELECT worker_code, name, unit, department, type, source, doj, exit_date, exit_reason
      FROM workers WHERE exit_date IS NOT NULL AND exit_date != ''${uf.where}`;
    const params = [...uf.params];

    if (month && year) {
      query += ` AND strftime('%m', exit_date) = ? AND strftime('%Y', exit_date) = ?`;
      params.push(month, year);
    } else if (year) {
      query += ` AND strftime('%Y', exit_date) = ?`;
      params.push(year);
    }
    if (unit && req.user.units.includes('*')) {
      query += ' AND unit = ?';
      params.push(unit);
    }
    query += ' ORDER BY exit_date DESC';

    const data = db.prepare(query).all(...params);
    res.json(data);
  } catch (error) {
    console.error('Attrition report error:', error);
    res.status(500).json({ error: 'Failed to fetch attrition report' });
  }
});

// Attrition report export
app.get('/api/export/attrition-report', authenticate, (req, res) => {
  try {
    const { month, year } = req.query;
    const uf = getUnitFilterSQL(req.user.units, 'w');
    let query = `SELECT worker_code, name, unit, department, type, source, doj, exit_date, exit_reason
      FROM workers WHERE exit_date IS NOT NULL AND exit_date != ''${uf.where}`;
    const params = [...uf.params];
    if (month && year) {
      query += ` AND strftime('%m', exit_date) = ? AND strftime('%Y', exit_date) = ?`;
      params.push(month, year);
    } else if (year) {
      query += ` AND strftime('%Y', exit_date) = ?`;
      params.push(year);
    }
    query += ' ORDER BY exit_date DESC';
    const data = db.prepare(query).all(...params);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attrition Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attrition_report.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export attrition report' });
  }
});

// ============ LOAN/RECOVERY API ============

// Get loan recovery for a worker
app.get('/api/loan-recovery/:workerCode', authenticate, (req, res) => {
  try {
    const worker = db.prepare('SELECT worker_code, name, unit, type FROM workers WHERE worker_code = ?').get(req.params.workerCode);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access' });
    }
    const records = db.prepare('SELECT * FROM loan_recovery WHERE worker_code = ? ORDER BY year DESC, month DESC').all(req.params.workerCode);
    res.json({ worker, records });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loan recovery' });
  }
});

// Add/update loan recovery for a worker
app.post('/api/loan-recovery', authenticate, requireRole('super_admin', 'hr'), (req, res) => {
  try {
    const { worker_code, month, year, loan_amount, loan_deduction, advance_amount, advance_deduction, other_deductions, outstanding_balance, remarks } = req.body;

    const worker = db.prepare('SELECT worker_code, unit FROM workers WHERE worker_code = ?').get(worker_code);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access to this worker' });
    }

    db.prepare(`INSERT INTO loan_recovery (worker_code, month, year, loan_amount, loan_deduction, advance_amount, advance_deduction, other_deductions, outstanding_balance, remarks, created_by, created_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(worker_code, month, year) DO UPDATE SET
        loan_amount=excluded.loan_amount, loan_deduction=excluded.loan_deduction,
        advance_amount=excluded.advance_amount, advance_deduction=excluded.advance_deduction,
        other_deductions=excluded.other_deductions, outstanding_balance=excluded.outstanding_balance,
        remarks=excluded.remarks`)
      .run(worker_code, month, year, loan_amount||0, loan_deduction||0, advance_amount||0, advance_deduction||0, other_deductions||0, outstanding_balance||0, remarks||'', req.user.id, req.user.displayName);

    logAudit(req.user.id, req.user.username, 'LOAN_RECOVERY', `Loan: ${worker_code}, Month: ${month}/${year}, Deduction: ${loan_deduction||0}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Loan recovery error:', error);
    res.status(500).json({ error: 'Failed to save loan recovery' });
  }
});

// Loan recovery summary for a month/unit
app.get('/api/loan-recovery', authenticate, (req, res) => {
  try {
    const { month, year } = req.query;
    const uf = getUnitFilterSQL(req.user.units, 'w');
    let query = `SELECT lr.*, w.name, w.unit, w.type FROM loan_recovery lr JOIN workers w ON lr.worker_code = w.worker_code WHERE 1=1${uf.where}`;
    const params = [...uf.params];
    if (month) { query += ' AND lr.month = ?'; params.push(month); }
    if (year) { query += ' AND lr.year = ?'; params.push(parseInt(year)); }
    query += ' ORDER BY w.unit, lr.worker_code';
    const data = db.prepare(query).all(...params);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loan recovery summary' });
  }
});

// Export loan recovery to Excel
app.get('/api/export/loan-recovery', authenticate, (req, res) => {
  try {
    const { month, year } = req.query;
    const uf = getUnitFilterSQL(req.user.units, 'w');
    let query = `SELECT lr.worker_code, w.name, w.unit, w.type, lr.month, lr.year, lr.loan_amount, lr.loan_deduction, lr.advance_amount, lr.advance_deduction, lr.other_deductions, lr.outstanding_balance, lr.remarks FROM loan_recovery lr JOIN workers w ON lr.worker_code = w.worker_code WHERE 1=1${uf.where}`;
    const params = [...uf.params];
    if (month) { query += ' AND lr.month = ?'; params.push(month); }
    if (year) { query += ' AND lr.year = ?'; params.push(parseInt(year)); }
    query += ' ORDER BY w.unit, lr.worker_code';
    const data = db.prepare(query).all(...params);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Loan Recovery');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=loan_recovery_${month||'all'}_${year||'all'}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

// ============ PAY SLIP API ============

// Generate payslip for a worker
app.get('/api/payslip/:workerCode', authenticate, (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'Month and year required' });
    const monthStr = String(month).padStart(2, '0');

    const worker = db.prepare('SELECT * FROM workers WHERE worker_code = ?').get(req.params.workerCode);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (!req.user.units.includes('*') && !req.user.units.includes(worker.unit)) {
      return res.status(403).json({ error: 'No access' });
    }

    // Get attendance for this month
    const attendance = db.prepare('SELECT * FROM attendance WHERE worker_code = ? AND month = ? AND year = ?').get(req.params.workerCode, monthStr, parseInt(year));
    
    // Get loan/recovery for this month
    const loanRec = db.prepare('SELECT * FROM loan_recovery WHERE worker_code = ? AND month = ? AND year = ?').get(req.params.workerCode, monthStr, parseInt(year));

    // Calculate earnings
    const wage = worker.total_wage || 0;
    const daysPresent = attendance ? attendance.present : 0;
    const daysLWP = attendance ? attendance.lwp : 0;
    const otHours = attendance ? attendance.ot_hours : 0;
    const workingDays = attendance ? (attendance.present + attendance.weekly_off + attendance.paid_holiday + attendance.leave) : 0;
    
    const basicEarnings = wage * daysPresent;
    const hraEarnings = worker.hra ? worker.hra * daysPresent : 0;
    const otherAllow = worker.other_allowance ? worker.other_allowance * daysPresent : 0;
    const otAmount = otHours * (wage / 8) * 1.5; // OT at 1.5x
    const grossEarnings = basicEarnings + hraEarnings + otherAllow + otAmount;
    
    // Deductions
    const loanDeduction = loanRec ? (loanRec.loan_deduction || 0) : 0;
    const advanceDeduction = loanRec ? (loanRec.advance_deduction || 0) : 0;
    const otherDeductions = loanRec ? (loanRec.other_deductions || 0) : 0;
    const lwpDeduction = daysLWP * wage;
    const pfDeduction = worker.pf_flag === 'YES' ? Math.round(basicEarnings * 0.12) : 0;
    const esicDeduction = worker.esic_flag === 'YES' ? Math.round(grossEarnings * 0.0075) : 0;
    const totalDeductions = loanDeduction + advanceDeduction + otherDeductions + lwpDeduction + pfDeduction + esicDeduction;
    
    const netPay = Math.round(grossEarnings - totalDeductions);

    // Get unit address
    const unitInfo = db.prepare('SELECT * FROM units WHERE name = ?').get(worker.unit);

    res.json({
      unit: {
        name: unitInfo ? unitInfo.name : worker.unit,
        company_name: unitInfo ? unitInfo.company_name : 'SVN-Sakar Group',
        address: unitInfo ? unitInfo.address : '',
        city: unitInfo ? unitInfo.city : '',
        state: unitInfo ? unitInfo.state : 'Gujarat'
      },
      worker: {
        worker_code: worker.worker_code,
        name: worker.name,
        unit: worker.unit,
        department: worker.department,
        type: worker.type,
        doj: worker.doj,
        uan: worker.uan,
        pf_flag: worker.pf_flag,
        esic_flag: worker.esic_flag,
        bank_ac: worker.pay_group
      },
      month, year: parseInt(year),
      attendance: {
        total_days: workingDays,
        present: daysPresent,
        absent: attendance ? attendance.absent : 0,
        weekly_off: attendance ? attendance.weekly_off : 0,
        leave: attendance ? attendance.leave : 0,
        lwp: daysLWP,
        ot_hours: otHours
      },
      earnings: {
        basic: Math.round(basicEarnings),
        hra: Math.round(hraEarnings),
        other_allowance: Math.round(otherAllow),
        ot: Math.round(otAmount),
        gross: Math.round(grossEarnings)
      },
      deductions: {
        loan: loanDeduction,
        advance: advanceDeduction,
        other: otherDeductions,
        lwp: Math.round(lwpDeduction),
        pf: pfDeduction,
        esic: esicDeduction,
        total: Math.round(totalDeductions)
      },
      net_pay: netPay
    });
  } catch (error) {
    console.error('Payslip error:', error);
    res.status(500).json({ error: 'Failed to generate payslip' });
  }
});

// Payslip summary for a unit/month
app.get('/api/payslips', authenticate, (req, res) => {
  try {
    const { month, year, unit } = req.query;
    const monthStr = String(month || '').padStart(2, '0');
    const uf = getUnitFilterSQL(req.user.units, 'w');
    let query = `SELECT w.worker_code, w.name, w.unit, w.department, w.total_wage, w.pf_flag, w.esic_flag,
      a.present, a.absent, a.leave, a.lwp, a.ot_hours,
      lr.loan_deduction, lr.advance_deduction, lr.other_deductions
      FROM workers w
      LEFT JOIN attendance a ON w.worker_code = a.worker_code AND a.month = ? AND a.year = ?
      LEFT JOIN loan_recovery lr ON w.worker_code = lr.worker_code AND lr.month = ? AND lr.year = ?
      WHERE w.active_status = 1 AND w.type = 'Company'${uf.where}
      ORDER BY w.unit, w.worker_code`;
    const params = [monthStr, parseInt(year), monthStr, parseInt(year), ...uf.params];
    const data = db.prepare(query).all(...params);

    // Calculate net pay for each
    const results = data.map(w => {
      const wage = w.total_wage || 0;
      const basic = wage * (w.present || 0);
      const hra = 0;
      const ot = (w.ot_hours || 0) * (wage / 8) * 1.5;
      const gross = basic + hra + ot;
      const lwpDed = (w.lwp || 0) * wage;
      const pf = w.pf_flag === 'YES' ? Math.round(basic * 0.12) : 0;
      const esic = w.esic_flag === 'YES' ? Math.round(gross * 0.0075) : 0;
      const totalDed = (w.loan_deduction||0) + (w.advance_deduction||0) + (w.other_deductions||0) + lwpDed + pf + esic;
      return { ...w, gross: Math.round(gross), total_deductions: Math.round(totalDed), net_pay: Math.round(gross - totalDed) };
    });

    res.json(results);
  } catch (error) {
    console.error('Payslips error:', error);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// Export payslips to Excel
app.get('/api/export/payslips', authenticate, (req, res) => {
  try {
    const { month, year } = req.query;
    const uf = getUnitFilterSQL(req.user.units, 'w');
    let query = `SELECT w.worker_code, w.name, w.unit, w.department, w.total_wage, w.pf_flag, w.esic_flag,
      a.present, a.absent, a.leave, a.lwp, a.ot_hours,
      lr.loan_deduction, lr.advance_deduction, lr.other_deductions
      FROM workers w
      LEFT JOIN attendance a ON w.worker_code = a.worker_code AND a.month = ? AND a.year = ?
      LEFT JOIN loan_recovery lr ON w.worker_code = lr.worker_code AND lr.month = ? AND lr.year = ?
      WHERE w.active_status = 1 AND w.type = 'Company'${uf.where}
      ORDER BY w.unit, w.worker_code`;
    const params = [month, parseInt(year), month, parseInt(year), ...uf.params];
    const data = db.prepare(query).all(...params);

    const results = data.map(w => {
      const wage = w.total_wage || 0;
      const basic = wage * (w.present || 0);
      const ot = (w.ot_hours || 0) * (wage / 8) * 1.5;
      const gross = basic + ot;
      const lwpDed = (w.lwp || 0) * wage;
      const pf = w.pf_flag === 'YES' ? Math.round(basic * 0.12) : 0;
      const esic = w.esic_flag === 'YES' ? Math.round(gross * 0.0075) : 0;
      const totalDed = (w.loan_deduction||0) + (w.advance_deduction||0) + (w.other_deductions||0) + lwpDed + pf + esic;
      return {
        'Worker Code': w.worker_code, 'Name': w.name, 'Unit': w.unit, 'Department': w.department,
        'Daily Wage': wage, 'Present Days': w.present, 'LWP': w.lwp, 'OT Hours': w.ot_hours,
        'Basic': Math.round(basic), 'OT Amount': Math.round(ot), 'Gross': Math.round(gross),
        'Loan Ded': w.loan_deduction||0, 'Advance Ded': w.advance_deduction||0, 'Other Ded': w.other_deductions||0,
        'LWP Ded': Math.round(lwpDed), 'PF': pf, 'ESIC': esic, 'Total Deductions': Math.round(totalDed),
        'Net Pay': Math.round(gross - totalDed)
      };
    });

    const ws = XLSX.utils.json_to_sheet(results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payslips');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payslips_${month}_${year}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export payslips' });
  }
});

// ============ GROUP BACKUP API ============

// Full group backup - all data in one SQLite file
app.post('/api/backup/group', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 1. Copy SQLite database
    const dbBackup = path.join(backupDir, `SVN_Sakar_Workerforce_${timestamp}.db`);
    fs.copyFileSync(DB_FILE, dbBackup);
    const dbSize = fs.statSync(dbBackup).size;

    // 2. Export workers to Excel
    const workers = db.prepare('SELECT * FROM workers ORDER BY unit, worker_code').all();
    const ws1 = XLSX.utils.json_to_sheet(workers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Workers');

    // 3. Export attendance
    const attendance = db.prepare('SELECT a.*, w.name, w.unit FROM attendance a JOIN workers w ON a.worker_code = w.worker_code ORDER BY a.year DESC, a.month DESC').all();
    const ws2 = XLSX.utils.json_to_sheet(attendance);
    XLSX.utils.book_append_sheet(wb, ws2, 'Attendance');

    // 4. Export leave ledger
    const leaveData = db.prepare(`SELECT w.worker_code, w.name, w.unit, w.type, w.department, lb.year, lb.total_allocated, lb.total_taken, lb.total_lwp, (lb.total_allocated - lb.total_taken) as remaining FROM workers w LEFT JOIN leave_balance lb ON w.worker_code = lb.worker_code WHERE w.type = 'Company' AND w.active_status = 1 ORDER BY w.unit, w.worker_code`).all();
    const ws3 = XLSX.utils.json_to_sheet(leaveData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Leave Ledger');

    // 5. Export wage history
    const wageHist = db.prepare('SELECT wh.*, w.name, w.unit FROM wage_history wh JOIN workers w ON wh.worker_code = w.worker_code ORDER BY wh.effective_from DESC').all();
    const ws4 = XLSX.utils.json_to_sheet(wageHist);
    XLSX.utils.book_append_sheet(wb, ws4, 'Wage History');

    // 6. Export loan recovery
    const loanRec = db.prepare('SELECT lr.*, w.name, w.unit FROM loan_recovery lr JOIN workers w ON lr.worker_code = w.worker_code ORDER BY lr.year DESC, lr.month DESC').all();
    const ws5 = XLSX.utils.json_to_sheet(loanRec);
    XLSX.utils.book_append_sheet(wb, ws5, 'Loan Recovery');

    // 7. Export increments
    const incrs = db.prepare('SELECT i.*, w.name, w.unit FROM increments i JOIN workers w ON i.worker_code = w.worker_code ORDER BY i.effective_from DESC').all();
    const ws6 = XLSX.utils.json_to_sheet(incrs);
    XLSX.utils.book_append_sheet(wb, ws6, 'Increments');

    // 8. Export users (without passwords)
    const users = db.prepare('SELECT id, username, display_name, role, units, is_active FROM users ORDER BY username').all();
    const ws7 = XLSX.utils.json_to_sheet(users);
    XLSX.utils.book_append_sheet(wb, ws7, 'Users');

    // 9. Export contractors
    const contractors = db.prepare('SELECT * FROM contractors ORDER BY name').all();
    const ws8 = XLSX.utils.json_to_sheet(contractors);
    XLSX.utils.book_append_sheet(wb, ws8, 'Contractors');

    // 10. Export audit log
    const auditLog = db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 500').all();
    const ws9 = XLSX.utils.json_to_sheet(auditLog);
    XLSX.utils.book_append_sheet(wb, ws9, 'Audit Log');

    // Write Excel
    const excelBackup = path.join(backupDir, `SVN_Sakar_Workerforce_${timestamp}.xlsx`);
    XLSX.writeFile(wb, excelBackup);
    const excelSize = fs.statSync(excelBackup).size;

    logAudit(req.user.id, req.user.username, 'GROUP_BACKUP', `Full backup: ${workers.length} workers, ${attendance.length} attendance, ${loanRec.length} loans, ${wageHist.length} wage records`);

    res.json({
      success: true,
      files: [
        { name: path.basename(dbBackup), type: 'SQLite Database', size: `${(dbSize/1024/1024).toFixed(1)} MB` },
        { name: path.basename(excelBackup), type: 'Excel (All Data)', size: `${(excelSize/1024).toFixed(0)} KB` }
      ],
      summary: {
        workers: workers.length,
        attendance: attendance.length,
        leaveRecords: leaveData.length,
        wageHistory: wageHist.length,
        loanRecovery: loanRec.length,
        increments: incrs.length,
        users: users.length,
        contractors: contractors.length,
        auditEntries: auditLog.length
      }
    });
  } catch (error) {
    console.error('Group backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Restore from SQLite backup
app.post('/api/backup/restore-group', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const { backupFile } = req.body;
    const backupPath = path.join(__dirname, 'backups', backupFile);
    if (!fs.existsSync(backupPath)) return res.status(400).json({ error: 'Backup file not found' });
    if (!backupFile.endsWith('.db')) return res.status(400).json({ error: 'Only .db backup files can be restored' });

    // Create safety backup first
    const safetyTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(DB_FILE, path.join(__dirname, 'backups', `pre_restore_${safetyTimestamp}.db`));

    // Restore
    db.close();
    fs.copyFileSync(backupPath, DB_FILE);

    logAudit(req.user.id, req.user.username, 'RESTORE', `Restored from: ${backupFile}`);
    res.json({ success: true, message: 'Database restored. Please restart the server.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// List all backups
app.get('/api/backup/list', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) return res.json([]);
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db') || f.endsWith('.xlsx'))
      .map(f => ({
        name: f,
        size: `${(fs.statSync(path.join(backupDir, f)).size / 1024).toFixed(0)} KB`,
        date: fs.statSync(path.join(backupDir, f)).mtime,
        type: f.endsWith('.db') ? 'Database' : 'Excel'
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// ============ SEED DATA API (Super Admin) ============

app.post('/api/seed', authenticate, requireRole('super_admin'), (req, res) => {
  try {
    const seedFile = path.join(__dirname, 'src', 'data', 'workers.json');
    if (!fs.existsSync(seedFile)) return res.status(404).json({ error: 'Seed data not found' });

    const seedData = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    let inserted = 0, skipped = 0;

    const insert = db.prepare('INSERT OR IGNORE INTO workers (worker_code, name, father_name, gender, dob, doj, unit, type, source, department, designation, working_hours, pf_flag, esic_flag, uan, aadhaar, basic_wage, hra, other_allowance, total_wage, ctc, min_wage, transport, transport_by, pay_group, active_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

    const seedMany = db.transaction((workers) => {
      for (const w of workers) {
        const r = insert.run(w.worker_code, w.name, w.father_name, w.gender, w.dob, w.doj, w.unit, w.type, w.source, w.department, w.designation, w.working_hours || 8, w.pf_flag || 'NO', w.esic_flag || 'NO', w.uan, w.aadhaar, w.basic_wage || 0, w.hra || 0, w.other_allowance || 0, w.total_wage || 0, w.ctc || 0, w.min_wage || 0, w.transport, w.transport_by, w.pay_group, 1);
        if (r.changes > 0) inserted++; else skipped++;
      }
    });

    seedMany(seedData);
    logAudit(req.user.id, req.user.username, 'SEED', `Seeded: ${inserted} new, ${skipped} skipped`);
    res.json({ success: true, inserted, skipped, total: seedData.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed data: ' + error.message });
  }
});

// Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start
const localIP = getLocalIP();
const workerCount = db.prepare('SELECT COUNT(*) as c FROM workers').get().c;
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║      SVN-SAKAR GROUP WORKERFORCE v2.0                    ║`);
  console.log(`║      Workforce Management System                        ║`);
  console.log(`╠══════════════════════════════════════════════════════════╣`);
  console.log(`║  🏠 Local:     http://localhost:${PORT}                    ║`);
  console.log(`║  🌐 Network:   http://${localIP}:${PORT}             ║`);
  console.log(`║  💾 Database:  worker_erp.db (SQLite)                    ║`);
  console.log(`║  👥 Users:     ${userCount} configured                        ║`);
  console.log(`║  👷 Workers:   ${workerCount} loaded                         ║`);
  console.log(`║  🔒 Mode: OFFLINE + User Access Control                  ║`);
  console.log(`║  🔑 Login: admin / admin123 (Super Admin)                ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);
});
