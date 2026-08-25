/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Express application factory — shared by local dev (server.ts) and
 * Vercel Serverless Functions (api/[[...]].ts).
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { PayrollDatabase } from './db';
import { Employee, Attendance, LeaveApplication, FullAndFinalSettlement } from '../src/types';
import crypto from 'crypto';

/**
 * Create and return a fully configured Express app with all ERP routes.
 * @param supabaseAdmin  Optional Supabase client (service_role) for cloud persistence.
 *                       When provided, PayrollDatabase uses Supabase instead of SQLite.
 */
let _dbRef: PayrollDatabase | null = null;
export function getAppDb(): PayrollDatabase | null { return _dbRef; }

export async function createApp(supabaseAdmin?: any) {
  const app = express();
  const db = new PayrollDatabase(supabaseAdmin);
  _dbRef = db;
  
  let startupException: any = null;
  try {
    console.log('Starting payroll database initialization...');
    await db.init();
    console.log('Payroll database initialized successfully.');
  } catch (err: any) {
    startupException = err;
    console.error('CRITICAL: Failed to initialize payroll database during server start:', err);
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Auditor Read-Only protection middleware
  app.use((req, res, next) => {
    const role = req.headers['x-operator-role'] as string || '';
    const method = req.method;
    // Block write requests for AUDITOR role except logins
    if (role === 'AUDITOR' && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const isLoginRoute = req.path === '/api/hr/login' || req.path === '/api/employee/login';
      if (!isLoginRoute) {
        return res.status(403).json({ success: false, error: 'Access Denied: Auditors are in read-only view mode and cannot modify any database records.' });
      }
    }
    next();
  });

  // Helper to verify PIN securely against database system settings
  async function verifyPin(pin: any): Promise<boolean> {
    const isSecEnabled = await db.getSystemSetting('production_security_enabled', '0');
    if (isSecEnabled === '0') {
      return true; // Bypass PIN verification in Testing Mode
    }
    const hash = crypto.createHash('sha256').update(String(pin || '')).digest('hex');
    const storedHash = await db.getSystemSetting('super_admin_pin', crypto.createHash('sha256').update('1234').digest('hex'));
    return hash === storedHash;
  }

  // Security and Visibility Helpers
  function getCompanyBrand(companyIdOrName: string): string {
    const name = String(companyIdOrName || '').toUpperCase();
    if (name.includes('SVN')) return 'SVN';
    if (name.includes('SAKAR')) return 'Sakar';
    if (name.includes('FLARE')) return 'Flare';
    if (name.includes('ZENIVO')) return 'Zenivo';
    return companyIdOrName;
  }

  function getAllowedCompanies(req: express.Request): string[] | null {
    const username = (req.headers['x-operator-username'] as string || '').trim().toLowerCase();
    const role = req.headers['x-operator-role'] as string || '';
    const empId = req.headers['x-employee-id'] as string || '';

    if (username) {
      try {
        const users = db.getUsers();
        const user = users.find(u => u.username.toLowerCase() === username);
        if (user) {
          if (user.role === 'SUPER_HR' || user.role === 'MANAGEMENT' || user.role === 'AUDITOR' || user.username === 'group_director') {
            return null; // Unrestricted
          }
          return user.company_rights || [];
        }
      } catch (e) {
        console.error('Error fetching users in getAllowedCompanies:', e);
      }
    }

    if (role === 'SUPER_HR' || role === 'MANAGEMENT' || role === 'AUDITOR' || username === 'group_director') {
      return null; // Unrestricted
    }

    let brand: string | null = null;
    if (username === 'svn_specialist' || username === 'svn_attendance_operator') {
      brand = 'SVN';
    } else if (username === 'sakar_specialist') {
      brand = 'Sakar';
    } else if (empId) {
      const employees = db.getEmployees();
      const emp = employees.find(e => e.id.toLowerCase() === empId.toLowerCase());
      if (emp) {
        brand = getCompanyBrand(emp.company);
      }
    }

    if (brand) {
      const allCompanies = db.getCompanies();
      return allCompanies.filter(c => getCompanyBrand(c.id) === brand).map(c => c.id);
    }

    if (!username && !empId && !role) {
      return null; // Unrestricted for backwards compatibility / local curl
    }

    return []; // Access denied
  }

  // Database and server status API
  app.get('/api/db-status', (req, res) => {
    const isMock = db.inMemoryOnly;
    const employeeCount = (db as any).data?.employees?.length || 0;
    const hasSupabase = !!(db as any).supabaseAdmin;
    let dbMode = 'SQLite3-File';
    if (hasSupabase && employeeCount > 0) dbMode = 'Supabase-Cloud';
    else if (isMock) dbMode = 'InMemoryFallback';
    const warnings: string[] = [];
    if (startupException) warnings.push(startupException.message || String(startupException));
    else if (isMock && !hasSupabase) warnings.push('sqlite3 package failed to load or open file. Falling back to Pure JS In-Memory Mode.');
    res.json({
      status: startupException ? 'ERROR' : 'OK',
      currentDatabaseMode: dbMode,
      isPayrollDbActive: !startupException && employeeCount > 0,
      isInMemoryMode: isMock,
      employeeCount,
      hasSupabaseClient: hasSupabase,
      initializationWarnings: warnings
    });
  });

  // API ROUTES

  // Get active dashboard metrics, including multi-company statistics
  app.get('/api/dashboard/summary', (req, res) => {
    const { company } = req.query as { company?: string };
    const allowed = getAllowedCompanies(req);

    let targetCompany = company;
    if (allowed) {
      if (company && company !== 'ALL') {
        if (!allowed.includes(company)) {
          return res.status(403).json({ error: 'Unauthorized company access' });
        }
      }
    }

    const employees = db.getEmployees(targetCompany).filter(e => {
      if (allowed) return allowed.includes(e.company);
      return true;
    });

    let runs = db.getPayrollRuns();
    if (targetCompany && targetCompany !== 'ALL' && targetCompany !== 'GROUP' && targetCompany !== 'COMBINED') {
      runs = runs.filter(r => r.id.endsWith(`-${targetCompany}`));
    } else if (allowed) {
      runs = runs.filter(r => allowed.some(comp => r.id.endsWith(`-${comp}`)) || r.id === `RUN-${r.month}`);
    }
    
    // find latest closed run
    const closedRuns = runs.filter(r => r.status === 'CLOSED');
    const latestClosed = closedRuns.length > 0 
      ? closedRuns.sort((a,b) => b.month.localeCompare(a.month))[0]
      : undefined;

    const draftRuns = runs.filter(r => r.status === 'DRAFT');

    res.json({
      totalEmployees: employees.length,
      runsProcessed: runs.length,
      latestClosed,
      currentDraft: draftRuns[0] || null,
      departmentBreakdown: employees.reduce((acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    });
  });

  // Department management APIs
  app.get('/api/departments', (req, res) => {
    try {
      res.json(db.getDepartments());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/departments', (req, res) => {
    try {
      const { department } = req.body;
      if (!department || typeof department !== 'string') {
        return res.status(400).json({ error: 'Department name is required' });
      }
      const list = db.addDepartment(department);
      res.json({ success: true, departments: list });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Company Master Module APIs
  app.get('/api/companies', (req, res) => {
    try {
      const allowed = getAllowedCompanies(req);
      let list = db.getCompanies();
      if (allowed) {
        list = list.filter(c => allowed.includes(c.id));
      }
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/companies', async (req, res) => {
    try {
      const operatorRole = getOperatorRole(req);
      if (operatorRole !== 'SUPER_HR') {
        return res.status(403).json({ error: 'Access Denied: Only Super Admin can register new companies.' });
      }
      
      const { pin, ...newCompany } = req.body;
      if (!(await verifyPin(pin))) {
        return res.status(403).json({ error: 'PIN_INVALID', message: 'Invalid or missing Super Admin Security PIN.' });
      }
      
      if (!newCompany.id || !newCompany.name) {
        return res.status(400).json({ error: 'Company Code and Company Name are required.' });
      }

      const created = db.addCompany(newCompany);
      res.json({ success: true, company: created });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/companies/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { pin, ...updateData } = req.body;
      
      if (!(await verifyPin(pin))) {
        return res.status(403).json({ error: 'PIN_INVALID', message: 'Invalid or missing Super Admin Security PIN.' });
      }

      const updated = db.updateCompany(id, updateData);
      if (!updated) {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.json({ success: true, company: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Salary Revisions Module APIs
  app.get('/api/revisions', (req, res) => {
    try {
      const { employee_code } = req.query as { employee_code?: string };
      res.json(db.getSalaryRevisions(employee_code));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/revisions', (req, res) => {
    try {
      const { 
        employee_code, 
        old_salary, 
        new_salary, 
        effective_date, 
        reason, 
        approved_by,
        hra,
        conveyance_allowance,
        edu_allowance,
        medical_allowance,
        special_allowance,
        da,
        remarks,
        increment_amount,
        old_structure,
        new_structure
      } = req.body;
      
      if (!employee_code || !new_salary || !effective_date) {
        return res.status(400).json({ error: 'Employee code, new salary, and effective date are required' });
      }

      const emp = db.getEmployeeById(employee_code);

      // Note: Salary revisions are NOT blocked by payroll lock.
      // Payroll lock only prevents changes to attendance/payslips for that month.
      // Salary/increment changes take effect from the effective date onward.

      const rev = db.addSalaryRevision({
        employee_code,
        old_salary: Number(old_salary),
        new_salary: Number(new_salary),
        effective_date,
        reason: reason || '',
        approved_by: approved_by || 'Admin',
        hra: hra !== undefined ? Number(hra) : undefined,
        conveyance_allowance: conveyance_allowance !== undefined ? Number(conveyance_allowance) : undefined,
        edu_allowance: edu_allowance !== undefined ? Number(edu_allowance) : undefined,
        medical_allowance: medical_allowance !== undefined ? Number(medical_allowance) : undefined,
        special_allowance: special_allowance !== undefined ? Number(special_allowance) : undefined,
        da: da !== undefined ? Number(da) : undefined,
        remarks: remarks || '',
        increment_amount: increment_amount !== undefined ? Number(increment_amount) : undefined,
        old_structure: typeof old_structure === 'object' ? JSON.stringify(old_structure) : old_structure,
        new_structure: typeof new_structure === 'object' ? JSON.stringify(new_structure) : new_structure
      });

      db.logAudit('Salary Changed', `Salary structures changed for ${emp?.name || employee_code} to ₹${Number(new_salary).toLocaleString('en-IN')}`, getOperator(req));
      res.json({ success: true, revision: rev });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/revisions/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.deleteSalaryRevision(id);
      db.logAudit('Revision Deleted', `Salary revision ${id} deleted`, getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/revisions/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { old_salary, new_salary, effective_date, reason, remarks } = req.body;
      db.updateSalaryRevision(id, { old_salary, new_salary, effective_date, reason, remarks });
      db.logAudit('Revision Updated', `Salary revision ${id} updated`, getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Employee management with company filter
  app.get('/api/employees', (req, res) => {
    const { company } = req.query as { company?: string };
    const allowed = getAllowedCompanies(req);
    
    if (allowed) {
      if (company && company !== 'ALL') {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getEmployees(company));
      } else {
        const allEmps = db.getEmployees();
        return res.json(allEmps.filter(e => allowed.includes(e.company)));
      }
    }
    res.json(db.getEmployees(company));
  });

  // Get all HR/Admin Users API
  app.get('/api/hr/users', (req, res) => {
    try {
      const users = db.getUsers().map(({ password: _pw, ...safe }: any) => safe);
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // HR/Admin Login API
  app.post('/api/hr/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const isSecEnabled = (await db.getSystemSetting('production_security_enabled', '0')) === '1';

      if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
      }
      if (isSecEnabled && !password) {
        return res.status(400).json({ success: false, error: 'Password is required when production security is enabled.' });
      }

      let users = db.getUsers();
      let user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

      // If user is not found, automatically create default users
      const defaultUsersMap: Record<string, any> = {
        'vishnu': {
          id: 'USR001',
          username: 'vishnu',
          name: 'Vishnu Arrawatia',
          role: 'SUPER_HR' as const,
          title: 'Super Admin',
          company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'],
          password: 'Varrawatia',
          disabled: false
        },
        'varrawatia': {
          id: 'USR011',
          username: 'varrawatia',
          name: 'Varrawatia (Admin)',
          role: 'SUPER_HR' as const,
          title: 'Super Admin',
          company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'],
          password: 'Varrawatia',
          disabled: false
        },
        'vijay': {
          id: 'USR002',
          username: 'vijay',
          name: 'Mr. V. K. Saraf (MD)',
          role: 'MANAGEMENT' as const,
          title: 'Managing Director',
          company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'],
          password: 'VKS',
          disabled: false
        },
        'vks': {
          id: 'USR012',
          username: 'vks',
          name: 'VKS (MD)',
          role: 'MANAGEMENT' as const,
          title: 'Managing Director',
          company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'],
          password: 'VKS',
          disabled: false
        },
        'vijendra': {
          id: 'USR003',
          username: 'vijendra',
          name: 'Vijendra',
          role: 'COMPANY_HR' as const,
          title: 'HR Officer (SVN Unit I)',
          company_rights: ['SVN-1'],
          password: 'vijendra',
          disabled: false
        },
        'manisha_s': {
          id: 'USR004',
          username: 'manisha_s',
          name: 'Manisha Sapate',
          role: 'COMPANY_HR' as const,
          title: 'HR Officer (SVN Unit II)',
          company_rights: ['SVN-II'],
          password: 'manisha_s',
          disabled: false
        },
        'manisha': {
          id: 'USR005',
          username: 'manisha',
          name: 'Manisha',
          role: 'COMPANY_HR' as const,
          title: 'HR Officer (Sakar Unit I)',
          company_rights: ['Sakar-I'],
          password: 'manisha',
          disabled: false
        },
        'indraprakash': {
          id: 'USR006',
          username: 'indraprakash',
          name: 'Indraprakash',
          role: 'COMPANY_HR' as const,
          title: 'HR Officer (Sakar Unit III)',
          company_rights: ['Sakar-III'],
          password: 'indraprakash',
          disabled: false
        },
        'nilesh': {
          id: 'USR007',
          username: 'nilesh',
          name: 'Nilesh',
          role: 'COMPANY_HR' as const,
          title: 'HR Officer (Flare)',
          company_rights: ['Flare-1'],
          password: 'nilesh',
          disabled: false
        },
        'pinki': {
          id: 'USR008',
          username: 'pinki',
          name: 'Pinki',
          role: 'COMPANY_HR' as const,
          title: 'HR Officer (Zenivo)',
          company_rights: ['Zenivo-1'],
          password: 'pinki',
          disabled: false
        },
        'audit': {
          id: 'USR009',
          username: 'audit',
          name: 'Auditor',
          role: 'AUDITOR' as const,
          title: 'Statutory Auditor',
          company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'],
          password: 'audit',
          disabled: false
        }
      };

      const lowerUser = username.trim().toLowerCase();
      if (!user && defaultUsersMap[lowerUser]) {
        db.syncUser(defaultUsersMap[lowerUser]);
        users = db.getUsers();
        user = users.find(u => u.username.toLowerCase() === lowerUser);
      }

      const userFound = user ? 'Yes' : 'No';
      const passwordMatch = user && user.password === password ? 'Yes' : 'No';
      const roleLoaded = user && user.role ? 'Yes' : 'No';

      // Temporary diagnostic log as requested
      console.log(`[Diagnostic Log] Selected User: ${username}, User Found: ${userFound}, Password Match: ${passwordMatch}, Role Loaded: ${roleLoaded}`);

      if (!user) {
        return res.status(404).json({ success: false, error: 'User Not Found' });
      }
      if (user.disabled) {
        return res.status(403).json({ success: false, error: 'User account is disabled' });
      }
      if (!user.role) {
        return res.status(400).json({ success: false, error: 'Role Missing' });
      }

      if (isSecEnabled) {
        if (user.password !== password) {
          return res.status(401).json({ success: false, error: 'Password Incorrect' });
        }
      }
      
      // Log login event to Audit Logs
      db.logAudit('User Login', `User ${user.name} (${user.username}) successfully logged in`, user.name);

      const isDefaultPin = user.role === 'SUPER_HR' && (await db.getSystemSetting('pin_changed_from_default', '0')) === '0';

      const { password: _pw, ...safeUser } = user as any;
      res.json({ success: true, user: safeUser, forcePinChange: isDefaultPin });
    } catch (e: any) {
      console.error('[Login API Error]', e);
      res.status(500).json({ success: false, error: 'Database Error' });
    }
  });

  // API to change Super Admin Security PIN
  app.post('/api/settings/change-pin', async (req, res) => {
    try {
      const { currentPin, newPin } = req.body;
      const operatorRole = getOperatorRole(req);
      if (operatorRole !== 'SUPER_HR') {
        return res.status(403).json({ error: 'Access Denied: Only Super Admin can change the Security PIN.' });
      }

      if (!currentPin || !newPin) {
        return res.status(400).json({ error: 'Current PIN and New PIN are required.' });
      }

      const isCurrentValid = await verifyPin(currentPin);
      if (!isCurrentValid) {
        return res.status(403).json({ error: 'CURRENT_PIN_INVALID', message: 'The current Security PIN is incorrect.' });
      }

      if (String(newPin).length < 4) {
        return res.status(400).json({ error: 'PIN_TOO_SHORT', message: 'New Security PIN must be at least 4 digits.' });
      }

      const newHash = crypto.createHash('sha256').update(String(newPin)).digest('hex');
      await db.setSystemSetting('super_admin_pin', newHash);
      await db.setSystemSetting('pin_changed_from_default', '1');

      db.logAudit('Security PIN Changed', 'Super Admin Security PIN updated successfully', getOperator(req));
      res.json({ success: true, message: 'Security PIN updated successfully.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get festival scrolling message settings
  app.get('/api/festival-message', async (req, res) => {
    try {
      const defaultValue = JSON.stringify({
        message: 'Wishing all our HR Teams and Employees of Sakar I, III, SVN I, II a very Happy Celebration! 🇮🇳✨ Work hard, celebrate together.',
        isActive: true,
        displayDuration: 15
      });
      const val = await db.getSystemSetting('festival_message', defaultValue);
      let parsed = JSON.parse(val);
      if (!parsed.message || parsed.message.trim().length === 0) {
        parsed.message = 'Wishing all our HR Teams and Employees of Sakar I, III, SVN I, II a very Happy Celebration! 🇮🇳✨ Work hard, celebrate together.';
        parsed.isActive = true;
      }
      // Force minimum 15 seconds
      parsed.displayDuration = Math.max(15, Number(parsed.displayDuration || 15));
      res.json(parsed);
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to fetch festival message settings.' });
    }
  });

  // Save festival scrolling message settings
  app.post('/api/festival-message', async (req, res) => {
    try {
      const { message, isActive, displayDuration } = req.body;
      const payload = {
        message: message || '',
        isActive: !!isActive,
        displayDuration: Math.max(15, Number(displayDuration || 15)),
        updatedAt: new Date().toISOString()
      };
      await db.setSystemSetting('festival_message', JSON.stringify(payload));
      db.logAudit('Festival Message Updated', `Message: "${message}", Active: ${isActive}`, getOperator(req));
      res.json({ success: true, ...payload });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to save festival message settings: ' + e.message });
    }
  });

  // Get security mode setting
  app.get('/api/settings/security-mode', async (req, res) => {
    try {
      const value = await db.getSystemSetting('production_security_enabled', '0');
      res.json({ productionSecurityEnabled: value === '1' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Set security mode setting
  app.post('/api/settings/security-mode', async (req, res) => {
    try {
      const { enabled } = req.body;
      const value = enabled ? '1' : '0';
      await db.setSystemSetting('production_security_enabled', value);
      
      // Also log audit
      const statusText = enabled ? 'ENABLED' : 'DISABLED';
      db.logAudit('Security Change', `Production security was ${statusText}`, 'System Settings');
      
      res.json({ success: true, productionSecurityEnabled: enabled });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // HR/Admin Logout API
  app.post('/api/hr/logout', (req, res) => {
    try {
      const { username, name } = req.body;
      if (username) {
        db.logAudit('User Logout', `User ${name || username} logged out`, name || username);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Create/Update HR/Admin User API
  app.post('/api/hr/users', (req, res) => {
    try {
      const user = req.body;
      if (!user.username || !user.name || !user.role) {
        return res.status(400).json({ error: 'Username, Name, and Role are required' });
      }

      const users = db.getUsers();
      
      // Generate ID if new
      if (!user.id) {
        // Ensure username is unique
        const exists = users.some(u => u.username.toLowerCase() === user.username.toLowerCase());
        if (exists) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        
        let maxNum = 8; // default users are 8
        users.forEach(u => {
          const match = u.id.match(/USR(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        });
        const nextNum = String(maxNum + 1).padStart(3, '0');
        user.id = `USR${nextNum}`;
        
        db.syncUser(user);
        db.logAudit('User Created', `Created user account for ${user.name} (${user.username}) as ${user.role}`, getOperator(req));
      } else {
        // For editing, ensure username is not taken by another user
        const exists = users.some(u => u.username.toLowerCase() === user.username.toLowerCase() && u.id !== user.id);
        if (exists) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        
        db.syncUser(user);
        db.logAudit('User Updated', `Updated user account settings for ${user.name} (${user.username})`, getOperator(req));
      }

      const { password: _pw3, ...safeUserResp } = user as any;
      res.json({ success: true, user: safeUserResp });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete HR/Admin User API
  app.delete('/api/hr/users/:id', (req, res) => {
    try {
      const { id } = req.params;
      const users = db.getUsers();
      const user = users.find(u => u.id === id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      db.deleteUser(id);
      db.logAudit('User Deleted', `Deleted user account for ${user.name} (${user.username})`, getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get all HODs API
  app.get('/api/hods', (req, res) => {
    try {
      res.json(db.getHods());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create/Update HOD API
  app.post('/api/hods', (req, res) => {
    try {
      let hod = req.body;
      if (!hod.name || !hod.department || !hod.company) {
        return res.status(400).json({ error: 'Name, Department, and Company are required' });
      }

      const hods = db.getHods();
      
      // Generate ID if new
      if (!hod.id) {
        let maxNum = 4; // default HODs are 4
        hods.forEach(h => {
          const match = h.id.match(/HOD(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        });
        const nextNum = String(maxNum + 1).padStart(3, '0');
        hod = { ...hod, id: `HOD${nextNum}` };
        
        db.syncHod(hod);
        db.logAudit('HOD Created', `Created HOD master entry for ${hod.name} (${hod.department})`, getOperator(req));
      } else {
        db.syncHod(hod);
        db.logAudit('HOD Updated', `Updated HOD master entry for ${hod.name}`, getOperator(req));
      }

      res.json({ success: true, hod });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete HOD API
  app.delete('/api/hods/:id', (req, res) => {
    try {
      const { id } = req.params;
      const hods = db.getHods();
      const hod = hods.find(h => h.id === id);
      if (!hod) {
        return res.status(404).json({ error: 'HOD not found' });
      }
      
      db.deleteHod(id);
      db.logAudit('HOD Deleted', `Deleted HOD master entry for ${hod.name} (${hod.department})`, getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get all Shifts API
  app.get('/api/shifts', (req, res) => {
    try {
      res.json(db.getShifts());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create/Update Shift API
  app.post('/api/shifts', (req, res) => {
    try {
      const shift = req.body;
      if (!shift.code || !shift.name || !shift.start_time || !shift.end_time) {
        return res.status(400).json({ error: 'Shift Code, Shift Name, Start Time, and End Time are required' });
      }

      db.syncShift(shift);
      db.logAudit('Shift Synced', `Created/Updated shift: ${shift.name} (${shift.code})`, getOperator(req));
      res.json({ success: true, shift });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete Shift API
  app.delete('/api/shifts/:code', (req, res) => {
    try {
      const { code } = req.params;
      const shifts = db.getShifts();
      const shift = shifts.find(s => s.code.toUpperCase() === code.toUpperCase());
      if (!shift) {
        return res.status(404).json({ error: 'Shift not found' });
      }

      db.deleteShift(code);
      db.logAudit('Shift Deleted', `Deleted shift: ${shift.name} (${shift.code})`, getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Employee Login API
  app.post('/api/employee/login', (req, res) => {
    try {
      const { employeeId, password } = req.body;
      if (!employeeId) {
        return res.status(400).json({ success: false, error: 'Employee ID is required' });
      }
      const employees = db.getEmployees();
      const employee = employees.find(e => e.id.toLowerCase() === employeeId.toLowerCase());
      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const currentPassword = employee.password || employee.id;
      const enteredPassword = password ? password.trim() : '';

      const isFirstTime = !employee.password || employee.password.toLowerCase() === employee.id.toLowerCase();
      let matches = false;

      if (isFirstTime) {
        matches = enteredPassword.toLowerCase() === currentPassword.toLowerCase();
      } else {
        matches = enteredPassword === currentPassword;
      }

      if (!matches) {
        return res.status(401).json({ success: false, error: 'Incorrect Password. Note: First-time password is your Employee Code (e.g. EMP001).' });
      }

      const needsChange = !!employee.needs_password_change || isFirstTime;
      const { password: _pw, ...safeEmployee } = employee as any;
      res.json({ success: true, employee: safeEmployee, needsPasswordChange: needsChange });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Employee Change Password API
  app.post('/api/employee/change-password', (req, res) => {
    try {
      const { employeeId, oldPassword, newPassword } = req.body;
      if (!employeeId || !oldPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
      }
      const employees = db.getEmployees();
      const employee = employees.find(e => e.id.toLowerCase() === employeeId.toLowerCase());
      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const currentPassword = employee.password || employee.id;
      const isFirstTime = !employee.password || employee.password.toLowerCase() === employee.id.toLowerCase();
      let matches = false;

      if (isFirstTime) {
        matches = oldPassword.toLowerCase() === currentPassword.toLowerCase();
      } else {
        matches = oldPassword === currentPassword;
      }

      if (!matches) {
        return res.status(401).json({ success: false, error: 'Incorrect old password' });
      }
      
      const updated = db.updateEmployee(employee.id, { 
        password: newPassword,
        needs_password_change: false
      });
      const { password: _pw2, ...safeUpdated } = updated as any;
      res.json({ success: true, employee: safeUpdated });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin Reset Employee Password API
  app.post('/api/admin/reset-employee-password', (req, res) => {
    try {
      const { employeeId, newPassword } = req.body;
      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required' });
      }
      
      const employees = db.getEmployees();
      const employee = employees.find(e => e.id.toLowerCase() === employeeId.toLowerCase());
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      const isResettingToDefault = newPassword.toLowerCase() === employee.id.toLowerCase();
      const updated = db.updateEmployee(employee.id, { 
        password: newPassword,
        needs_password_change: isResettingToDefault ? true : false
      });
      
      db.logAudit('Password Reset', `Admin reset password for Employee ${employee.name} (${employee.id})`, getOperator(req));
      res.json({ success: true, employee: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/employees', (req, res) => {
    try {
      const emp: Employee = req.body;
      if (!emp.name || !emp.designation || !emp.joining_date) {
        return res.status(400).json({ error: 'Name, designation, and joining date are required fields' });
      }
      const saved = db.insertEmployee(emp);
      db.logAudit('Employee Created', `Created employee ${saved.name} (${saved.id}) in ${saved.company}`, getOperator(req));
      res.json({ success: true, employee: saved });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/employees/:id', (req, res) => {
    try {
      const { id } = req.params;
      const operatorRole = getOperatorRole(req);
      const operatorName = getOperator(req);
      
      // Enforce: Employee Code is editable ONLY by Super Admin (SUPER_HR)
      if (req.body.id && req.body.id.trim() !== id) {
        if (operatorRole !== 'SUPER_HR') {
          return res.status(403).json({ error: 'Access Denied: Only Super Admin (SUPER_HR) is authorized to modify Employee Codes.' });
        }
      }

      // Fetch current state before updating
      const oldEmp = db.getEmployeeById(id);
      if (!oldEmp) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      const updated = db.updateEmployee(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      // Log specific field changes
      const fieldsToTrack: (keyof Employee)[] = [
        'company', 'id', 'name', 'department', 'designation', 'joining_date', 
        'exit_date', 'email', 'phone', 'pan', 'aadhaar_number', 'uan', 'esic_number',
        'bank_name', 'bank_account', 'ifsc', 'cost_center', 'employee_category',
        'shift_timing', 'base_salary', 'hra', 'da', 'special_allowance', 
        'edu_allowance', 'medical_allowance', 'conveyance_allowance'
      ];

      fieldsToTrack.forEach(field => {
        const oldValue = oldEmp[field];
        const newValue = req.body[field];
        
        // Normalize values to strings to compare safely
        const oldStr = oldValue !== undefined && oldValue !== null ? String(oldValue) : '';
        const newStr = newValue !== undefined && newValue !== null ? String(newValue) : '';
        
        if (newValue !== undefined && oldStr !== newStr) {
          db.logAudit(
            'EMPLOYEE_FIELD_EDIT',
            `Employee:${updated.id} | Field:${field} | Old:${oldStr} | New:${newStr}`,
            operatorName
          );
        }
      });
      
      if (req.body.id && req.body.id.trim() !== id) {
        db.logAudit('Employee Code Changed', `Modified Employee Code of ${updated.name} from "${id}" to "${updated.id}"`, operatorName);
      } else {
        db.logAudit('Employee Edited', `Updated details for ${updated.name} (${updated.id})`, operatorName);
      }
      
      res.json({ success: true, employee: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/employees/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const pin = req.headers['x-security-pin'] || req.query.pin || req.body.pin;
      const force = req.query.force === 'true' || req.body.force === true;
      
      if (!(await verifyPin(pin))) {
        return res.status(403).json({ error: 'PIN_INVALID', message: 'Invalid or missing Super Admin Security PIN.' });
      }

      const emp = db.getEmployeeById(id);
      if (!emp) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      const name = emp.name;
      const outcome = db.deleteEmployee(id, force);
      
      if (outcome === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      if (outcome === 'INACTIVATED') {
        db.logAudit('Employee Deactivated', `Soft-deleted employee ${name} (${id}) due to existing payroll/ledger history. Status set to SEPARATED.`, getOperator(req));
        res.json({ success: true, outcome: 'INACTIVATED', message: 'Employee has active payroll history. Profile soft-deleted and status updated to SEPARATED.' });
      } else {
        db.logAudit('Employee Purged', `Permanently purged test/duplicate employee ${name} (${id}) from database.`, getOperator(req));
        res.json({ success: true, outcome: 'PURGED', message: 'Employee profile permanently purged from all database tables.' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Loan management APIs
  app.get('/api/loans/policy', (req, res) => {
    res.json(db.getLoanPolicy());
  });

  app.post('/api/loans/policy', (req, res) => {
    try {
      db.updateLoanPolicy(req.body);
      res.json({ success: true, policy: db.getLoanPolicy() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/loans', (req, res) => {
    const { employee_id } = req.query as { employee_id?: string };
    const allowed = getAllowedCompanies(req);
    const loans = db.getLoans(employee_id);
    
    const enrichedLoans = loans.map(l => {
      const emp = db.getEmployeeById(l.employee_id);
      const slips = db.getPayslipsByEmployee(l.employee_id);
      const slips_repaid = slips.reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
      const settlements = Array.isArray(l.settlements) ? l.settlements : [];
      const stl_repaid = settlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);
      const total_repaid = slips_repaid + stl_repaid;

      const opening_balance = l.opening_balance !== undefined ? Number(l.opening_balance) : Number(l.amount || 0);
      const additional_total = (l.additional_loans || []).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const total_borrowed = opening_balance + additional_total;
      const outstanding_balance = Math.max(0, total_borrowed - total_repaid);

      let currentStatus = l.status || 'ACTIVE';
      if (outstanding_balance <= 0 && currentStatus === 'ACTIVE') {
        currentStatus = 'CLOSED';
        db.updateLoanStatus(l.id, 'CLOSED');
      }

      return {
        ...l,
        loan_number: l.loan_number || `LN-${l.id.substring(0, 8)}`,
        department: l.department || (emp ? emp.department : ''),
        company: l.company || (emp ? emp.company : ''),
        unit: l.unit || (emp ? emp.company : ''),
        loan_type: l.loan_type || 'Employee Loan',
        opening_balance,
        opening_date: l.opening_date || '2026-04-01',
        employee_code: l.employee_code || l.employee_id,
        total_amount: total_borrowed,
        disbursal_month: l.month,
        total_repaid,
        outstanding_balance,
        status: currentStatus,
        skipped_months: Array.isArray(l.skipped_months) ? l.skipped_months : [],
        additional_loans: Array.isArray(l.additional_loans) ? l.additional_loans : [],
        settlements: settlements,
        audit_trail: Array.isArray(l.audit_trail) ? l.audit_trail : []
      };
    });

    if (allowed) {
      const emps = db.getEmployees();
      const allowedLoanIds = new Set(emps.filter(e => allowed.includes(e.company)).map(e => e.id));
      return res.json(enrichedLoans.filter(l => allowedLoanIds.has(l.employee_id)));
    }
    res.json(enrichedLoans);
  });

  app.post('/api/loans', async (req, res) => {
    try {
      const loan = req.body;
      if (!loan.employee_id || loan.amount === undefined || !loan.monthly_deduction || !loan.month) {
        return res.status(400).json({ error: 'Employee ID, amount, monthly deduction, and month are required' });
      }
      const saved = db.addLoan(loan);
      await db.forcePersistToSupabase();
      res.json({ success: true, loan: saved });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/loans/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (status !== 'ACTIVE' && status !== 'CLOSED') {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const success = db.updateLoanStatus(id, status);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/loans/:id/skip-emi', (req, res) => {
    try {
      const { id } = req.params;
      const { month, action, reason } = req.body;
      if (!month || (action !== 'SKIP' && action !== 'UNSKIP')) {
        return res.status(400).json({ error: 'Month and valid action (SKIP/UNSKIP) are required' });
      }
      const updated = db.skipLoanEmi(id, month, action, reason);
      if (!updated) {
        return res.status(404).json({ error: 'Loan record not found' });
      }
      res.json({ success: true, loan: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/loans/:id/add-amount', (req, res) => {
    try {
      const { id } = req.params;
      const { amount, month, reason } = req.body;
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valid positive loan amount is required' });
      }
      const updated = db.addLoanAmount(id, Number(amount), month || '2026-04', reason);
      if (!updated) {
        return res.status(404).json({ error: 'Loan record not found' });
      }
      res.json({ success: true, loan: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/loans/:id/details', (req, res) => {
    try {
      const { id } = req.params;
      const updated = db.updateLoanDetails(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Loan record not found' });
      }
      res.json({ success: true, loan: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/loans/:id/settlement', (req, res) => {
    try {
      const { id } = req.params;
      const { amount, recovery_type, payment_mode, reference_number, approved_by, remarks, date } = req.body;
      if (!amount || Number(amount) <= 0 || !recovery_type || !payment_mode) {
        return res.status(400).json({ error: 'Valid amount, recovery_type, and payment_mode are required' });
      }
      const updated = db.settleLoan(id, {
        amount: Number(amount),
        recovery_type,
        payment_mode,
        reference_number,
        approved_by,
        remarks,
        date
      });
      if (!updated) {
        return res.status(404).json({ error: 'Loan record not found' });
      }
      res.json({ success: true, loan: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Attendance management (Month & Company wise)
  app.get('/api/attendance/employee/:employeeId', (req, res) => {
    const { employeeId } = req.params;
    const records = db.getEmployeeAttendance(employeeId);
    res.json(records);
  });

  // Manual Attendance Logging Endpoint (Hindi request: option for manual attendance input)
  app.post('/api/attendance/manual', async (req, res) => {
    try {
      const { employee_id, date, status, hours, reason } = req.body;
      if (!employee_id || !date || !status) {
        return res.status(400).json({ error: 'Employee ID, date, and status are required' });
      }

      const emp = db.getEmployeeById(employee_id);
      if (!emp) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Verify if payroll month is locked
      const month = date.substring(0, 7); // YYYY-MM
      if (db.isPayrollLocked(month, emp.company)) {
        return res.status(400).json({ error: 'Payroll month is locked. Manual adjustments are disabled.' });
      }

      // Retrieve or provision matching attendance coordinates for that month
      const records = db.getEmployeeAttendance(employee_id);
      let record = records.find(r => r.month === month);

      if (!record) {
        const daysInMonth = new Date(
          parseInt(month.split('-')[0]),
          parseInt(month.split('-')[1]),
          0
        ).getDate();
        record = {
          id: `ATT-${employee_id}-${month}`,
          employee_id,
          month,
          total_days: daysInMonth,
          working_days: daysInMonth,
          lop_days: 0,
          overtime_hours: 0,
          present: daysInMonth - 4,
          absent: 0,
          weekly_off: 4,
          paid_holiday: 0,
          leave: 0,
          lwp: 0,
          ot_hours: 0
        };
      }

      // Perform updates
      if (status === 'PRESENT') {
        record.present = (record.present || 0) + 1;
        if (record.absent && record.absent > 0) {
          record.absent = record.absent - 1;
        } else if (record.lwp && record.lwp > 0) {
          record.lwp = record.lwp - 1;
        }
      } else if (status === 'LWP' || status === 'ABSENT') {
        if (status === 'LWP') {
          record.lwp = (record.lwp || 0) + 1;
        } else {
          record.absent = (record.absent || 0) + 1;
        }
        if (record.present && record.present > 0) {
          record.present = record.present - 1;
        }
      } else if (status === 'LEAVE') {
        record.leave = (record.leave || 0) + 1;
        if (record.present && record.present > 0) {
          record.present = record.present - 1;
        }
      }

      // Process overtime hours
      const numHours = parseFloat(hours) || 8;
      if (numHours > 8) {
        const ot = numHours - 8;
        record.ot_hours = (record.ot_hours || 0) + ot;
        record.overtime_hours = (record.overtime_hours || 0) + ot;
      }

      // Compute aggregates
      const pres = record.present || 0;
      const abs = record.absent || 0;
      const woff = record.weekly_off || 0;
      const phol = record.paid_holiday || 0;
      const lve = record.leave || 0;
      const lw = record.lwp || 0;

      record.total_days = pres + abs + woff + phol + lve + lw;
      record.lop_days = abs + lw;
      record.working_days = pres + woff + phol + lve;

      // Save to database
      db.saveAttendance([record]);

      // Add security audit trail
      db.logAudit(
        'Manual Attendance Logs',
        `Employee ${emp.name} logged manual card for ${date} as ${status}. Hours: ${hours}. Reason: ${reason}`,
        emp.name
      );

      res.json({ success: true, message: 'Manual attendance log saved', record });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/attendance', (req, res) => {
    const { month, company } = req.query as { month?: string, company?: string };
    if (!month) {
      return res.status(400).json({ error: 'Month (YYYY-MM) query parameter is required' });
    }
    const allowed = getAllowedCompanies(req);
    let targetCompany = company;
    if (allowed) {
      if (company && company !== 'ALL') {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
      } else {
        targetCompany = allowed[0];
      }
    }
    
    // Ensure every single employee in that company has an attendance row registered
    const employees = db.getEmployees(targetCompany);
    const existing = db.getAttendance(month, targetCompany);
    
    const missing: Attendance[] = [];
    const yearMonth = month;
    const daysInMonth = new Date(
      parseInt(yearMonth.split('-')[0]),
      parseInt(yearMonth.split('-')[1]),
      0
    ).getDate();

    for (const emp of employees) {
      const entry = existing.find(a => a.employee_id === emp.id);
      if (!entry) {
        missing.push({
          id: `ATT-${emp.id}-${month}`,
          employee_id: emp.id,
          month: month,
          total_days: daysInMonth,
          working_days: daysInMonth,
          lop_days: 0,
          overtime_hours: 0
        });
      }
    }

    if (missing.length > 0) {
      db.saveAttendance(missing);
    }

    res.json(db.getAttendance(month, targetCompany));
  });

  app.post('/api/attendance/bulk', (req, res) => {
    try {
      const { records } = req.body as { records: Attendance[] };
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'No attendance records provided' });
      }

      const first = records[0];
      const emp = db.getEmployeeById(first.employee_id);
      const company = emp ? emp.company : undefined;

      if (db.isPayrollLocked(first.month, company)) {
        return res.status(400).json({ error: 'Payroll month is locked. No attendance changes are allowed.' });
      }

      db.saveAttendance(records);
      db.logAudit('Attendance Modified', `Adjusted attendance coordinates for ${records.length} staff members for month ${first.month} (${company || 'ALL'})`, getOperator(req));
      res.json({ success: true, count: records.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/compoff', (req, res) => {
    const { company } = req.query as { company?: string };
    const allowed = getAllowedCompanies(req);
    
    if (allowed) {
      if (company && company !== 'ALL') {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getCompOffRequests().filter(c => c.company === company));
      } else {
        const allCompoffs = db.getCompOffRequests();
        return res.json(allCompoffs.filter(c => allowed.includes(c.company)));
      }
    }
    
    if (company && company !== 'ALL') {
      return res.json(db.getCompOffRequests().filter(c => c.company === company));
    }
    res.json(db.getCompOffRequests());
  });

  // Leave application endpoints
  app.get('/api/leaves', (req, res) => {
    const { company } = req.query as { company?: string };
    const allowed = getAllowedCompanies(req);
    
    if (allowed) {
      if (company && company !== 'ALL') {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getLeaveApplications(company));
      } else {
        const allLeaves = db.getLeaveApplications();
        return res.json(allLeaves.filter(l => allowed.includes(l.company)));
      }
    }
    res.json(db.getLeaveApplications(company));
  });

  app.post('/api/leaves', async (req, res) => {
    try {
      const appReg = db.addLeaveApplication(req.body);
      await db.persistDataSync();
      res.json({ success: true, application: appReg });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/leaves/status', async (req, res) => {
    const { id, status } = req.body;
    const success = db.updateLeaveStatus(id, status);
    if (!success) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    await db.persistDataSync();
    res.json({ success: true });
  });

  // Leave approval workflow endpoint
  app.post('/api/leaves/workflow', async (req, res) => {
    try {
      const { id, actorRole, action, actorId, override } = req.body;
      let success = db.updateLeaveWorkflowStatus(id, actorRole, action, actorId, override);
      if (!success) {
        // Leave not found in memory — reload from Supabase and retry
        await db.reloadFromSupabase();
        success = db.updateLeaveWorkflowStatus(id, actorRole, action, actorId, override);
      }
      if (!success) {
        return res.status(400).json({ error: 'Failed to update leave workflow status or request not found.' });
      }
      await db.persistDataSync();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Attendance Corrections / Miss Punch endpoints
  app.get('/api/attendance/corrections', (req, res) => {
    try {
      const { company, employee_id } = req.query as { company?: string; employee_id?: string };
      const allowed = getAllowedCompanies(req);
      let corrections = db.getAttendanceCorrections();

      if (employee_id) {
        corrections = corrections.filter(c => c.employee_id === employee_id);
      } else if (allowed) {
        if (company && company !== 'ALL') {
          if (!allowed.includes(company)) {
            return res.json([]);
          }
          corrections = corrections.filter(c => c.company === company);
        } else {
          corrections = corrections.filter(c => allowed.includes(c.company));
        }
      } else if (company && company !== 'ALL') {
        corrections = corrections.filter(c => c.company === company);
      }

      res.json(corrections);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/attendance/corrections', async (req, res) => {
    try {
      const correction = db.addAttendanceCorrection(req.body);
      await db.persistDataSync();
      res.json({ success: true, correction });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/attendance/corrections/workflow', async (req, res) => {
    try {
      const { id, actorRole, action, actorId, override } = req.body;
      let success = db.updateAttendanceCorrectionWorkflowStatus(id, actorRole, action, actorId, override);
      if (!success) {
        // Correction not found — reload from Supabase and retry
        await db.reloadFromSupabase();
        success = db.updateAttendanceCorrectionWorkflowStatus(id, actorRole, action, actorId, override);
      }
      if (!success) {
        return res.status(400).json({ error: 'Failed to update attendance correction workflow status.' });
      }
      await db.persistDataSync();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Comp-off Ledger endpoints
  app.get('/api/compoff-ledger', (req, res) => {
    try {
      const { employee_id } = req.query as { employee_id?: string };
      let ledger = db.getCompOffLedger();
      if (employee_id) {
        ledger = ledger.filter(c => c.employee_id === employee_id);
      }
      res.json(ledger);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/compoff-ledger', (req, res) => {
    try {
      const entry = db.addCompOffLedgerEntry(req.body);
      res.json({ success: true, entry });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // HR Policy / Employee Handbook endpoints
  app.get('/api/policies', (req, res) => {
    try {
      res.json(db.getPolicies());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/policies', (req, res) => {
    try {
      const policy = db.addPolicy(req.body);
      res.json({ success: true, policy });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Policy Acknowledgement endpoints
  app.get('/api/policy-acknowledgements', (req, res) => {
    try {
      const { employee_id } = req.query as { employee_id?: string };
      let acks = db.getPolicyAcknowledgements();
      if (employee_id) {
        acks = acks.filter(a => a.employee_id === employee_id);
      }
      res.json(acks);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/policy-acknowledgements', (req, res) => {
    try {
      const ack = db.addPolicyAcknowledgement(req.body);
      res.json({ success: true, ack });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Full & Final (F&F)
  app.get('/api/ff', (req, res) => {
    const { company } = req.query as { company?: string };
    const allowed = getAllowedCompanies(req);
    
    if (allowed) {
      if (company && company !== 'ALL') {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getFFSettlements(company));
      } else {
        const allFF = db.getFFSettlements();
        return res.json(allFF.filter(ff => {
          // Look up employee's company
          const emp = db.getEmployees().find(e => e.id === ff.employee_id);
          return emp && allowed.includes(emp.company);
        }));
      }
    }
    res.json(db.getFFSettlements(company));
  });

  app.get('/api/ff/calculate', (req, res) => {
    const { employee_id, last_working_day } = req.query as { employee_id?: string, last_working_day?: string };
    if (!employee_id || !last_working_day) {
      return res.status(400).json({ error: 'employee_id and last_working_day parameters are required' });
    }
    try {
      const расчет = db.calculateFFSettlement(employee_id, last_working_day);
      res.json(расчет);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/ff', (req, res) => {
    try {
      db.saveFFSettlement(req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Form 16 Tax Estimation Report
  app.get('/api/form16/:employeeId', (req, res) => {
    const { employeeId } = req.params;
    try {
      const calculation = db.calculateForm16(employeeId);
      res.json(calculation);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Simulate Instant Email / WhatsApp delivery triggers for employee payslip share
  app.post('/api/delivery/send', (req, res) => {
    const { employeeId, method, media, month } = req.body;
    const emp = db.getEmployeeById(employeeId);
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const payload = method === 'EMAIL' ? emp.email : emp.phone;

    if (media === 'CONFIRMATION') {
      const slips = db.getPayslipsByEmployee(employeeId);
      const slip = slips.find(s => s.month === month);
      const amount = slip ? slip.net_salary : emp.base_salary;
      const last4 = emp.bank_account ? emp.bank_account.slice(-4) : 'XXXX';
      
      const parts = month.split('-');
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthFormatted = parts.length === 2 ? `${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}` : month;
      const payDate = (slip && slip.payment_date) ? slip.payment_date : new Date().toISOString().split('T')[0];

      const template = `Dear Employee,

Your salary for the month of ${monthFormatted} has been credited.

Net Salary:
₹ ${amount.toLocaleString('en-IN')}

Bank Account:
XXXXXX${last4}

Payment Date:
${payDate}

Regards,
HR Department`;

      console.log(`[SIMULATOR DETECTED] Dispatched Salary Payment Confirmation for ${monthFormatted} to ${emp.name} at ${payload} via ${method}`);
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: `Successfully sent Salary Payment Confirmation for ${monthFormatted} via ${method} to ${emp.name} at ${payload}!`,
        preview: template
      });
    }

    console.log(`[SIMULATOR DETECTED] Sending ${month} payslip via ${method} specifically to ${emp.name} at ${payload}`);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Successfully dispatched salary invoice slip for ${month} via automated ${method} to ${emp.name} at ${payload}!`
    });
  });

  // SQL console analyzer query entry
  app.post('/api/sql/query', (req, res) => {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing SQL statement' });
    }
    const result = db.querySQL(sql);
    res.json(result);
  });

  // Payroll processing triggers (month-wise & optional company lock)
  app.get('/api/payroll-runs', (req, res) => {
    const allowed = getAllowedCompanies(req);
    const runs = db.getPayrollRuns();
    if (allowed) {
      return res.json(runs.filter(r => allowed.some(comp => r.id.endsWith(`-${comp}`)) || r.id === `RUN-${r.month}`));
    }
    res.json(runs);
  });

  app.get('/api/payslips/month/:month', (req, res) => {
    const { month } = req.params;
    const { company } = req.query as { company?: string };
    const allowed = getAllowedCompanies(req);
    if (allowed) {
      if (company && company !== 'ALL') {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getPayslipsByMonth(month, company));
      } else {
        const slips = db.getPayslipsByMonth(month);
        const emps = db.getEmployees();
        const empCompanyMap = new Map(emps.map(e => [e.id, e.company]));
        return res.json(slips.filter(s => {
          const comp = empCompanyMap.get(s.employee_id);
          return comp && allowed.includes(comp);
        }));
      }
    }
    res.json(db.getPayslipsByMonth(month, company));
  });

  app.get('/api/payslips/employee/:id', (req, res) => {
    const { id } = req.params;
    const allowed = getAllowedCompanies(req);
    const slips = db.getPayslipsByEmployee(id);
    if (allowed) {
      const emp = db.getEmployeeById(id);
      if (!emp || !allowed.includes(emp.company)) {
        return res.json([]);
      }
    }
    res.json(slips);
  });

  app.put('/api/payslips/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { pf, esic, pt, tds, loan, advance, custom } = req.body;
      const allowed = getAllowedCompanies(req);

      const slip = db.getPayslipById(id);
      if (!slip) {
        return res.status(404).json({ error: 'Payslip not found' });
      }

      if (allowed) {
        const emp = db.getEmployeeById(slip.employee_id);
        if (!emp || !allowed.includes(emp.company)) {
          return res.status(403).json({ error: 'Forbidden to access this company' });
        }
      }

      const empCompany = db.getEmployeeById(slip.employee_id)?.company;
      if (db.isPayrollLocked(slip.month, empCompany)) {
        return res.status(400).json({ error: 'Payroll month is locked. No edits are allowed.' });
      }

      const updated = db.updatePayslipFullVariableInputs(id, req.body);

      if (!updated) {
        return res.status(500).json({ error: 'Failed to update payslip' });
      }

      db.logAudit('Payslip Deduction Adjusted', `Adjusted payroll deductions for employee ${slip.employee_name} (${slip.month})`, getOperator(req));
      res.json({ success: true, slip: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Bulk update variable inputs (for bulk grid or Excel upload)
  app.post('/api/payslips/bulk-update-inputs', (req, res) => {
    try {
      const { month, company, records } = req.body;
      if (!month || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Month and records array required' });
      }

      if (db.isPayrollLocked(month, company)) {
        return res.status(400).json({ error: 'Payroll month is locked. No edits are allowed.' });
      }

      const updatedSlips: any[] = [];
      const errors: string[] = [];

      for (const rec of records) {
        // Can identify by employee_id or emp_code
        let slipId = rec.id;
        if (!slipId && rec.employee_id) {
          slipId = `SLIP-${rec.employee_id}-${month}`;
        } else if (!slipId && rec.emp_code) {
          const emp = db.getEmployees().find(e => e.emp_code === rec.emp_code);
          if (emp) {
            slipId = `SLIP-${emp.id}-${month}`;
          } else {
            errors.push(`Invalid Employee Code: ${rec.emp_code}`);
            continue;
          }
        }

        if (slipId) {
          const resSlip = db.updatePayslipFullVariableInputs(slipId, rec);
          if (resSlip) {
            updatedSlips.push(resSlip);
          } else {
            errors.push(`Payslip not found for ID: ${slipId}`);
          }
        }
      }

      db.logAudit('Bulk Payroll Variable Inputs Updated', `Updated ${updatedSlips.length} payroll inputs for month ${month} (${company || 'ALL'})`, getOperator(req));
      res.json({ success: true, count: updatedSlips.length, errors, slips: db.getPayslipsByMonth(month, company) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Copy Previous Month Inputs to Active Month
  app.post('/api/payslips/copy-previous-inputs', (req, res) => {
    try {
      const { month, company } = req.body;
      if (!month) return res.status(400).json({ error: 'Month is required' });

      if (db.isPayrollLocked(month, company)) {
        return res.status(400).json({ error: 'Payroll month is locked.' });
      }

      // Calculate previous month YYYY-MM
      const [year, m] = month.split('-').map(Number);
      const prevDate = new Date(year, m - 2, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      const prevSlips = db.getPayslipsByMonth(prevMonth, company);
      const currentSlips = db.getPayslipsByMonth(month, company);

      let copiedCount = 0;
      for (const cur of currentSlips) {
        const prev = prevSlips.find(p => p.employee_id === cur.employee_id);
        if (prev) {
          db.updatePayslipFullVariableInputs(cur.id, {
            tds: prev.tds || 0,
            custom_deductions: prev.custom_deductions || 0,
            canteen_deduction: prev.canteen_deduction || 0,
            uniform_deduction: prev.uniform_deduction || 0,
            notice_deduction: prev.notice_deduction || 0,
            mobile_deduction: prev.mobile_deduction || 0,
            damage_deduction: prev.damage_deduction || 0,
            special_allowance_addition: prev.special_allowance_addition || 0,
            other_earnings: prev.other_earnings || 0,
            remarks: prev.remarks ? `Copied from ${prevMonth}` : ''
          });
          copiedCount++;
        }
      }

      db.logAudit('Payroll Inputs Copied', `Copied variable payroll inputs from ${prevMonth} to ${month} for ${copiedCount} employees`, getOperator(req));
      res.json({ success: true, copiedCount, slips: db.getPayslipsByMonth(month, company) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Payroll Masters (Earning & Deduction Heads)
  app.get('/api/payroll-masters', async (req, res) => {
    try {
      const defaultEarnings = [
        { id: 'E1', code: 'BASIC', name: 'Basic Salary', category: 'STATUTORY', status: 'ACTIVE' },
        { id: 'E2', code: 'HRA', name: 'House Rent Allowance', category: 'STATUTORY', status: 'ACTIVE' },
        { id: 'E3', code: 'SPECIAL', name: 'Special Allowance', category: 'RECURRING', status: 'ACTIVE' },
        { id: 'E4', code: 'BONUS', name: 'Bonus Incentive', category: 'VARIABLE', status: 'ACTIVE' },
        { id: 'E5', code: 'PERF_INC', name: 'Performance Incentive', category: 'VARIABLE', status: 'ACTIVE' },
        { id: 'E6', code: 'ATT_INC', name: 'Attendance Incentive', category: 'VARIABLE', status: 'ACTIVE' },
        { id: 'E7', code: 'PROD_INC', name: 'Production Incentive', category: 'VARIABLE', status: 'ACTIVE' },
        { id: 'E8', code: 'REIMB', name: 'Reimbursement', category: 'VARIABLE', status: 'ACTIVE' },
        { id: 'E9', code: 'ARREAR', name: 'Arrear Payment', category: 'VARIABLE', status: 'ACTIVE' }
      ];

      const defaultDeductions = [
        { id: 'D1', code: 'PF', name: 'Provident Fund (PF)', category: 'STATUTORY', status: 'ACTIVE' },
        { id: 'D2', code: 'ESIC', name: 'Employee State Insurance (ESIC)', category: 'STATUTORY', status: 'ACTIVE' },
        { id: 'D3', code: 'PT', name: 'Professional Tax (PT)', category: 'STATUTORY', status: 'ACTIVE' },
        { id: 'D4', code: 'TDS', name: 'Tax Deducted at Source (TDS)', category: 'TAX', status: 'ACTIVE' },
        { id: 'D5', code: 'LOAN', name: 'Loan EMI Recovery', category: 'RECOVERY', status: 'ACTIVE' },
        { id: 'D6', code: 'ADVANCE', name: 'Salary Advance Recovery', category: 'RECOVERY', status: 'ACTIVE' },
        { id: 'D7', code: 'CANTEEN', name: 'Canteen Charges Recovery', category: 'RECOVERY', status: 'ACTIVE' },
        { id: 'D8', code: 'UNIFORM', name: 'Uniform Charges Recovery', category: 'RECOVERY', status: 'ACTIVE' },
        { id: 'D9', code: 'NOTICE', name: 'Notice Period Recovery', category: 'RECOVERY', status: 'ACTIVE' },
        { id: 'D10', code: 'MOBILE', name: 'Mobile Charges Recovery', category: 'RECOVERY', status: 'ACTIVE' },
        { id: 'D11', code: 'DAMAGE', name: 'Damage Recovery', category: 'RECOVERY', status: 'ACTIVE' },
        { id: 'D12', code: 'OTHER', name: 'Other Deductions', category: 'OTHER', status: 'ACTIVE' }
      ];

      const earningsStr = await db.getSystemSetting('payroll_earning_heads', JSON.stringify(defaultEarnings));
      const deductionsStr = await db.getSystemSetting('payroll_deduction_heads', JSON.stringify(defaultDeductions));

      res.json({
        earningHeads: JSON.parse(earningsStr),
        deductionHeads: JSON.parse(deductionsStr)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/payroll-masters', async (req, res) => {
    try {
      const { earningHeads, deductionHeads } = req.body;
      if (earningHeads) {
        await db.setSystemSetting('payroll_earning_heads', JSON.stringify(earningHeads));
      }
      if (deductionHeads) {
        await db.setSystemSetting('payroll_deduction_heads', JSON.stringify(deductionHeads));
      }
      db.logAudit('Payroll Masters Updated', 'Updated Master Earning and Deduction Heads configuration', getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/payroll-runs/calculate', (req, res) => {
    try {
      const { month, company } = req.body;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'Month (YYYY-MM) is required' });
      }

      if (db.isPayrollLocked(month, company)) {
        return res.status(400).json({ error: 'Payroll month is locked. No recalculation is allowed.' });
      }

      const newRun = db.runPayroll(month, company);
      db.logAudit('Payroll Processed', `Calculated and generated draft payroll wages for month ${month} (${company || 'ALL'})`, getOperator(req));
      res.json({ success: true, run: newRun, slips: db.getPayslipsByMonth(month, company) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/payroll-runs/close', (req, res) => {
    try {
      const { month, company, action } = req.body;
      if (!month) return res.status(400).json({ error: 'Month is required' });

      if (action === 'unlock') {
        const suffix = company && company !== 'ALL' ? `-${company}` : '';
        const run = (db as any).data.payroll_runs.find((r: any) => r.month === month && r.id === `RUN-${month}${suffix}`);
        if (!run) return res.status(404).json({ error: 'Payroll run not found' });
        run.status = 'DRAFT';
        (db as any).dbSqlite.run(`UPDATE payroll_runs SET status = 'DRAFT' WHERE id = ?`, [run.id]);
        (db as any).persistData();
        db.logAudit('Payroll Unlocked', `Unlocked payroll for ${month} (${company || 'ALL'})`, getOperator(req));
        return res.json({ success: true });
      }

      const success = db.closePayroll(month, company);
      if (!success) {
        return res.status(404).json({ error: 'Payroll run draft not found' });
      }

      db.logAudit('Payroll Approved', `Approved and locked payroll month ledger for ${month} (${company || 'ALL'})`, getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/payroll-runs/pay', (req, res) => {
    try {
      const { month, company, paymentDate } = req.body;
      if (!month) return res.status(400).json({ error: 'Month is required' });

      const result = db.payPayslips(month, company, paymentDate);
      db.logAudit('Payroll Paid', `Disbursed and sent salary notifications to ${result.count} employees for month ${month} (${company || 'ALL'})`, getOperator(req));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PF EPF CHALLAN EXPORT DRAFT (automated text formatting for Indian EPF portal uploads)
  app.get('/api/excel/export/pf/:month', (req, res) => {
    const { month } = req.params;
    const { company } = req.query as { company?: string };
    const slips = db.getPayslipsByMonth(month, company);

    if (slips.length === 0) {
      return res.status(404).send('No slips found for PF challan export');
    }

    // Official EPF ECR Text format: UAN#~#Member Name#~#Gross Wages#~#EPF Wages#~#EPS Wages#~#EDLI Wages#~#EPF Contrib#~#EPS Contrib#~#Diff EPF Cont#~#NCP Days
    const headers = ['UAN', 'Member Name', 'Gross Wages', 'EPF Wages', 'EPS Wages', 'EDLI Wages', 'EPF Contrib Employee', 'EPS Contrib Employer', 'EPF Diff Contrib', 'NCP/unpaid Days'];
    const lines = [headers.join(',')];

    for (const s of slips) {
      const emp = db.getEmployeeById(s.employee_id);
      if (!emp || !emp.pf_opt_in) continue;

      const uan = emp.uan || '100XXXXXXXXX';
      const epmWages = Math.min(15000, s.earned_base_salary + s.earned_da); // capped at 15000
      const epfContributionEmployee = Math.round(epmWages * 0.12);
      const epsContributionEmployer = Math.round(epmWages * 0.0833);
      const epfDiffContributionEmployer = Math.round(epmWages * 0.0367);

      const row = [
        uan,
        s.employee_name,
        s.gross_salary,
        epmWages,
        epmWages,
        epmWages,
        epfContributionEmployee,
        epsContributionEmployer,
        epfDiffContributionEmployer,
        s.lop_deduction > 0 ? 3 : 0 // sample NCP days
      ];
      lines.push(row.join(','));
    }

    const csvContent = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="EPF_ECR_Challan_${month}_${company || 'ALL'}.csv"`);
    res.send(csvContent);
  });

  // EXCEL EXPORTS (Standard wage register and Direct bank transfer sheets)
  app.get('/api/excel/export/payroll/:month', (req, res) => {
    const { month } = req.params;
    const { company } = req.query as { company?: string };
    const slips = db.getPayslipsByMonth(month, company);
    
    if (slips.length === 0) {
      return res.status(404).send('No payroll slips found for ' + month);
    }

    const headers = [
      'Slip ID',
      'Employee ID',
      'Employee Name',
      'Company Name',
      'Department',
      'Designation',
      'Basic Wage Rate',
      'Earned Basic',
      'Earned HRA',
      'Earned Dearness Allowance (DA)',
      'Special Allowance',
      'Overtime Pay',
      'Gross Salary Earned',
      'Loss of Pay (LOP) Deduction',
      'Employee Provident Fund (EPF)',
      'ESIC Deduction',
      'Professional Tax (PT)',
      'TDS Tax',
      'Total Deductions',
      'Net Salary Disbursed',
      'Employer PF Share',
      'Employer ESIC Share',
      'Bank Name',
      'Bank Account Number',
      'Bank IFSC Code'
    ];

    const lines = [headers.join(',')];

    for (const s of slips) {
      const emp = db.getEmployeeById(s.employee_id);
      const row = [
        s.id,
        s.employee_id,
        `"${s.employee_name.replace(/"/g, '""')}"`,
        `"${emp?.company || 'SVN-1'}"`,
        `"${s.department}"`,
        `"${s.designation}"`,
        s.rate_base_salary,
        s.earned_base_salary,
        s.earned_hra,
        s.earned_da,
        s.earned_special_allowance,
        s.overtime_pay,
        s.gross_salary,
        s.lop_deduction,
        s.pf_deduction,
        s.esic_deduction,
        s.professional_tax,
        s.tds,
        s.total_deductions,
        s.net_salary,
        s.employer_pf,
        s.employer_esic,
        `"${s.bank_name}"`,
        `"${s.bank_account}"`,
        `"${s.ifsc}"`
      ];
      lines.push(row.join(','));
    }

    const csvContent = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Vetan_Payroll_Register_${month}_${company || 'ALL'}.csv"`);
    res.send(csvContent);
  });

  app.get('/api/excel/export/bank/:month', (req, res) => {
    const { month } = req.params;
    const { company } = req.query as { company?: string };
    const slips = db.getPayslipsByMonth(month, company);

    if (slips.length === 0) {
      return res.status(404).send('No processed slips found for bank transfer export');
    }

    const headers = ['Beneficiary Bank Name', 'Beneficiary Account Number', 'Beneficiary IFSC Code', 'Beneficiary Name', 'Payment Amount', 'Transaction Remarks', 'Corporate Account Entity'];
    const lines = [headers.join(',')];

    for (const s of slips) {
      const emp = db.getEmployeeById(s.employee_id);
      const row = [
        `"${s.bank_name}"`,
        `"${s.bank_account}"`,
        `"${s.ifsc}"`,
        `"${s.employee_name.replace(/"/g, '""')}"`,
        s.net_salary,
        `"Salary for ${month}"`,
        `"${emp?.company || 'SVN-1'}"`
      ];
      lines.push(row.join(','));
    }

    const csvContent = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Vetan_BankTransfer_Format_${month}_${company || 'ALL'}.csv"`);
    res.send(csvContent);
  });

  app.get('/api/excel/export/bank/hdfc/:month', (req, res) => {
    const { month } = req.params;
    const { company, format } = req.query as { company?: string; format?: string };
    const slips = db.getPayslipsByMonth(month, company);

    if (slips.length === 0) {
      return res.status(404).send('No processed slips found for HDFC salary upload');
    }

    // HDFC standard Corporate NetBanking upload file columns:
    const headers = [
      'Beneficiary Account No',
      'Transaction Amount',
      'Beneficiary Name',
      'Bank IFSC',
      'Email ID',
      'Phone Number',
      'Narration',
      'Source Corporate Account'
    ];
    
    const lines = [headers.join(',')];

    for (const s of slips) {
      const emp = db.getEmployeeById(s.employee_id);
      
      let sourceAccount = '50200008912345'; 
      if (emp?.company?.includes('SVN')) sourceAccount = '50200008912345';
      if (emp?.company?.includes('Sakar')) sourceAccount = '50200008999887';

      const row = [
        `"${s.bank_account}"`,
        s.net_salary,
        `"${s.employee_name.replace(/"/g, '""')}"`,
        `"${s.ifsc}"`,
        `"${emp?.email || ''}"`,
        `"${emp?.phone || ''}"`,
        `"SALARY FOR ${month}"`,
        `"${sourceAccount}"`
      ];
      lines.push(row.join(','));
    }

    const fileContent = lines.join('\n');
    const ext = format === 'excel' ? 'xls' : 'csv';
    const contentType = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="HDFC_Salary_Upload_${month}_${company || 'ALL'}.${ext}"`);
    res.send(fileContent);
  });

  // Bulk Excel import spreadsheet mock parser
  app.post('/api/excel/import/employees', (req, res) => {
    try {
      const { csvText, companyFilter } = req.body;
      if (!csvText || typeof csvText !== 'string') {
        return res.status(400).json({ error: 'Please paste a valid CSV representation' });
      }

      // Robust helpers for numeric parsing with comma formatting support
      const parseCleanFloat = (val: any): number => {
        if (val === undefined || val === null) return 0;
        const cleaned = String(val).replace(/,/g, '').replace(/\s+/g, '').trim();
        if (cleaned === '' || cleaned === '-' || cleaned === '—' || cleaned === '–') return 0;
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const parseCleanInt = (val: any): number => {
        if (val === undefined || val === null) return 0;
        const cleaned = String(val).replace(/,/g, '').replace(/\s+/g, '').trim();
        if (cleaned === '' || cleaned === '-' || cleaned === '—' || cleaned === '–') return 0;
        const num = parseInt(cleaned, 10);
        return isNaN(num) ? 0 : num;
      };

      // Robust helper for parsing diverse Date formats (e.g. DD-MMM-YY, DD/MM/YYYY, standard)
      const parseCleanDate = (val: any): string => {
        if (!val) return new Date().toISOString().split('T')[0];
        const str = String(val).trim();
        if (!str || str === '-' || str === '—' || str === 'N/A' || str === 'n/a') return new Date().toISOString().split('T')[0];

        // If it is already standard YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          return str;
        }

        // Handle DD-MMM-YY or DD-MMM-YYYY (e.g. 01-Jul-12, 01-Jul-2012 or 01/Jul/12)
        const mmmRegex = /^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{2,4})$/;
        const match = str.match(mmmRegex);
        if (match) {
          const day = match[1].padStart(2, '0');
          const mmm = match[2].toLowerCase();
          const yearStr = match[3];
          let year = parseInt(yearStr, 10);
          if (yearStr.length === 2) {
            year = year < 70 ? 2000 + year : 1900 + year;
          }
          const months: Record<string, string> = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
          };
          const month = months[mmm];
          if (month) {
            return `${year}-${month}-${day}`;
          }
        }

        // Handle DD-MM-YYYY or DD/MM/YYYY
        const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/;
        const matchDmy = str.match(dmyRegex);
        if (matchDmy) {
          const day = matchDmy[1].padStart(2, '0');
          const month = matchDmy[2].padStart(2, '0');
          const yearStr = matchDmy[3];
          let year = parseInt(yearStr, 10);
          if (yearStr.length === 2) {
            year = year < 70 ? 2000 + year : 1900 + year;
          }
          return `${year}-${month}-${day}`;
        }

        try {
          const d = new Date(str);
          if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }
        } catch (e) {}

        return new Date().toISOString().split('T')[0];
      };

      const cleanCsvText = csvText.replace(/\r/g, '').trim();
      const lines = cleanCsvText.split('\n');

      const rows: string[][] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const cells: string[] = [];
        let currentCell = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(currentCell.trim());
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        cells.push(currentCell.trim());
        
        const parsedCells = cells.map(cell => {
          if (cell.startsWith('"') && cell.endsWith('"')) {
            return cell.slice(1, -1).trim();
          }
          return cell;
        });
        rows.push(parsedCells);
      }

      if (rows.length < 2) {
        return res.status(400).json({ error: 'Pasted layout is empty or has no record rows' });
      }

      const header = rows[0].map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));
      
      const idxId = header.indexOf('employeecode') !== -1 ? header.indexOf('employeecode') : 
                   (header.indexOf('empcode') !== -1 ? header.indexOf('empcode') : 
                   (header.indexOf('employeeid') !== -1 ? header.indexOf('employeeid') : 
                   (header.indexOf('code') !== -1 ? header.indexOf('code') : 
                   (header.indexOf('id') !== -1 ? header.indexOf('id') : -1))));

      if (idxId === -1) {
        return res.status(400).json({ error: 'Pasted spreadsheet headers must contain an "Employee Code" or "Emp Code" column as the mandatory matching field.' });
      }

      const idxName = header.indexOf('name');
      const idxDesignation = header.indexOf('designation') !== -1 ? header.indexOf('designation') : header.indexOf('role');
      const idxDepartment = header.indexOf('department') !== -1 ? header.indexOf('department') : header.indexOf('dept');
      const idxBase = header.indexOf('basesalary') !== -1 ? header.indexOf('basesalary') : header.indexOf('salary');
      const idxEmail = header.indexOf('email');
      const idxPhone = header.indexOf('phone') !== -1 ? header.indexOf('phone') : header.indexOf('mobile');
      const idxBank = header.indexOf('bank');
      const idxAccount = header.indexOf('account') !== -1 ? header.indexOf('account') : header.indexOf('bankaccount');
      const idxIfsc = header.indexOf('ifsc');
      const idxPan = header.indexOf('pan') !== -1 ? header.indexOf('pan') : header.indexOf('pancard');
      const idxQualification = header.indexOf('qualification');
      const idxLocation = header.indexOf('location') !== -1 ? header.indexOf('location') : (header.indexOf('worklocation') !== -1 ? header.indexOf('worklocation') : header.indexOf('officelocation'));
      const idxVehicle = header.indexOf('vehicledetail') !== -1 ? header.indexOf('vehicledetail') : header.indexOf('vehicle');
      const idxPrevCompany = header.indexOf('prevcompanyname') !== -1 ? header.indexOf('prevcompanyname') : (header.indexOf('prevcompany') !== -1 ? header.indexOf('prevcompany') : header.indexOf('previouscompany'));
      const idxPrevLoc = header.indexOf('prevcompanylocation') !== -1 ? header.indexOf('prevcompanylocation') : header.indexOf('previouscompanylocation');
      const idxExp = header.indexOf('totalexperience') !== -1 ? header.indexOf('totalexperience') : (header.indexOf('experience') !== -1 ? header.indexOf('experience') : header.indexOf('priorexperience'));
      const idxBirthYear = header.indexOf('birthyear') !== -1 ? header.indexOf('birthyear') : (header.indexOf('birth_year') !== -1 ? header.indexOf('birth_year') : header.indexOf('yearofbirth'));
      const idxCategory = header.indexOf('employeecategory') !== -1 ? header.indexOf('employeecategory') : 
                          (header.indexOf('category') !== -1 ? header.indexOf('category') : 
                          (header.indexOf('type') !== -1 ? header.indexOf('type') : 
                          (header.indexOf('employeetype') !== -1 ? header.indexOf('employeetype') : -1)));

      // Reporting headers
      const idxReportingManager = header.indexOf('reportingmanager') !== -1 ? header.indexOf('reportingmanager') : (header.indexOf('reporting_manager') !== -1 ? header.indexOf('reporting_manager') : header.indexOf('manager'));
      const idxReportingHod = header.indexOf('reportinghod') !== -1 ? header.indexOf('reportinghod') : (header.indexOf('reporting_hod') !== -1 ? header.indexOf('reporting_hod') : header.indexOf('hod'));
      const idxReportingHodName = header.indexOf('reportinghodname') !== -1 ? header.indexOf('reportinghodname') : (header.indexOf('reporting_hod_name') !== -1 ? header.indexOf('reporting_hod_name') : header.indexOf('hodname'));

      // Advanced salary & date headers
      const idxJoiningDate = header.indexOf('joiningdate') !== -1 ? header.indexOf('joiningdate') : (header.indexOf('dateofjoining') !== -1 ? header.indexOf('dateofjoining') : header.indexOf('doj'));
      const idxExitDate = header.indexOf('exitdate') !== -1 ? header.indexOf('exitdate') : (header.indexOf('dateofleaving') !== -1 ? header.indexOf('dateofleaving') : (header.indexOf('leavingdate') !== -1 ? header.indexOf('leavingdate') : header.indexOf('dol')));
      const idxHra = header.indexOf('hra') !== -1 ? header.indexOf('hra') : header.indexOf('houserentallowance');
      const idxConveyance = header.indexOf('conall') !== -1 ? header.indexOf('conall') : (header.indexOf('conveyanceallowance') !== -1 ? header.indexOf('conveyanceallowance') : header.indexOf('conveyance'));
      const idxEdu = header.indexOf('childall') !== -1 ? header.indexOf('childall') : (header.indexOf('eduallowance') !== -1 ? header.indexOf('eduallowance') : header.indexOf('childallowance'));
      const idxMedical = header.indexOf('medicalall') !== -1 ? header.indexOf('medicalall') : (header.indexOf('medicalallowance') !== -1 ? header.indexOf('medicalallowance') : header.indexOf('medical'));
      const idxSpecial = header.indexOf('specialall') !== -1 ? header.indexOf('specialall') : (header.indexOf('specialallowance') !== -1 ? header.indexOf('specialallowance') : header.indexOf('special'));
      const idxDa = header.indexOf('dearnesall') !== -1 ? header.indexOf('dearnesall') : (header.indexOf('da') !== -1 ? header.indexOf('da') : header.indexOf('dearnessallowance'));
      const idxBonus = header.indexOf('bonuspayable') !== -1 ? header.indexOf('bonuspayable') : header.indexOf('bonus');
      const idxCtc = header.indexOf('ctc') !== -1 ? header.indexOf('ctc') : header.indexOf('ctcsalary');

      if (idxName === -1 || idxDesignation === -1 || idxBase === -1) {
        return res.status(400).json({ error: 'Headers must contain at least "Employee Code", "Name", "Designation" and "Base Salary".' });
      }

      let importedCount = 0;
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r.length < 2 || !r[idxName]) continue;

        const empCode = r[idxId] ? r[idxId].trim() : '';
        if (!empCode) continue;

        const base = parseCleanInt(r[idxBase]) || 15000;
        const birthYearVal = idxBirthYear !== -1 && r[idxBirthYear] ? (parseCleanInt(r[idxBirthYear]) || 1995) : 1995;

        // Custom salary parsed values with fallback defaults
        const parsedHra = idxHra !== -1 && r[idxHra] !== undefined && r[idxHra] !== '' ? Math.round(parseCleanFloat(r[idxHra])) : Math.round(base * 0.40);
        const parsedSpecial = idxSpecial !== -1 && r[idxSpecial] !== undefined && r[idxSpecial] !== '' ? Math.round(parseCleanFloat(r[idxSpecial])) : Math.round(base * 0.15);
        const parsedDa = idxDa !== -1 && r[idxDa] !== undefined && r[idxDa] !== '' ? Math.round(parseCleanFloat(r[idxDa])) : Math.round(base * 0.10);
        const parsedConveyance = idxConveyance !== -1 && r[idxConveyance] !== undefined && r[idxConveyance] !== '' ? Math.round(parseCleanFloat(r[idxConveyance])) : 0;
        const parsedEdu = idxEdu !== -1 && r[idxEdu] !== undefined && r[idxEdu] !== '' ? Math.round(parseCleanFloat(r[idxEdu])) : 0;
        const parsedMedical = idxMedical !== -1 && r[idxMedical] !== undefined && r[idxMedical] !== '' ? Math.round(parseCleanFloat(r[idxMedical])) : 0;
        const parsedBonus = idxBonus !== -1 && r[idxBonus] !== undefined && r[idxBonus] !== '' ? Math.round(parseCleanFloat(r[idxBonus])) : 0;
        
        // Compute Gross Salary
        const grossSalary = base + parsedHra + parsedSpecial + parsedDa + parsedConveyance + parsedEdu + parsedMedical;
        
        // PF Contribution calculations
        const parsedPfOptIn = true;
        const empPf = Math.round((base + parsedDa) * 0.12);
        const employerPf = empPf; // matching contribution

        // ESIC Contribution calculations (Gross <= 21,000 INR)
        const parsedEsicOptIn = grossSalary <= 21000;
        const employerEsic = parsedEsicOptIn ? Math.round(grossSalary * 0.0325) : 0;

        // Determine CTC Salary (always auto-calculate to disallow manual overrides)
        const parsedCtc = grossSalary + employerPf + employerEsic + parsedBonus;

        // DOJ and DOL dates
        const parsedJoiningDate = parseCleanDate(idxJoiningDate !== -1 ? r[idxJoiningDate] : undefined);
        const parsedExitDate = idxExitDate !== -1 && r[idxExitDate] !== undefined && r[idxExitDate] !== '' && r[idxExitDate] !== '-' ? parseCleanDate(r[idxExitDate]) : undefined;
        
        const existingEmp = db.getEmployeeById(empCode);
        if (existingEmp) {
          // Rule 7: Update existing matching employee
          db.updateEmployee(empCode, {
            name: r[idxName],
            designation: r[idxDesignation],
            department: idxDepartment !== -1 ? r[idxDepartment] : existingEmp.department,
            email: idxEmail !== -1 ? r[idxEmail] : existingEmp.email,
            phone: idxPhone !== -1 ? r[idxPhone] : existingEmp.phone,
            birth_year: birthYearVal,
            joining_date: parsedJoiningDate,
            exit_date: parsedExitDate,
            status: parsedExitDate ? 'RESIGNED' : 'ACTIVE',
            bank_name: idxBank !== -1 ? r[idxBank] : existingEmp.bank_name,
            bank_account: idxAccount !== -1 ? r[idxAccount] : existingEmp.bank_account,
            ifsc: idxIfsc !== -1 ? r[idxIfsc] : existingEmp.ifsc,
            pan: idxPan !== -1 ? r[idxPan] : existingEmp.pan,
            base_salary: base,
            hra: parsedHra,
            special_allowance: parsedSpecial,
            da: parsedDa,
            conveyance_allowance: parsedConveyance,
            edu_allowance: parsedEdu,
            medical_allowance: parsedMedical,
            bonus_payable: parsedBonus,
            ctc_salary: parsedCtc,
            salary_structure_type: 'FIXED',
            qualification: idxQualification !== -1 ? r[idxQualification] : existingEmp.qualification,
            location: idxLocation !== -1 ? r[idxLocation] : existingEmp.location,
            vehicle_detail: idxVehicle !== -1 ? r[idxVehicle] : existingEmp.vehicle_detail,
            prev_company_name: idxPrevCompany !== -1 ? r[idxPrevCompany] : existingEmp.prev_company_name,
            prev_company_location: idxPrevLoc !== -1 ? r[idxPrevLoc] : existingEmp.prev_company_location,
            total_experience: idxExp !== -1 ? r[idxExp] : existingEmp.total_experience,
            reporting_manager: idxReportingManager !== -1 && r[idxReportingManager] ? r[idxReportingManager] : existingEmp.reporting_manager,
            reporting_hod: idxReportingHod !== -1 && r[idxReportingHod] ? r[idxReportingHod] : existingEmp.reporting_hod,
            reporting_hod_name: idxReportingHodName !== -1 && r[idxReportingHodName] ? r[idxReportingHodName] : existingEmp.reporting_hod_name,
            employee_category: idxCategory !== -1 && r[idxCategory] ? ((r[idxCategory].toLowerCase().includes('worker') || r[idxCategory].toLowerCase().includes('employee')) ? 'Worker' : r[idxCategory].toLowerCase().includes('contract') ? 'Contract' : 'Staff') : existingEmp.employee_category
          });
        } else {
          // Rule 7: Create brand new employee with specified Code
          const newEmp: Employee = {
            id: empCode,
            name: r[idxName],
            company: companyFilter || 'SVN-1',
            designation: r[idxDesignation],
            department: idxDepartment !== -1 ? r[idxDepartment] : 'Engineering',
            email: idxEmail !== -1 ? r[idxEmail] : `${r[idxName].toLowerCase().replace(/\s+/g, '')}@sakarelectricals.com`,
            phone: idxPhone !== -1 ? r[idxPhone] : '9999900000',
            birth_year: birthYearVal,
            needs_password_change: true,
            joining_date: parsedJoiningDate,
            exit_date: parsedExitDate,
            status: parsedExitDate ? 'RESIGNED' : 'ACTIVE',
            bank_name: idxBank !== -1 ? r[idxBank] : 'HDFC Bank',
            bank_account: idxAccount !== -1 ? r[idxAccount] : '501004' + Math.floor(Math.random() * 1000000000),
            ifsc: idxIfsc !== -1 ? r[idxIfsc] : 'HDFC0000124',
            pan: idxPan !== -1 ? r[idxPan] : 'ABCDE' + Math.floor(Math.random() * 10000) + 'F',
            uan: '100' + Math.floor(Math.random() * 1000000000),
            base_salary: base,
            hra: parsedHra,
            special_allowance: parsedSpecial,
            da: parsedDa,
            conveyance_allowance: parsedConveyance,
            edu_allowance: parsedEdu,
            medical_allowance: parsedMedical,
            bonus_payable: parsedBonus,
            ctc_salary: parsedCtc,
            salary_structure_type: 'FIXED',
            pf_opt_in: parsedPfOptIn,
            esic_opt_in: parsedEsicOptIn,
            professional_tax_opt_in: true,
            leave_balance_pl: 18,
            leave_balance_cl: 6,
            leave_balance_sl: 6,
            qualification: idxQualification !== -1 ? r[idxQualification] : 'B.Tech (Electrical Engineering)',
            location: idxLocation !== -1 ? r[idxLocation] : 'Sakar Corporate Tower, Alkapuri',
            vehicle_detail: idxVehicle !== -1 ? r[idxVehicle] : 'GJ-06-HM-1234 (Honda Activa)',
            prev_company_name: idxPrevCompany !== -1 ? r[idxPrevCompany] : 'L&T Heavy Engineering',
            prev_company_location: idxPrevLoc !== -1 ? r[idxPrevLoc] : 'Vadodara, Gujarat',
            total_experience: idxExp !== -1 ? r[idxExp] : '4 Years',
            reporting_manager: idxReportingManager !== -1 && r[idxReportingManager] ? r[idxReportingManager] : 'Management',
            reporting_hod: idxReportingHod !== -1 && r[idxReportingHod] ? r[idxReportingHod] : undefined,
            reporting_hod_name: idxReportingHodName !== -1 && r[idxReportingHodName] ? r[idxReportingHodName] : (idxReportingHod !== -1 && r[idxReportingHod] ? r[idxReportingHod] : undefined),
            employee_category: idxCategory !== -1 && r[idxCategory] ? ((r[idxCategory].toLowerCase().includes('worker') || r[idxCategory].toLowerCase().includes('employee')) ? 'Worker' : r[idxCategory].toLowerCase().includes('contract') ? 'Contract' : 'Staff') : 'Staff'
          };
          db.insertEmployee(newEmp);
        }
        importedCount++;
      }

      res.json({ success: true, count: importedCount });
    } catch (e: any) {
      res.status(500).json({ error: 'Spreadsheet import failed: ' + e.message });
    }
  });

  // Operator identification helpers
  const getOperator = (req: any) => {
    return req.headers['x-operator-name'] || req.body.operator || 'Admin';
  };
  
  const getOperatorRole = (req: any) => {
    return req.headers['x-operator-role'] || 'COMPANY_HR';
  };

  // Gate Passes API
  app.get('/api/gate-passes', (req, res) => {
    try {
      const { company } = req.query as { company?: string };
      const allowed = getAllowedCompanies(req);
      let passes = db.getGatePasses();
      
      if (allowed) {
        if (company && company !== 'ALL') {
          if (!allowed.includes(company)) {
            return res.json([]);
          }
          passes = passes.filter(g => g.company === company || g.target_company === company);
        } else {
          passes = passes.filter(g => allowed.includes(g.company) || allowed.includes(g.target_company));
        }
      } else if (company && company !== 'ALL') {
        passes = passes.filter(g => g.company === company || g.target_company === company);
      }
      res.json(passes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/gate-passes', (req, res) => {
    try {
      const pass = req.body;
      const saved = db.addGatePass(pass);
      db.logAudit('Gate Pass Created', `Created gate pass ${saved.id} for ${saved.employee_name} (${saved.employee_id}) to ${saved.target_company}`, getOperator(req));
      res.json({ success: true, gatePass: saved });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/gate-passes/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { status, details } = req.body;
      const success = db.updateGatePassStatus(id, status, details);
      if (success) {
        db.logAudit('Gate Pass Updated', `Updated gate pass ${id} status to ${status}`, getOperator(req));
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Gate pass not found' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Audit Logs, Lock/Unlock and Backup/Restore APIs
  app.get('/api/audit-logs', (req, res) => {
    db.getAuditLogs()
      .then(logs => res.json(logs))
      .catch(e => res.status(500).json({ error: e.message }));
  });

  app.post('/api/payroll-runs/unlock', async (req, res) => {
    try {
      const { month, company, pin } = req.body;
      const operatorRole = getOperatorRole(req);
      const operatorName = getOperator(req);

      if (operatorRole !== 'SUPER_HR') {
        return res.status(403).json({ error: 'Access Denied: Only Super Admin can unlock payroll month.' });
      }

      if (!(await verifyPin(pin))) {
        return res.status(403).json({ error: 'PIN_INVALID', message: 'Invalid or missing Super Admin Security PIN.' });
      }

      const success = db.unlockPayroll(month, company);
      if (!success) {
        return res.status(404).json({ error: 'Payroll run not found' });
      }

      db.logAudit('Payroll Unlocked', `Unlocked payroll run for month ${month} (${company || 'ALL'})`, operatorName);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Employee Assets Tracking API ---
  app.get('/api/assets', (req, res) => {
    try {
      const { employee_id } = req.query as { employee_id?: string };
      res.json(db.getAssets(employee_id));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/assets', (req, res) => {
    try {
      const asset = req.body;
      if (!asset.id) {
        asset.id = 'AST-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      }
      db.saveAsset(asset);
      db.logAudit('Save Asset', `Saved asset ${asset.asset_name} (${asset.serial_number}) for employee ${asset.employee_name}`, getOperator(req));
      res.json({ success: true, asset });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/assets/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.deleteAsset(id);
      db.logAudit('Delete Asset', `Deleted asset ID ${id}`, getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Travel Allowance (Fuel Reimbursement) API ---
  app.get('/api/travel', (req, res) => {
    try {
      const { employee_id } = req.query as { employee_id?: string };
      res.json(db.getTravelReimbursements(employee_id));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/travel', (req, res) => {
    try {
      const reimb = req.body;
      if (!reimb.id) {
        reimb.id = 'TRV-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      }
      // Re-calculate amount in backend to ensure correctness
      reimb.amount = Math.round((Number(reimb.fuel_liters) || 0) * (Number(reimb.rate_per_liter) || 0));
      db.saveTravelReimbursement(reimb);
      db.logAudit('Save Travel Reimbursement', `Saved travel reimbursement of INR ${reimb.amount} for employee ${reimb.employee_name}`, getOperator(req));
      res.json({ success: true, travel: reimb });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/travel/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.deleteTravelReimbursement(id);
      db.logAudit('Delete Travel', `Deleted travel reimbursement ID ${id}`, getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Broadcasts/Announcements Notice API ---
  app.get('/api/broadcasts', (req, res) => {
    try {
      res.json(db.getBroadcasts());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/broadcasts', (req, res) => {
    try {
      const notice = req.body;
      if (!notice.id) {
        notice.id = 'BCST-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      }
      if (!notice.created_at) {
        notice.created_at = new Date().toISOString();
      }
      db.saveBroadcast(notice);
      db.logAudit('Publish Broadcast', `Published announcement: "${notice.title}" for ${notice.target_type} (${notice.target_value})`, getOperator(req));
      res.json({ success: true, broadcast: notice });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/broadcasts/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.deleteBroadcast(id);
      db.logAudit('Delete Broadcast', `Deleted announcement notice ID ${id}`, getOperator(req));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/purge-employees', async (req, res) => {
    try {
      const pin = req.headers['x-security-pin'] || req.query.pin || req.body.pin;
      if (!(await verifyPin(pin))) {
        return res.status(403).json({ error: 'PIN_INVALID', message: 'Invalid or missing Super Admin Security PIN.' });
      }

      await db.purgeEmployees();
      db.logAudit('Database Cleared', 'All test/dummy employee data and payroll runs permanently purged to start fresh.', getOperator(req));
      res.json({ success: true, message: 'All employees and payroll data have been successfully purged. The system is ready for real accounts.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/backup', (req, res) => {
    try {
      const dbPath = path.join(process.cwd(), 'Payroll.db');
      res.download(dbPath, 'Payroll.db');
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/backup-json', (req, res) => {
    try {
      const dataObj = db.getFullBackupJSON();
      res.json(dataObj);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/restore-json', async (req, res) => {
    try {
      const backupData = req.body;
      const operatorName = getOperator(req);
      
      if (!backupData || typeof backupData !== 'object') {
        return res.status(400).json({ error: 'Invalid or empty backup data payload' });
      }

      await db.restoreFullBackupJSON(backupData);
      db.logAudit('Database JSON Restored', 'Database structure and records restored from JSON browser sync', operatorName);
      res.json({ success: true, message: 'All employees, attendance sheets, and records restored successfully.' });
    } catch (e: any) {
      res.status(500).json({ error: 'Database JSON restore failed: ' + e.message });
    }
  });

  app.post('/api/restore', async (req, res) => {
    try {
      const { databaseBase64, pin } = req.body;
      const operatorName = getOperator(req);

      if (!(await verifyPin(pin))) {
        return res.status(403).json({ error: 'PIN_INVALID', message: 'Invalid or missing Super Admin Security PIN.' });
      }

      if (!databaseBase64) {
        return res.status(400).json({ error: 'Missing databaseBase64 parameter' });
      }

      const buffer = Buffer.from(databaseBase64, 'base64');
      
      // Close db, write file, and re-init db safely
      await db.close();
      const dbPath = path.join(process.cwd(), 'Payroll.db');
      fs.writeFileSync(dbPath, buffer);
      await db.init();

      db.logAudit('Database Restored', 'Database structure restored from Backup file', operatorName);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: 'Database restore failed: ' + e.message });
    }
  });

  // Expose db instance for Vercel handler to call reloadFromSupabase()
  (app as any).locals = (app as any).locals || {};
  (app as any).locals.db = db;

  return app;
}

export default createApp;
