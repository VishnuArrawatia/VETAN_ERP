import Database from 'better-sqlite3';
import crypto from 'crypto';

const db = new Database('./worker_erp.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============ EXISTING TABLES ============

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'reviewer',
    units TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT,
    gender TEXT DEFAULT 'M',
    dob TEXT, doj TEXT, dol TEXT,
    unit TEXT, type TEXT, source TEXT,
    department TEXT, designation TEXT,
    working_hours INTEGER DEFAULT 8,
    pf_flag TEXT DEFAULT 'NO',
    esic_flag TEXT DEFAULT 'NO',
    uan TEXT, aadhaar TEXT,
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

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT,
    details TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_workers_unit ON workers(unit);
  CREATE INDEX IF NOT EXISTS idx_workers_code ON workers(worker_code);
  CREATE INDEX IF NOT EXISTS idx_workers_type ON workers(type);
  CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance(worker_code);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`);

// ============ NEW TABLES ============

db.exec(`
  -- Leave Balance: tracks annual leave allocation per worker per year
  CREATE TABLE IF NOT EXISTS leave_balance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT NOT NULL,
    year INTEGER NOT NULL,
    total_allocated INTEGER DEFAULT 0,
    total_taken INTEGER DEFAULT 0,
    total_lwp INTEGER DEFAULT 0,
    remaining INTEGER GENERATED ALWAYS AS (total_allocated - total_taken) STORED,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_code, year)
  );

  -- Leave Transactions: every leave request/approval/rejection
  CREATE TABLE IF NOT EXISTS leave_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT NOT NULL,
    year INTEGER NOT NULL,
    leave_type TEXT NOT NULL DEFAULT 'casual',
    -- types: casual, sick, earned, lwp, paid_holiday
    from_date TEXT NOT NULL,
    to_date TEXT NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    -- status: pending, approved, rejected, cancelled
    applied_by INTEGER,
    approved_by INTEGER,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
    approved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_code) REFERENCES workers(worker_code)
  );

  -- Wage History: every wage change with effective date
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
    -- types: initial, revision, may_increment, november_increment, mid_month_revision
    reason TEXT,
    changed_by INTEGER,
    changed_by_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_code) REFERENCES workers(worker_code)
  );

  -- Increments: May and November wage revisions
  CREATE TABLE IF NOT EXISTS increments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_code TEXT NOT NULL,
    increment_type TEXT NOT NULL,
    -- 'may' or 'november' or 'special'
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
`);

// Add exit_date and exit_reason columns if not present
try {
  db.exec(`ALTER TABLE workers ADD COLUMN exit_date TEXT`);
  console.log('✅ Added exit_date column to workers');
} catch (e) {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE workers ADD COLUMN exit_reason TEXT`);
  console.log('✅ Added exit_reason column to workers');
} catch (e) {
  // Column already exists
}

// Seed default admin
const hash = crypto.createHash('sha256').update('admin123').digest('hex');
db.prepare('INSERT OR IGNORE INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)').run('admin', hash, 'Super Admin', 'super_admin', '["*"]');

// Seed default units
for (const u of ['SVN-I', 'SVN-II', 'Sakar-I', 'Sakar-III']) {
  db.prepare('INSERT OR IGNORE INTO units (name, display_name) VALUES (?, ?)').run(u, u);
}

// Seed test users
const hrHash = crypto.createHash('sha256').update('Work@2026').digest('hex');
db.prepare('INSERT OR IGNORE INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)').run('hr_svn1', hrHash, 'SVN-I HR', 'hr', '["SVN-I"]');
db.prepare('INSERT OR IGNORE INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)').run('hr_svn2', hrHash, 'SVN-II HR', 'hr', '["SVN-II"]');
db.prepare('INSERT OR IGNORE INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)').run('hr_sakar1', hrHash, 'Sakar-I HR', 'hr', '["Sakar-I"]');
db.prepare('INSERT OR IGNORE INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)').run('hr_sakar3', hrHash, 'Sakar-III HR', 'hr', '["Sakar-III"]');
db.prepare('INSERT OR IGNORE INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)').run('rv_svn1', hrHash, 'SVN-I Reviewer', 'reviewer', '["SVN-I"]');
db.prepare('INSERT OR IGNORE INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)').run('rv_svn2', hrHash, 'SVN-II Reviewer', 'reviewer', '["SVN-II"]');
db.prepare('INSERT OR IGNORE INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)').run('rv_sakar1', hrHash, 'Sakar-I Reviewer', 'reviewer', '["Sakar-I"]');
db.prepare('INSERT OR IGNORE INTO users (username, password_hash, display_name, role, units) VALUES (?, ?, ?, ?, ?)').run('rv_sakar3', hrHash, 'Sakar-III Reviewer', 'reviewer', '["Sakar-III"]');

db.close();
console.log('✅ Database initialized with leave, wage history, and increment tables');
