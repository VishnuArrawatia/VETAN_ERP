/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let sqlite3: any = null;
import { 
  Employee, 
  Attendance, 
  PayrollRun, 
  Payslip, 
  SQLResult, 
  LeaveApplication, 
  FullAndFinalSettlement, 
  Form16Calculation,
  Loan,
  LoanSettlement,
  LoanAuditLog,
  CompanyMaster,
  SalaryRevision,
  EmployeeAsset,
  TravelReimbursement,
  BroadcastNotice,
  HRUser,
  HODMaster,
  Shift
} from '../src/types';

const DB_SQLITE_FILE = path.join(process.cwd(), 'Payroll.db');

interface Schema {
  employees: Employee[];
  attendance: Attendance[];
  payroll_runs: PayrollRun[];
  payslips: Payslip[];
  leave_applications: LeaveApplication[];
  ff_settlements: FullAndFinalSettlement[];
  loans: Loan[];
  departments?: string[];
  companies?: CompanyMaster[];
  salary_revisions?: SalaryRevision[];
  audit_logs?: any[];
  assets?: EmployeeAsset[];
  travel_reimbursements?: TravelReimbursement[];
  broadcasts?: BroadcastNotice[];
  attendance_corrections?: any[];
  compoff_requests?: any[];
  overtime_requests?: any[];
  users?: HRUser[];
  hods?: HODMaster[];
  compoff_ledger?: any[];
  policies?: any[];
  policy_acknowledgements?: any[];
  gate_passes?: any[];
  shifts?: Shift[];
  loan_policy?: any;
}

const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'EMP001',
    name: 'Rahul Sharma',
    company: 'SVN-1',
    designation: 'Senior Production Head',
    department: 'Engineering',
    email: 'rahul.sharma@sakarelectricals.com',
    phone: '9876543210',
    joining_date: '2023-01-15',
    status: 'ACTIVE',
    bank_name: 'HDFC Bank',
    bank_account: '50100412345678',
    ifsc: 'HDFC0000124',
    pan: 'BKPPS1234F',
    uan: '100451239845',
    base_salary: 80000,
    hra: 32000,
    special_allowance: 15000,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: 'M.Tech in Manufacturing Engineering',
    location: 'Savli Unit I, Vadodara',
    vehicle_detail: 'Honda City (GJ-06-HM-1234)',
    prev_company_name: 'ABB India Ltd',
    prev_company_location: 'Maneja, Vadodara',
    total_experience: '8.5 Years',
    shift_timing: '8:00 AM to 5:30 PM',
    birth_year: 1990,
    needs_password_change: true,
    aadhaar_number: '123456789012',
    dob: '1990-05-15',
    gender: 'Male',
    marital_status: 'Married',
    emergency_contact: '9876543211',
    blood_group: 'O+',
    esic_number: '37000451230001001',
    cost_center: 'Savli Unit I',
    reporting_manager: 'Management',
    employee_category: 'Staff'
  },
  {
    id: 'EMP002',
    name: 'Priya Patel',
    company: 'SVN-II',
    designation: 'HR Lead Specialist',
    department: 'Human Resources',
    email: 'priya.patel@sakarelectricals.com',
    phone: '9823456789',
    joining_date: '2023-06-01',
    status: 'ACTIVE',
    bank_name: 'ICICI Bank',
    bank_account: '000401568241',
    ifsc: 'ICIC0000004',
    pan: 'AYZPP8765A',
    uan: '100874512963',
    base_salary: 42000,
    hra: 16800,
    special_allowance: 6200,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: 'MBA in Human Resources',
    location: 'Corporate Office, Alkapuri',
    vehicle_detail: 'Hyundai i20 (GJ-06-KK-5678)',
    prev_company_name: 'L&T Power',
    prev_company_location: 'Vadodara Office',
    total_experience: '5 Years',
    shift_timing: '9:30 AM to 6:30 PM',
    birth_year: 1992,
    needs_password_change: true,
    aadhaar_number: '234567890123',
    dob: '1992-08-20',
    gender: 'Female',
    marital_status: 'Single',
    emergency_contact: '9823456780',
    blood_group: 'B+',
    esic_number: '37000451230001002',
    cost_center: 'Corporate Office',
    reporting_manager: 'Rahul Sharma',
    employee_category: 'Staff'
  },
  {
    id: 'EMP003',
    name: 'Amit Mishra',
    company: 'Sakar-I',
    designation: 'Electrical Operations Manager',
    department: 'Operations',
    email: 'amit.mishra@sakarelectricals.com',
    phone: '7012345678',
    joining_date: '2024-02-10',
    status: 'ACTIVE',
    bank_name: 'State Bank of India',
    bank_account: '31245678901',
    ifsc: 'SBIN0001254',
    pan: 'CKMPM4321D',
    uan: '100652314569',
    base_salary: 22000,
    hra: 8800,
    special_allowance: 3000,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: 'B.E. in Electrical Engineering',
    location: 'Halol Unit II',
    vehicle_detail: 'Maruti Swift (GJ-17-BC-9012)',
    prev_company_name: 'Polycab India',
    prev_company_location: 'Halol Industrial Area',
    total_experience: '4 Years',
    shift_timing: '8:00 AM to 5:30 PM',
    birth_year: 1994,
    needs_password_change: true,
    aadhaar_number: '345678901234',
    dob: '1994-11-12',
    gender: 'Male',
    marital_status: 'Married',
    emergency_contact: '7012345679',
    blood_group: 'A+',
    esic_number: '37000341250001001',
    cost_center: 'Halol Unit II',
    reporting_manager: 'Rahul Sharma',
    employee_category: 'Staff'
  },
  {
    id: 'EMP004',
    name: 'Sneha Reddy',
    company: 'Sakar-III',
    designation: 'Technical Sales Support',
    department: 'Support',
    email: 'sneha.reddy@sakarelectricals.com',
    phone: '9154678234',
    joining_date: '2024-09-01',
    status: 'ACTIVE',
    bank_name: 'Axis Bank',
    bank_account: '912010045612345',
    ifsc: 'UTIB0000214',
    pan: 'DFGPR9081C',
    uan: '100982314578',
    base_salary: 13000,
    hra: 5200,
    special_allowance: 1200,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: true,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: 'B.Sc in Electronics',
    location: 'Sakar Unit III, Halol',
    vehicle_detail: 'Honda Activa 6G (GJ-17-XY-4321)',
    prev_company_name: 'Apar Industries',
    prev_company_location: 'Umbergaon, Gujarat',
    total_experience: '2.5 Years',
    shift_timing: '9:30 AM to 6:30 PM',
    birth_year: 1996,
    needs_password_change: true,
    aadhaar_number: '456789012345',
    dob: '1996-03-30',
    gender: 'Female',
    marital_status: 'Single',
    emergency_contact: '9154678230',
    blood_group: 'AB+',
    esic_number: '37000341250001002',
    cost_center: 'Sakar Unit III',
    reporting_manager: 'Priya Patel',
    employee_category: 'Staff'
  },
  {
    id: 'EMP005',
    name: 'Vikram Singh',
    company: 'SVN-1',
    designation: 'Logistics Supervisor',
    department: 'Administration',
    email: 'vikram.singh@sakarelectricals.com',
    phone: '8234567890',
    joining_date: '2024-11-15',
    status: 'ACTIVE',
    bank_name: 'Punjab National Bank',
    bank_account: '02310001245623',
    ifsc: 'PUNB0023100',
    pan: 'GHKPS5544B',
    uan: '100741258963',
    base_salary: 11000,
    hra: 4400,
    special_allowance: 1000,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: true,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: 'Diploma in Supply Chain',
    location: 'Savli Unit I, Vadodara',
    vehicle_detail: 'Hero Splendor (GJ-06-ZZ-8899)',
    prev_company_name: 'Gati KWE',
    prev_company_location: 'Ranoli, Vadodara',
    total_experience: '3 Years',
    shift_timing: '8:00 AM to 8:00 PM',
    birth_year: 1993,
    needs_password_change: true,
    aadhaar_number: '567890123456',
    dob: '1993-02-14',
    gender: 'Male',
    marital_status: 'Married',
    emergency_contact: '8234567891',
    blood_group: 'O-',
    esic_number: '37000451230001001',
    cost_center: 'Savli Unit I',
    reporting_manager: 'Amit Mishra',
    employee_category: 'Staff'
  },
  {
    id: 'EMP006',
    name: 'Amitabh Shah',
    company: 'Flare-1',
    designation: 'Senior Assembly Supervisor',
    department: 'Production',
    email: 'amitabh.shah@flaretech.com',
    phone: '9988776655',
    joining_date: '2023-08-10',
    status: 'ACTIVE',
    bank_name: 'HDFC Bank',
    bank_account: '50100223344556',
    ifsc: 'HDFC0000124',
    pan: 'FLKPS1234G',
    uan: '100451239899',
    base_salary: 35000,
    hra: 14000,
    special_allowance: 5000,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: 'Diploma in Electrical Engineering',
    location: 'Savli GIDC, Savli',
    vehicle_detail: 'Bajaj Pulsar (GJ-06-AA-1122)',
    prev_company_name: 'Polycab India',
    prev_company_location: 'Halol, Gujarat',
    total_experience: '5 Years',
    shift_timing: '8:00 AM to 5:30 PM',
    birth_year: 1994,
    needs_password_change: true,
    aadhaar_number: '987654321012',
    dob: '1994-04-12',
    gender: 'Male',
    marital_status: 'Married',
    emergency_contact: '9988776600',
    blood_group: 'A+',
    esic_number: '37000991110001001',
    cost_center: 'Flare Savli Unit I',
    reporting_manager: 'Management',
    employee_category: 'Staff'
  },
  {
    id: 'EMP007',
    name: 'Kiran Rao',
    company: 'Zenivo-1',
    designation: 'Systems Administrator',
    department: 'Administration',
    email: 'kiran.rao@zenivosystems.com',
    phone: '8877665544',
    joining_date: '2024-02-15',
    status: 'ACTIVE',
    bank_name: 'HDFC Bank',
    bank_account: '50100556677889',
    ifsc: 'HDFC0000124',
    pan: 'ZNKPS5678H',
    uan: '100874512900',
    base_salary: 45050,
    hra: 18020,
    special_allowance: 6000,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: 'B.Tech in Computer Science',
    location: 'GIDC Makarpura, Vadodara',
    vehicle_detail: 'Hyundai i10 (GJ-06-CC-3344)',
    prev_company_name: 'Matrix Comsec',
    prev_company_location: 'Vadodara, Gujarat',
    total_experience: '3 Years',
    shift_timing: '9:30 AM to 6:30 PM',
    birth_year: 1997,
    needs_password_change: true,
    aadhaar_number: '876543210901',
    dob: '1997-09-20',
    gender: 'Female',
    marital_status: 'Single',
    emergency_contact: '8877665500',
    blood_group: 'B+',
    esic_number: '37000882220001001',
    cost_center: 'Zenivo Makarpura Unit I',
    reporting_manager: 'Management',
    employee_category: 'Staff'
  }
];

const SEED_ATTENDANCE: Attendance[] = [
  { id: 'ATT-EMP001-2026-05', employee_id: 'EMP001', month: '2026-05', total_days: 31, working_days: 31, lop_days: 0, overtime_hours: 4 },
  { id: 'ATT-EMP002-2026-05', employee_id: 'EMP002', month: '2026-05', total_days: 31, working_days: 30, lop_days: 1, overtime_hours: 0 },
  { id: 'ATT-EMP003-2026-05', employee_id: 'EMP003', month: '2026-05', total_days: 31, working_days: 29, lop_days: 2, overtime_hours: 5 },
  { id: 'ATT-EMP004-2026-05', employee_id: 'EMP004', month: '2026-05', total_days: 31, working_days: 31, lop_days: 0, overtime_hours: 0 },
  { id: 'ATT-EMP005-2026-05', employee_id: 'EMP005', month: '2026-05', total_days: 31, working_days: 28, lop_days: 3, overtime_hours: 2 }
];

const SEED_LEAVES: LeaveApplication[] = [
  {
    id: 'LV001',
    employee_id: 'EMP002',
    employee_name: 'Priya Patel',
    company: 'SVN-II',
    leave_type: 'PL',
    start_date: '2026-05-12',
    end_date: '2026-05-12',
    days: 1,
    reason: 'Family event in hometown',
    status: 'APPROVED'
  },
  {
    id: 'LV002',
    employee_id: 'EMP003',
    employee_name: 'Amit Mishra',
    company: 'Sakar-I',
    leave_type: 'SL',
    start_date: '2026-05-18',
    end_date: '2026-05-19',
    days: 2,
    reason: 'Suffering from seasonal fever',
    status: 'APPROVED'
  }
];

class MockDatabase {
  run(sql: string, paramsOrCb?: any, cb?: any) {
    const callback = typeof paramsOrCb === 'function' ? paramsOrCb : cb;
    if (callback) {
      setTimeout(() => callback(null), 0);
    }
    return this;
  }
  all(sql: string, paramsOrCb?: any, cb?: any) {
    const callback = typeof paramsOrCb === 'function' ? paramsOrCb : cb;
    const rows: any[] = [];
    if (callback) {
      setTimeout(() => callback(null, rows), 0);
    }
    return this;
  }
  serialize(cb: () => void) {
    cb();
  }
  close(cb?: any) {
    if (cb) setTimeout(() => cb(null), 0);
  }
}

export class PayrollDatabase {
  private data: Schema = {
    employees: [],
    attendance: [],
    payroll_runs: [],
    payslips: [],
    leave_applications: [],
    ff_settlements: [],
    loans: [],
    departments: [],
    companies: [],
    salary_revisions: [],
    audit_logs: [],
    assets: [],
    travel_reimbursements: [],
    broadcasts: [],
    attendance_corrections: [],
    compoff_requests: [],
    overtime_requests: [],
    users: [],
    hods: [],
    compoff_ledger: [],
    policies: [],
    policy_acknowledgements: [],
    gate_passes: [],
    loan_policy: null
  };

  private dbSqlite!: any;
  public inMemoryOnly: boolean = false;
  private supabaseAdmin: any;
  /** When true, persistData() will NOT push to Supabase (seed data protection). */
  private loadedFromSeed: boolean = false;

  /**
   * @param supabaseAdmin  Optional Supabase client (service_role key).
   *                       When provided, init() loads from Supabase and
   *                       persistData() pushes to Supabase.
   */
  constructor(supabaseAdmin?: any) {
    this.supabaseAdmin = supabaseAdmin || null;
    // constructor runs synchronously; we call init() from server.ts and await it
  }

  public async init(): Promise<void> {
    // 0. If Supabase client provided, load from cloud first (Vercel path)
    if (this.supabaseAdmin) {
      try {
        // Wrap Supabase query with a timeout to prevent Vercel function hangs
        const TIMEOUT_MS = 10_000;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Supabase query timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        );
        const queryPromise = this.supabaseAdmin
          .from('vetan_erp_store')
          .select('payload')
          .eq('id', 'live')
          .maybeSingle();

        const { data: row, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (!error && row?.payload && typeof row.payload === 'object') {
          const payload = row.payload;
          if (Array.isArray(payload.employees) && payload.employees.length > 0) {
            this.data = { ...this.data, ...payload };
            // Use MockDatabase so sync calls are no-ops
            this.dbSqlite = new MockDatabase();
            this.inMemoryOnly = true;
            this.loadedFromSeed = false; // Real data loaded — allow persistData()
            this.enforceCompanyCorrections();
            console.log(`Loaded ERP data from Supabase (${this.data.employees.length} employees).`);
            return;
          }
        }
        console.warn('Supabase store empty or unavailable, falling back to local storage.');
      } catch (e: any) {
        console.error('Supabase init failed, falling back to local storage:', e.message || e);
      }
      // Mark that we fell back to seed data — NEVER allow persistData() to push this to Supabase
      this.loadedFromSeed = true;
      console.warn('[SAFETY] loadedFromSeed = true — persistData() will NOT push to Supabase until real data is loaded.');
    }

    // 1. Try to load from persistent JSON backup first
    const backupPath = path.join(process.cwd(), 'payroll_persisted_store.json');
    let loadedFromBackup = false;
    if (fs.existsSync(backupPath)) {
      try {
        const raw = fs.readFileSync(backupPath, 'utf-8');
        this.data = JSON.parse(raw);
        loadedFromBackup = true;
        console.log('Loaded schema data from JSON backup file on startup.');
      } catch (err) {
        console.error('Failed to parse persisted JSON store:', err);
      }
    }

    // 2. Try to import sqlite3 dynamically
    let sqlite3Mod: any = null;
    try {
      const imported = await import('sqlite3');
      sqlite3Mod = imported.default || imported;
      sqlite3 = sqlite3Mod;
    } catch (err: any) {
      console.error('sqlite3 package could not be loaded dynamically (likely native binary incompatibility):', err);
    }

    return new Promise<void>((originalResolve, reject) => {
      const resolve = () => {
        this.enforceCompanyCorrections();
        originalResolve();
      };
      // Helper to wrap database run commands for JSON persistence
      const wrapDatabase = (dbInstance: any) => {
        if (!dbInstance) return;
        const originalRun = dbInstance.run;
        dbInstance.run = (...args: any[]) => {
          let callback: any = null;
          let newArgs = [...args];
          if (args.length > 0 && typeof args[args.length - 1] === 'function') {
            callback = args[args.length - 1];
            newArgs[newArgs.length - 1] = (...callbackArgs: any[]) => {
              this.persistData();
              callback(...callbackArgs);
            };
          } else {
            newArgs.push(() => {
              this.persistData();
            });
          }
          const res = originalRun.apply(dbInstance, newArgs);
          this.persistData();
          return res;
        };
      };

      // Helper function to initialize with seed data directly in memory (Level 2 Mock fallback)
      const initPureJSInMemory = () => {
        console.warn('FALLBACK: Initializing pure JavaScript in-memory database mode.');
        this.inMemoryOnly = true;
        this.dbSqlite = new MockDatabase();
        wrapDatabase(this.dbSqlite);
        try {
          if (!loadedFromBackup) {
            this.seedDataInMemoryDirectly();
            this.persistData(); // save initial seed to JSON
          }
          console.log('Pure JavaScript in-memory database initialized and seeded successfully.');
          resolve();
        } catch (seedErr: any) {
          console.error('Failed to seed pure JS in-memory database:', seedErr);
          reject(seedErr);
        }
      };

      // Helper function to attempt opening a SQLite database (file or :memory:)
      const tryConnectSQLite = (dbPathOrMemory: string) => {
        console.log(`Attempting to open SQLite database at: ${dbPathOrMemory}`);
        this.dbSqlite = new sqlite3Mod.Database(dbPathOrMemory, (err: any) => {
          if (err) {
            console.error(`Failed to open SQLite database at ${dbPathOrMemory}:`, err);
            if (dbPathOrMemory !== ':memory:') {
              console.warn('Falling back to in-memory SQLite database (:memory:)...');
              tryConnectSQLite(':memory:');
            } else {
              initPureJSInMemory();
            }
            return;
          }

          // If connected, serialize and set up tables & data
          this.dbSqlite.serialize(() => {
            try {
              this.createTables();
              wrapDatabase(this.dbSqlite);

              if (loadedFromBackup) {
                // Restore backup into the SQLite tables
                this.restoreFullBackupJSON(this.data)
                  .then(() => {
                    console.log('Successfully restored loaded backup data into SQLite tables.');
                    resolve();
                  })
                  .catch((restoreErr: any) => {
                    console.error('Error restoring backup data into SQLite tables:', restoreErr);
                    // Continue anyway, we have the backup in memory
                    resolve();
                  });
              } else {
                this.loadAndSeed()
                  .then(() => {
                    console.log(`SQLite database successfully initialized and loaded/seeded from: ${dbPathOrMemory}`);
                    if (dbPathOrMemory === ':memory:') {
                      this.inMemoryOnly = true;
                    }
                    this.persistData(); // save initial seed to JSON
                    resolve();
                  })
                  .catch((seedErr: any) => {
                    console.error(`Error seeding SQLite database at ${dbPathOrMemory}:`, seedErr);
                    if (dbPathOrMemory !== ':memory:') {
                      console.warn('Falling back to in-memory SQLite database (:memory:) due to seeding error...');
                      tryConnectSQLite(':memory:');
                    } else {
                      initPureJSInMemory();
                    }
                  });
              }
            } catch (setupErr: any) {
              console.error(`Exception setting up database tables at ${dbPathOrMemory}:`, setupErr);
              if (dbPathOrMemory !== ':memory:') {
                console.warn('Falling back to in-memory SQLite database (:memory:) due to setup exception...');
                tryConnectSQLite(':memory:');
              } else {
                initPureJSInMemory();
              }
            }
          });
        });
      };

      // Start connection process
      if (sqlite3Mod && sqlite3Mod.Database) {
        try {
          tryConnectSQLite(DB_SQLITE_FILE);
        } catch (sqliteInitErr: any) {
          console.error('Exception thrown during sqlite3 connection attempt:', sqliteInitErr);
          tryConnectSQLite(':memory:');
        }
      } else {
        console.warn('sqlite3 is not available. Falling back immediately to Pure JS In-Memory Mode.');
        initPureJSInMemory();
      }
    });
  }

  private enforceCompanyCorrections() {
    console.log('Enforcing correct company names and addresses...');
    const corrections = [
      {
        id: 'SVN-1',
        name: 'SVN Opto Electronics Pvt Ltd',
        registered_office: 'Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210',
        factory_address: 'Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210'
      },
      {
        id: 'SVN-II',
        name: 'SVN Opto Electronics Pvt Ltd',
        registered_office: 'Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210',
        factory_address: 'Survey No 370 (2)/1, Premises no. - 2, Building no. 1 & 2, Kachigam, Daman 396210'
      },
      {
        id: 'Sakar-I',
        name: 'Sakar Electricals & Electronics Pvt Ltd',
        registered_office: 'Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210',
        factory_address: 'Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210'
      },
      {
        id: 'Sakar-III',
        name: 'Sakar Electricals & Electronics Pvt Ltd',
        registered_office: 'Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210',
        factory_address: 'Plot No 60, Daman Ganga Industrial Park, Dungra, Vapi (Gujarat)'
      },
      {
        id: 'Flare-1',
        name: 'Flare Luminaires Pvt. Ltd.',
        registered_office: 'Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210',
        factory_address: 'Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210'
      },
      {
        id: 'Zenivo-1',
        name: 'Zenivo Opto Electronics Pvt Ltd',
        registered_office: 'Survey No 98/8, Daman Industrial Estate, Kadlya, Daman',
        factory_address: 'Survey No 98/8, Daman Industrial Estate, Kadlya, Daman'
      }
    ];

    if (!this.data.companies) {
      this.data.companies = [];
    }

    for (const corr of corrections) {
      // 1. Update in memory schema
      const found = this.data.companies.find(c => c.id === corr.id);
      if (found) {
        found.name = corr.name;
        found.registered_office = corr.registered_office;
        found.factory_address = corr.factory_address;
      } else {
        this.data.companies.push({
          id: corr.id,
          name: corr.name,
          unit_name: corr.id === 'SVN-1' ? 'Unit I' : corr.id === 'SVN-II' ? 'Unit II' : corr.id === 'Sakar-I' ? 'Unit I' : corr.id === 'Sakar-III' ? 'Unit III' : 'Unit I',
          logo: '',
          registered_office: corr.registered_office,
          factory_address: corr.factory_address,
          gst_number: '',
          pan_number: '',
          tan_number: '',
          cin_number: '',
          pf_number: '',
          esic_number: '',
          pt_number: ''
        });
      }

      // 2. Update in SQLite if database is opened
      if (this.dbSqlite && typeof this.dbSqlite.run === 'function' && !this.inMemoryOnly) {
        this.dbSqlite.run(
          `UPDATE companies SET name = ?, registered_office = ?, factory_address = ? WHERE id = ?`,
          [corr.name, corr.registered_office, corr.factory_address, corr.id],
          (err: any) => {
            if (err) console.error(`Error applying SQLite company correction for ${corr.id}:`, err);
          }
        );
      }
    }

    this.persistData();
  }

  private seedDataInMemoryDirectly() {
    this.data.employees = [...SEED_EMPLOYEES];
    this.data.attendance = [...SEED_ATTENDANCE];
    this.data.leave_applications = [...SEED_LEAVES];
    this.data.departments = ['Production', 'QC', 'Maintenance', 'Stores', 'Purchase', 'Accounts', 'HR', 'Dispatch', 'Sales', 'Marketing', 'R&D', 'Administration'];
    this.data.companies = [
      {
        id: 'SVN-1',
        name: 'SVN Opto Electronics Pvt Ltd',
        unit_name: 'Unit I',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210',
        factory_address: 'Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210',
        gst_number: '24AAACS9012J1Z3',
        pan_number: 'AAACS9012J',
        tan_number: 'BRDA01234D',
        cin_number: 'U31900GJ2015PTC085123',
        pf_number: 'GJ/BAR/0045621/000',
        esic_number: '37000451230001001',
        pt_number: 'PEC240102034'
      },
      {
        id: 'SVN-II',
        name: 'SVN Opto Electronics Pvt Ltd',
        unit_name: 'Unit II',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210',
        factory_address: 'Survey No 370 (2)/1, Premises no. - 2, Building no. 1 & 2, Kachigam, Daman 396210',
        gst_number: '24AAACS9012J2Z4',
        pan_number: 'AAACS9012J',
        tan_number: 'BRDA01234E',
        cin_number: 'U31900GJ2015PTC085123',
        pf_number: 'GJ/BAR/0045621/001',
        esic_number: '37000451230001002',
        pt_number: 'PEC240102035'
      },
      {
        id: 'Sakar-I',
        name: 'Sakar Electricals & Electronics Pvt Ltd',
        unit_name: 'Unit I',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210',
        factory_address: 'Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210',
        gst_number: '24AABCS4512A1Z1',
        pan_number: 'AABCS4512A',
        tan_number: 'BRDA04512A',
        cin_number: 'U31900GJ2012PTC074321',
        pf_number: 'GJ/BAR/0034125/000',
        esic_number: '37000341250001001',
        pt_number: 'PEC240104512'
      },
      {
        id: 'Sakar-III',
        name: 'Sakar Electricals & Electronics Pvt Ltd',
        unit_name: 'Unit III',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210',
        factory_address: 'Plot No 60, Daman Ganga Industrial Park, Dungra, Vapi (Gujarat)',
        gst_number: '24AABCS4512A3Z3',
        pan_number: 'AABCS4512A',
        tan_number: 'BRDA04512B',
        cin_number: 'U31900GJ2012PTC074321',
        pf_number: 'GJ/BAR/0034125/002',
        esic_number: '37000341250001002',
        pt_number: 'PEC240104513'
      },
      {
        id: 'Flare-1',
        name: 'Flare Luminaires Pvt Ltd',
        unit_name: 'Unit I',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2270%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2236%22%20fill%3D%22%23E11D48%22%3EFLARE%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210',
        factory_address: 'Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210',
        gst_number: '24AAFCS1122K1Z9',
        pan_number: 'AAFCS1122K',
        tan_number: 'BRDA09988D',
        cin_number: 'U72200GJ2018PTC102948',
        pf_number: 'GJ/BAR/0099111/000',
        esic_number: '37000991110001001',
        pt_number: 'PEC240109911'
      },
      {
        id: 'Zenivo-1',
        name: 'Zenivo Opto Electronics Pvt Ltd',
        unit_name: 'Unit I',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2270%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2236%22%20fill%3D%22%232563EB%22%3EZENIVO%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No 98/8, Daman Industrial Estate, Kadlya, Daman',
        factory_address: 'Survey No 98/8, Daman Industrial Estate, Kadlya, Daman',
        gst_number: '24AAZCS3344L1Z2',
        pan_number: 'AAZCS3344L',
        tan_number: 'BRDA07766E',
        cin_number: 'U72300GJ2019PTC108247',
        pf_number: 'GJ/BAR/0088222/000',
        esic_number: '37000882220001001',
        pt_number: 'PEC240108822'
      }
    ];

    const month = '2026-05';
    const computedSlips: Payslip[] = [];
    let gross_total = 0;
    let deduct_total = 0;
    let net_total = 0;

    for (const emp of this.data.employees) {
      const att = this.data.attendance.find(a => a.employee_id === emp.id) || {
        total_days: 31,
        working_days: 31,
        lop_days: 0,
        overtime_hours: 0,
        id: `ATT-${emp.id}-${month}`,
        employee_id: emp.id,
        month
      };
      
      const slip = this.calculateSingleSlip(emp, att, month);
      computedSlips.push(slip);

      gross_total += slip.gross_salary;
      deduct_total += slip.total_deductions;
      net_total += slip.net_salary;
    }

    this.data.payroll_runs = [
      {
        id: `RUN-${month}`,
        month,
        status: 'CLOSED',
        processed_at: new Date().toISOString(),
        total_employees: computedSlips.length,
        total_gross: gross_total,
        total_deductions: deduct_total,
        total_net: net_total
      }
    ];
    this.data.payslips = computedSlips;
    this.data.audit_logs = [];
    this.data.ff_settlements = [];
    this.data.loans = [];
    this.data.salary_revisions = [];
    this.data.assets = [];
    this.data.travel_reimbursements = [];
    this.data.broadcasts = [];
    this.data.users = [
      { id: 'USR001', username: 'vishnu', name: 'Vishnu Arrawatia', role: 'SUPER_HR', title: 'Super Admin', company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'], password: 'Varrawatia', disabled: false },
      { id: 'USR011', username: 'varrawatia', name: 'Varrawatia (Admin)', role: 'SUPER_HR', title: 'Super Admin', company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'], password: 'Varrawatia', disabled: false },
      { id: 'USR002', username: 'vijay', name: 'Mr. V. K. Saraf (MD)', role: 'MANAGEMENT', title: 'Managing Director', company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'], password: 'VKS', disabled: false },
      { id: 'USR012', username: 'vks', name: 'VKS (MD)', role: 'MANAGEMENT', title: 'Managing Director', company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'], password: 'VKS', disabled: false },
      { id: 'USR003', username: 'vijendra', name: 'Vijendra', role: 'COMPANY_HR', title: 'HR Officer (SVN Unit I)', company_rights: ['SVN-1'], password: 'vijendra', disabled: false },
      { id: 'USR004', username: 'manisha_s', name: 'Manisha Sapate', role: 'COMPANY_HR', title: 'HR Officer (SVN Unit II)', company_rights: ['SVN-II'], password: 'manisha_s', disabled: false },
      { id: 'USR005', username: 'manisha', name: 'Manisha', role: 'COMPANY_HR', title: 'HR Officer (Sakar Unit I)', company_rights: ['Sakar-I'], password: 'manisha', disabled: false },
      { id: 'USR006', username: 'indraprakash', name: 'Indraprakash', role: 'COMPANY_HR', title: 'HR Officer (Sakar Unit III)', company_rights: ['Sakar-III'], password: 'indraprakash', disabled: false },
      { id: 'USR007', username: 'nilesh', name: 'Nilesh', role: 'COMPANY_HR', title: 'HR Officer (Flare)', company_rights: ['Flare-1'], password: 'nilesh', disabled: false },
      { id: 'USR008', username: 'pinki', name: 'Pinki', role: 'COMPANY_HR', title: 'HR Officer (Zenivo)', company_rights: ['Zenivo-1'], password: 'pinki', disabled: false },
      { id: 'USR009', username: 'audit', name: 'Auditor', role: 'AUDITOR', title: 'Statutory Auditor', company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'], password: 'audit', disabled: false },
      { id: 'USR020', username: 'acct_vks', name: 'Accounts - VKS', role: 'AUDITOR', title: 'Accounts Officer (All Units)', company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'], password: 'VKS123', disabled: false },
      { id: 'USR021', username: 'acct_svn1', name: 'Accounts - SVN I', role: 'AUDITOR', title: 'Accounts Officer (SVN-I)', company_rights: ['SVN-1'], password: 'SVN1ACC', disabled: false },
      { id: 'USR022', username: 'acct_svn2', name: 'Accounts - SVN II', role: 'AUDITOR', title: 'Accounts Officer (SVN-II)', company_rights: ['SVN-II'], password: 'SVN2ACC', disabled: false },
      { id: 'USR023', username: 'acct_sakar', name: 'Accounts - Sakar', role: 'AUDITOR', title: 'Accounts Officer (Sakar)', company_rights: ['Sakar-I', 'Sakar-III'], password: 'SAKACC', disabled: false }
    ];
  }

  private createTables() {
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT,
      unit_name TEXT,
      logo TEXT,
      registered_office TEXT,
      factory_address TEXT,
      gst_number TEXT,
      pan_number TEXT,
      tan_number TEXT,
      cin_number TEXT,
      pf_number TEXT,
      esic_number TEXT,
      pt_number TEXT,
      settings TEXT
    )`, () => {
      // Inline migration to add settings column to existing companies table
      this.dbSqlite.run(`ALTER TABLE companies ADD COLUMN settings TEXT`, () => {});
    });

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS departments (
      name TEXT PRIMARY KEY
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT,
      company TEXT,
      designation TEXT,
      department TEXT,
      email TEXT,
      phone TEXT,
      joining_date TEXT,
      exit_date TEXT,
      status TEXT,
      bank_name TEXT,
      bank_account TEXT,
      ifsc TEXT,
      pan TEXT,
      uan TEXT,
      base_salary REAL,
      hra REAL,
      special_allowance REAL,
      da REAL,
      pf_opt_in INTEGER,
      esic_opt_in INTEGER,
      professional_tax_opt_in INTEGER,
      leave_balance_pl REAL,
      leave_balance_cl REAL,
      leave_balance_sl REAL,
      qualification TEXT,
      location TEXT,
      vehicle_detail TEXT,
      prev_company_name TEXT,
      prev_company_location TEXT,
      total_experience TEXT,
      shift_timing TEXT,
      password TEXT,
      birth_year INTEGER,
      needs_password_change INTEGER,
      aadhaar_number TEXT,
      dob TEXT,
      gender TEXT,
      marital_status TEXT,
      emergency_contact TEXT,
      blood_group TEXT,
      esic_number TEXT,
      cost_center TEXT,
      reporting_manager TEXT,
      employee_category TEXT,
       reporting_hod TEXT,
      reporting_hod_name TEXT,
      conveyance_allowance REAL,
      edu_allowance REAL,
      medical_allowance REAL,
      hidden_salary_heads TEXT,
      salary_structure_type TEXT,
      bonus_payable REAL,
      ctc_salary REAL,
      reporting_hod_code TEXT,
      is_hod INTEGER,
      can_approve_leave INTEGER,
      can_approve_misspunch INTEGER,
      photo TEXT
    )`, () => {
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN reporting_hod TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN reporting_hod_name TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN conveyance_allowance REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN edu_allowance REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN medical_allowance REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN hidden_salary_heads TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN salary_structure_type TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN bonus_payable REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN ctc_salary REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN reporting_hod_code TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN is_hod INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN can_approve_leave INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN can_approve_misspunch INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN photo TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN qualification TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN location TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN vehicle_detail TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN prev_company_name TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN prev_company_location TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN total_experience TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN shift_timing TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN password TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN birth_year INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN needs_password_change INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN aadhaar_number TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN dob TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN gender TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN marital_status TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN emergency_contact TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN blood_group TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN esic_number TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN cost_center TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN reporting_manager TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN employee_category TEXT`, () => {});
      this.dbSqlite.run(`UPDATE employees SET salary_structure_type = 'FIXED' WHERE salary_structure_type IS NULL OR salary_structure_type = 'PERCENTAGE'`, () => {});
    });

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      month TEXT,
      total_days INTEGER,
      working_days INTEGER,
      lop_days INTEGER,
      overtime_hours REAL,
      present INTEGER,
      absent INTEGER,
      weekly_off INTEGER,
      paid_holiday INTEGER,
      leave INTEGER,
      lwp INTEGER,
      ot_hours REAL,
      is_locked INTEGER DEFAULT 0
    )`, () => {
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN present INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN absent INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN weekly_off INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN paid_holiday INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN leave INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN lwp INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN ot_hours REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN is_locked INTEGER DEFAULT 0`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN in_time TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN out_time TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN leave_pl REAL DEFAULT 0`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN leave_cl REAL DEFAULT 0`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN leave_sl REAL DEFAULT 0`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN compoff_used REAL DEFAULT 0`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN out_time TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN pay_days REAL`, () => {});
    });

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS payroll_runs (
      id TEXT PRIMARY KEY,
      month TEXT,
      status TEXT,
      processed_at TEXT,
      total_employees INTEGER,
      total_gross REAL,
      total_deductions REAL,
      total_net REAL
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS payslips (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      designation TEXT,
      department TEXT,
      pan TEXT,
      uan TEXT,
      bank_name TEXT,
      bank_account TEXT,
      ifsc TEXT,
      month TEXT,
      rate_base_salary REAL,
      rate_hra REAL,
      rate_special_allowance REAL,
      rate_da REAL,
      rate_edu_allowance REAL,
      rate_medical_allowance REAL,
      rate_conveyance_allowance REAL,
      earned_base_salary REAL,
      earned_hra REAL,
      earned_special_allowance REAL,
      earned_da REAL,
      earned_edu_allowance REAL,
      earned_medical_allowance REAL,
      earned_conveyance_allowance REAL,
      overtime_pay REAL,
      lop_deduction REAL,
      pf_deduction REAL,
      esic_deduction REAL,
      professional_tax REAL,
      tds REAL,
      custom_deductions REAL,
      loan_deduction REAL,
      salary_advance REAL,
      gross_salary REAL,
      total_deductions REAL,
      net_salary REAL,
      employer_pf REAL,
      employer_esic REAL,
      payment_status TEXT DEFAULT 'PENDING',
      payment_date TEXT,
      hidden_salary_heads TEXT,
      salary_structure_type TEXT
    )`, () => {
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN hidden_salary_heads TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN salary_structure_type TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN salary_advance REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN bonus_incentive REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN performance_incentive REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN attendance_incentive REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN production_incentive REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN reimbursement REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN special_allowance_addition REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN arrear_payment REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN other_earnings REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN canteen_deduction REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN uniform_deduction REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN notice_deduction REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN mobile_deduction REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN damage_deduction REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN remarks TEXT`, () => {});
    });

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS leave_applications (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      leave_type TEXT,
      start_date TEXT,
      end_date TEXT,
      days INTEGER,
      reason TEXT,
      status TEXT,
      applied_date TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      hod_approved_date TEXT,
      hr_approved_date TEXT,
      hod_id TEXT,
      hr_id TEXT,
      escalated_reminder_sent INTEGER DEFAULT 0
    )`, () => {
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN applied_date TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN reporting_hod TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN reporting_hod_name TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN hod_approved_date TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN hr_approved_date TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN hod_id TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN hr_id TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN escalated_reminder_sent INTEGER DEFAULT 0`, () => {});
    });

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS attendance_corrections (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      date TEXT,
      original_status TEXT,
      requested_status TEXT,
      reason TEXT,
      applied_date TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      status TEXT,
      hod_approved_date TEXT,
      hr_approved_date TEXT,
      hod_id TEXT,
      hr_id TEXT,
      escalated_reminder_sent INTEGER DEFAULT 0
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS compoff_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      date TEXT,
      reason TEXT,
      applied_date TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      status TEXT,
      hod_approved_date TEXT,
      hr_approved_date TEXT,
      hod_id TEXT,
      hr_id TEXT,
      escalated_reminder_sent INTEGER DEFAULT 0
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS overtime_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      date TEXT,
      hours REAL,
      reason TEXT,
      applied_date TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      status TEXT,
      hod_approved_date TEXT,
      hr_approved_date TEXT,
      hod_id TEXT,
      hr_id TEXT,
      escalated_reminder_sent INTEGER DEFAULT 0
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS ff_settlements (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      last_working_day TEXT,
      gratuity_earned REAL,
      earned_leave_encashment REAL,
      unpaid_salary_days INTEGER,
      unpaid_salary_earned REAL,
      notice_period_deduction REAL,
      pending_bonus REAL,
      gross_earnings REAL,
      gross_deductions REAL,
      net_settlement_pay REAL,
      status TEXT
    )`);

    this.dbSqlite.serialize(() => {
      this.dbSqlite.run(`ALTER TABLE ff_settlements ADD COLUMN pending_bonus REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE ff_settlements ADD COLUMN meta_json TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN opening_balance REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN opening_date TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN skipped_months TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN additional_loans TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN loan_number TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN loan_type TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN interest_rate REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN total_installments INTEGER`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN emi_start_month TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN approval_authority TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN remarks TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN settlements TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN closed_date TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN closure_reference TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN audit_trail TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_id TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_code TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_name TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_department TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_monthly_salary REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_guarantee_limit REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_id TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_code TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_name TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_department TEXT`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_monthly_salary REAL`, () => {});
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_guarantee_limit REAL`, () => {});
    });

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      amount REAL,
      month TEXT,
      monthly_deduction REAL,
      reason TEXT,
      status TEXT,
      opening_balance REAL DEFAULT 0
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS bonus_provisions (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      month TEXT,
      base_salary REAL,
      bonus_rate REAL DEFAULT 8.33,
      bonus_amount REAL,
      status TEXT DEFAULT 'ACCUMULATED',
      paid_in_month TEXT,
      created_at TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS salary_revisions (
      id TEXT PRIMARY KEY,
      employee_code TEXT,
      old_salary REAL,
      new_salary REAL,
      effective_date TEXT,
      reason TEXT,
      approved_by TEXT,
      created_at TEXT,
      remarks TEXT,
      increment_amount REAL,
      old_structure TEXT,
      new_structure TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT,
      details TEXT,
      user_name TEXT,
      timestamp TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      asset_name TEXT,
      serial_number TEXT,
      type TEXT,
      issue_date TEXT,
      return_date TEXT,
      status TEXT,
      condition TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS travel_reimbursements (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      month TEXT,
      fuel_liters REAL,
      rate_per_liter REAL,
      amount REAL,
      travel_purpose TEXT,
      status TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      title TEXT,
      message TEXT,
      target_type TEXT,
      target_value TEXT,
      created_at TEXT,
      created_by TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      email_address TEXT,
      salary_month TEXT,
      sent_at TEXT,
      delivery_status TEXT,
      error_message TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS smtp_settings (
      id TEXT PRIMARY KEY,
      smtp_server TEXT,
      smtp_port INTEGER,
      sender_email TEXT,
      sender_password TEXT,
      provider TEXT
    )`);

    this.dbSqlite.run(`INSERT OR IGNORE INTO smtp_settings (id, smtp_server, smtp_port, sender_email, sender_password, provider) VALUES ('DEFAULT', 'smtp.gmail.com', 587, 'payroll@vetanerp.com', 'SecurePass123', 'Gmail')`);

    // System settings table to store PIN and configurations securely
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`, () => {
      const hashedDefault = crypto.createHash('sha256').update('1234').digest('hex');
      this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('super_admin_pin', ?)`, [hashedDefault]);
      this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('pin_changed_from_default', '0')`);
      this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('production_security_enabled', '0')`);
    });

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      name TEXT,
      role TEXT,
      company_rights TEXT,
      title TEXT,
      password TEXT,
      disabled INTEGER DEFAULT 0
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS hods (
      id TEXT PRIMARY KEY,
      name TEXT,
      department TEXT,
      company TEXT,
      active INTEGER DEFAULT 1
    )`);

    const defaultUsers = [
      { id: 'USR001', username: 'vishnu', name: 'Vishnu Arrawatia', role: 'SUPER_HR', title: 'Super Admin', company_rights: JSON.stringify(['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1']), password: 'Varrawatia', disabled: 0 },
      { id: 'USR011', username: 'varrawatia', name: 'Varrawatia (Admin)', role: 'SUPER_HR', title: 'Super Admin', company_rights: JSON.stringify(['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1']), password: 'Varrawatia', disabled: 0 },
      { id: 'USR002', username: 'vijay', name: 'Mr. V. K. Saraf (MD)', role: 'MANAGEMENT', title: 'Managing Director', company_rights: JSON.stringify(['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1']), password: 'VKS', disabled: 0 },
      { id: 'USR012', username: 'vks', name: 'VKS (MD)', role: 'MANAGEMENT', title: 'Managing Director', company_rights: JSON.stringify(['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1']), password: 'VKS', disabled: 0 },
      { id: 'USR003', username: 'vijendra', name: 'Vijendra', role: 'COMPANY_HR', title: 'HR Officer (SVN Unit I)', company_rights: JSON.stringify(['SVN-1']), password: 'vijendra', disabled: 0 },
      { id: 'USR004', username: 'manisha_s', name: 'Manisha Sapate', role: 'COMPANY_HR', title: 'HR Officer (SVN Unit II)', company_rights: JSON.stringify(['SVN-II']), password: 'manisha_s', disabled: 0 },
      { id: 'USR005', username: 'manisha', name: 'Manisha', role: 'COMPANY_HR', title: 'HR Officer (Sakar Unit I)', company_rights: JSON.stringify(['Sakar-I']), password: 'manisha', disabled: 0 },
      { id: 'USR006', username: 'indraprakash', name: 'Indraprakash', role: 'COMPANY_HR', title: 'HR Officer (Sakar Unit III)', company_rights: JSON.stringify(['Sakar-III']), password: 'indraprakash', disabled: 0 },
      { id: 'USR007', username: 'nilesh', name: 'Nilesh', role: 'COMPANY_HR', title: 'HR Officer (Flare)', company_rights: JSON.stringify(['Flare-1']), password: 'nilesh', disabled: 0 },
      { id: 'USR008', username: 'pinki', name: 'Pinki', role: 'COMPANY_HR', title: 'HR Officer (Zenivo)', company_rights: JSON.stringify(['Zenivo-1']), password: 'pinki', disabled: 0 },
      { id: 'USR009', username: 'audit', name: 'Auditor', role: 'AUDITOR', title: 'Statutory Auditor', company_rights: JSON.stringify(['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1']), password: 'audit', disabled: 0 }
    ];
    for (const u of defaultUsers) {
      this.dbSqlite.run(`INSERT OR IGNORE INTO users (id, username, name, role, company_rights, title, password, disabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.username, u.name, u.role, u.company_rights, u.title, u.password, u.disabled]
      );
    }

    const defaultHods = [
      { id: 'HOD001', name: 'Alok Sharma', department: 'Production', company: 'SVN-1', active: 1 },
      { id: 'HOD002', name: 'Ritesh Saxena', department: 'Quality', company: 'SVN-II', active: 1 },
      { id: 'HOD003', name: 'Sanjay Rawat', department: 'Maintenance', company: 'Sakar-I', active: 1 },
      { id: 'HOD004', name: 'Vimal Kumar', department: 'Logistics', company: 'Sakar-III', active: 1 }
    ];
    for (const h of defaultHods) {
      this.dbSqlite.run(`INSERT OR IGNORE INTO hods (id, name, department, company, active) VALUES (?, ?, ?, ?, ?)`,
        [h.id, h.name, h.department, h.company, h.active]
      );
    }

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS compoff_ledger (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      date_earned TEXT,
      reason TEXT,
      earned_days REAL,
      availed_days REAL,
      balance REAL,
      expiry_date TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      name TEXT,
      content TEXT,
      pdf_url TEXT,
      version TEXT,
      is_archived INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS policy_acknowledgements (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      policy_name TEXT,
      read_date TEXT,
      acknowledgement_date TEXT,
      version TEXT
    )`);

    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS gate_passes (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      target_company TEXT,
      purpose TEXT,
      applied_date TEXT,
      status TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      departure_time TEXT,
      arrival_time TEXT,
      return_departure_time TEXT,
      return_arrival_time TEXT,
      out_gate_security_id TEXT,
      in_gate_security_id TEXT,
      return_out_gate_security_id TEXT,
      return_in_gate_security_id TEXT,
      destination_type TEXT,
      vendor_location TEXT
    )`);

    // Add columns dynamically if the table already existed from a previous run
    this.dbSqlite.run(`ALTER TABLE gate_passes ADD COLUMN destination_type TEXT`, (err: any) => { /* ignore if already exists */ });
    this.dbSqlite.run(`ALTER TABLE gate_passes ADD COLUMN vendor_location TEXT`, (err: any) => { /* ignore if already exists */ });

    // Shifts table
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS shifts (
      code TEXT PRIMARY KEY,
      name TEXT,
      start_time TEXT,
      end_time TEXT,
      grace_time INTEGER,
      weekly_off TEXT
    )`, () => {
      const defaultShifts = [
        { code: 'GEN', name: 'General Shift', start_time: '09:00 AM', end_time: '06:30 PM', grace_time: 15, weekly_off: 'Sunday' },
        { code: 'PROD_A', name: 'Production Shift A', start_time: '08:00 AM', end_time: '05:30 PM', grace_time: 15, weekly_off: 'Sunday' },
        { code: 'PROD_B', name: 'Production Shift B', start_time: '12:00 PM', end_time: '09:00 PM', grace_time: 15, weekly_off: 'Sunday' },
        { code: 'SEC', name: 'Security Shift', start_time: '08:00 AM', end_time: '08:00 PM', grace_time: 15, weekly_off: 'Sunday' },
        { code: 'NIGHT', name: 'Night Shift', start_time: '09:00 PM', end_time: '06:00 AM', grace_time: 15, weekly_off: 'Sunday' }
      ];
      for (const s of defaultShifts) {
        this.dbSqlite.run(`INSERT OR IGNORE INTO shifts (code, name, start_time, end_time, grace_time, weekly_off) VALUES (?, ?, ?, ?, ?, ?)`,
          [s.code, s.name, s.start_time, s.end_time, s.grace_time, s.weekly_off]
        );
      }
    });
  }

  private loadAndSeed(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dbSqlite.get(`SELECT value FROM system_settings WHERE key = 'database_seeded'`, (err: any, row: any) => {
        if (err) {
          // Fallback to checking employees if settings query fails
          this.dbSqlite.all(`SELECT id FROM employees`, (err2: any, rows: any[]) => {
            if (err2) return reject(err2);
            if (!rows || rows.length === 0) {
              this.seedDatabase().then(() => {
                this.loadAllFromSQLite().then(resolve).catch(reject);
              }).catch(reject);
            } else {
              this.loadAllFromSQLite().then(resolve).catch(reject);
            }
          });
          return;
        }
        
        const isSeeded = row && row.value === '1';
        if (!isSeeded) {
          console.log('Database not seeded yet, seeding default data into SQLite...');
          this.seedDatabase().then(() => {
            this.dbSqlite.run(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('database_seeded', '1')`, () => {
              this.loadAllFromSQLite().then(resolve).catch(reject);
            });
          }).catch(reject);
        } else {
          this.loadAllFromSQLite().then(resolve).catch(reject);
        }
      });
    });
  }

  private async seedDatabase(): Promise<void> {
    const defaultCompanies = [
      {
        id: 'SVN-1',
        name: 'SVN Opto Electronics Pvt Ltd',
        unit_name: 'Unit I',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210',
        factory_address: 'Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210',
        gst_number: '24AAACS9012J1Z3',
        pan_number: 'AAACS9012J',
        tan_number: 'BRDA01234D',
        cin_number: 'U31900GJ2015PTC085123',
        pf_number: 'GJ/BAR/0045621/000',
        esic_number: '37000451230001001',
        pt_number: 'PEC240102034'
      },
      {
        id: 'SVN-II',
        name: 'SVN Opto Electronics Pvt Ltd',
        unit_name: 'Unit II',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210',
        factory_address: 'Survey No 370 (2)/1, Premises no. - 2, Building no. 1 & 2, Kachigam, Daman 396210',
        gst_number: '24AAACS9012J2Z4',
        pan_number: 'AAACS9012J',
        tan_number: 'BRDA01234E',
        cin_number: 'U31900GJ2015PTC085123',
        pf_number: 'GJ/BAR/0045621/001',
        esic_number: '37000451230001002',
        pt_number: 'PEC240102035'
      },
      {
        id: 'Sakar-I',
        name: 'Sakar Electricals & Electronics Pvt Ltd',
        unit_name: 'Unit I',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210',
        factory_address: 'Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210',
        gst_number: '24AABCS4512A1Z1',
        pan_number: 'AABCS4512A',
        tan_number: 'BRDA04512A',
        cin_number: 'U31900GJ2012PTC074321',
        pf_number: 'GJ/BAR/0034125/000',
        esic_number: '37000341250001001',
        pt_number: 'PEC240104512'
      },
      {
        id: 'Sakar-III',
        name: 'Sakar Electricals & Electronics Pvt Ltd',
        unit_name: 'Unit III',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210',
        factory_address: 'Plot No 60, Daman Ganga Industrial Park, Dungra, Vapi (Gujarat)',
        gst_number: '24AABCS4512A3Z3',
        pan_number: 'AABCS4512A',
        tan_number: 'BRDA04512B',
        cin_number: 'U31900GJ2012PTC074321',
        pf_number: 'GJ/BAR/0034125/002',
        esic_number: '37000341250001002',
        pt_number: 'PEC240104513'
      },
      {
        id: 'Flare-1',
        name: 'Flare Luminaires Pvt Ltd',
        unit_name: 'Unit I',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2270%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2236%22%20fill%3D%22%23E11D48%22%3EFLARE%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210',
        factory_address: 'Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210',
        gst_number: '24AAFCS1122K1Z9',
        pan_number: 'AAFCS1122K',
        tan_number: 'BRDA09988D',
        cin_number: 'U72200GJ2018PTC102948',
        pf_number: 'GJ/BAR/0099111/000',
        esic_number: '37000991110001001',
        pt_number: 'PEC240109911'
      },
      {
        id: 'Zenivo-1',
        name: 'Zenivo Opto Electronics Pvt Ltd',
        unit_name: 'Unit I',
        logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2270%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2236%22%20fill%3D%22%232563EB%22%3EZENIVO%3C%2Ftext%3E%3C%2Fsvg%3E',
        registered_office: 'Survey No 98/8, Daman Industrial Estate, Kadlya, Daman',
        factory_address: 'Survey No 98/8, Daman Industrial Estate, Kadlya, Daman',
        gst_number: '24AAZCS3344L1Z2',
        pan_number: 'AAZCS3344L',
        tan_number: 'BRDA07766E',
        cin_number: 'U72300GJ2019PTC108247',
        pf_number: 'GJ/BAR/0088222/000',
        esic_number: '37000882220001001',
        pt_number: 'PEC240108822'
      }
    ];

    const defaultDepts = [
      'Production', 'QC', 'Maintenance', 'Stores', 'Purchase', 'Accounts',
      'HR', 'Dispatch', 'Sales', 'Marketing', 'R&D', 'Administration'
    ];

    // Seed Companies
    for (const c of defaultCompanies) {
      await new Promise<void>((resolve, reject) => {
        this.dbSqlite.run(`INSERT OR IGNORE INTO companies (id, name, unit_name, logo, registered_office, factory_address, gst_number, pan_number, tan_number, cin_number, pf_number, esic_number, pt_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.name, c.unit_name, c.logo, c.registered_office, c.factory_address, c.gst_number, c.pan_number, c.tan_number, c.cin_number, c.pf_number, c.esic_number, c.pt_number],
          (err: any) => err ? reject(err) : resolve()
        );
      });
    }

    // Seed Departments
    for (const d of defaultDepts) {
      await new Promise<void>((resolve, reject) => {
        this.dbSqlite.run(`INSERT OR IGNORE INTO departments (name) VALUES (?)`, [d], (err: any) => err ? reject(err) : resolve());
      });
    }

    // Seed Employees
    for (const emp of SEED_EMPLOYEES) {
      let compCode = emp.company;
      if (compCode as string === 'SVN-1') compCode = 'SVN-1';
      else if (compCode as string === 'SVN II' || compCode as string === 'SVN-II') compCode = 'SVN-II';
      else if (compCode as string === 'Sakar I' || compCode as string === 'Sakar-I') compCode = 'Sakar-I';
      else if (compCode as string === 'Sakar III' || compCode as string === 'Sakar-III') compCode = 'Sakar-III';

      const phoneStr = emp.phone ? String(emp.phone).trim() : '0000';
      const last4 = phoneStr.length >= 4 ? phoneStr.slice(-4) : phoneStr.padStart(4, '0');
      const birthYearVal = emp.birth_year || 1995;
      const defaultPass = last4 + birthYearVal;

      await new Promise<void>((resolve, reject) => {
        this.dbSqlite.run(`INSERT OR IGNORE INTO employees (id, name, company, designation, department, email, phone, joining_date, status, bank_name, bank_account, ifsc, pan, uan, base_salary, hra, special_allowance, da, pf_opt_in, esic_opt_in, professional_tax_opt_in, leave_balance_pl, leave_balance_cl, leave_balance_sl, qualification, location, vehicle_detail, prev_company_name, prev_company_location, total_experience, shift_timing, password, birth_year, needs_password_change, aadhaar_number, dob, gender, marital_status, emergency_contact, blood_group, esic_number, cost_center, reporting_manager, employee_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            emp.id, emp.name, compCode, emp.designation, emp.department, emp.email, emp.phone, emp.joining_date, emp.status,
            emp.bank_name, emp.bank_account, emp.ifsc, emp.pan, emp.uan, emp.base_salary, emp.hra, emp.special_allowance, emp.da,
            emp.pf_opt_in ? 1 : 0, emp.esic_opt_in ? 1 : 0, emp.professional_tax_opt_in ? 1 : 0,
            18, 6, 6,
            emp.qualification || 'B.Tech (Electrical Engineering)',
            emp.location || 'Sakar Corporate Tower, Alkapuri',
            emp.vehicle_detail || 'GJ-06-HM-1234 (Honda Activa)',
            emp.prev_company_name || 'L&T Heavy Engineering',
            emp.prev_company_location || 'Vadodara, Gujarat',
            emp.total_experience || '4 Years',
            emp.shift_timing || '8:00 AM to 5:30 PM',
            defaultPass, birthYearVal, 1,
            emp.aadhaar_number || '123456789012', emp.dob || '1995-05-15', emp.gender || 'Male', emp.marital_status || 'Single',
            emp.emergency_contact || '9898989898', emp.blood_group || 'O+', emp.esic_number || '37000451230001001', emp.cost_center || 'Savli Unit I',
            emp.reporting_manager || 'Rahul Sharma', emp.employee_category || 'Staff'
          ],
          (err: any) => err ? reject(err) : resolve()
        );
      });
    }

    // Seed Attendance
    for (const a of SEED_ATTENDANCE) {
      await new Promise<void>((resolve, reject) => {
        this.dbSqlite.run(`INSERT OR IGNORE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.employee_id, a.month, a.total_days, a.working_days, a.lop_days, a.overtime_hours],
          (err: any) => err ? reject(err) : resolve()
        );
      });
    }

    // Seed Leaves
    for (const l of SEED_LEAVES) {
      await new Promise<void>((resolve, reject) => {
        this.dbSqlite.run(`INSERT OR IGNORE INTO leave_applications (id, employee_id, employee_name, company, leave_type, start_date, end_date, days, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.id, l.employee_id, l.employee_name, l.company, l.leave_type, l.start_date, l.end_date, l.days, l.reason, l.status],
          (err: any) => err ? reject(err) : resolve()
        );
      });
    }
    
    // Prepopulate payslips
    await this.prepopulatePayslips();
  }

  private prepopulatePayslips(): Promise<void> {
    return new Promise((resolve, reject) => {
      const month = '2026-05';
      const computedSlips: Payslip[] = [];
      let gross_total = 0;
      let deduct_total = 0;
      let net_total = 0;

      this.dbSqlite.all(`SELECT * FROM employees`, (err: any, rows: any[]) => {
        if (err) return reject(err);
        
        const employees = rows.map(r => ({
          ...r,
          pf_opt_in: r.pf_opt_in === 1,
          esic_opt_in: r.esic_opt_in === 1,
          professional_tax_opt_in: r.professional_tax_opt_in === 1,
          needs_password_change: r.needs_password_change === 1,
          conveyance_allowance: r.conveyance_allowance ?? 0,
          edu_allowance: r.edu_allowance ?? 0,
          medical_allowance: r.medical_allowance ?? 0,
          hidden_salary_heads: r.hidden_salary_heads || '',
          salary_structure_type: r.salary_structure_type || 'FIXED',
          is_hod: r.is_hod === 1,
          can_approve_leave: r.can_approve_leave === 1,
          can_approve_misspunch: r.can_approve_misspunch === 1,
          reporting_hod_code: r.reporting_hod_code || r.reporting_hod || '',
          photo: r.photo || ''
        }));

        this.dbSqlite.all(`SELECT * FROM attendance WHERE month = ?`, [month], (err2: any, attRows: any[]) => {
          if (err2) return reject(err2);

          for (const emp of employees) {
            const att = attRows.find(a => a.employee_id === emp.id) || {
              total_days: 31,
              working_days: 31,
              lop_days: 0,
              overtime_hours: 0
            };
            
            const slip = this.calculateSingleSlip(emp, att, month);
            computedSlips.push(slip);

            gross_total += slip.gross_salary;
            deduct_total += slip.total_deductions;
            net_total += slip.net_salary;
          }

          // Save to sqlite
          this.dbSqlite.serialize(() => {
            const runId = `RUN-${month}`;
            this.dbSqlite.run(`INSERT OR REPLACE INTO payroll_runs (id, month, status, processed_at, total_employees, total_gross, total_deductions, total_net) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [runId, month, 'CLOSED', new Date().toISOString(), computedSlips.length, gross_total, deduct_total, net_total]
            );

            for (const s of computedSlips) {
              this.dbSqlite.run(`INSERT OR REPLACE INTO payslips (id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month, rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance, earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance, overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction, salary_advance, gross_salary, total_deductions, net_salary, employer_pf, employer_esic, hidden_salary_heads, salary_structure_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
                [
                  s.id, s.employee_id, s.employee_name, s.designation, s.department, s.pan, s.uan, s.bank_name, s.bank_account, s.ifsc, s.month,
                  s.rate_base_salary, s.rate_hra, s.rate_special_allowance, s.rate_da, s.rate_edu_allowance || 0, s.rate_medical_allowance || 0, s.rate_conveyance_allowance || 0,
                  s.earned_base_salary, s.earned_hra, s.earned_special_allowance, s.earned_da, s.earned_edu_allowance || 0, s.earned_medical_allowance || 0, s.earned_conveyance_allowance || 0,
                  s.overtime_pay, s.lop_deduction, s.pf_deduction, s.esic_deduction, s.professional_tax, s.tds, s.custom_deductions, s.loan_deduction, s.salary_advance || 0,
                  s.gross_salary, s.total_deductions, s.net_salary, s.employer_pf, s.employer_esic,
                  s.hidden_salary_heads || null, s.salary_structure_type || 'FIXED'
                ]
              );
            }
            resolve();
          });
        });
      });
    });
  }

  private loadAllFromSQLite(): Promise<void> {
    if (this.inMemoryOnly || (this.dbSqlite && this.dbSqlite.constructor.name === 'MockDatabase')) {
      console.log('[loadAllFromSQLite] SQLite is running in Mock/In-Memory mode; bypassing loading from SQLite to preserve cached in-memory data.');
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.dbSqlite.serialize(() => {
        const p1 = new Promise<Employee[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM employees`, (err: any, rows: any[]) => {
            if (err) return rej(err);
            const mapped = rows.map(r => {
              const baseEmp = {
                ...r,
                da: 0,
                pf_opt_in: r.pf_opt_in === 1,
                esic_opt_in: r.esic_opt_in === 1,
                professional_tax_opt_in: r.professional_tax_opt_in === 1,
                needs_password_change: r.needs_password_change === 1,
                conveyance_allowance: r.conveyance_allowance ?? 0,
                edu_allowance: r.edu_allowance ?? 0,
                medical_allowance: r.medical_allowance ?? 0,
                bonus_payable: r.bonus_payable ?? 0,
                hidden_salary_heads: r.hidden_salary_heads || '',
                salary_structure_type: r.salary_structure_type || 'FIXED',
                is_hod: r.is_hod === 1,
                can_approve_leave: r.can_approve_leave === 1,
                can_approve_misspunch: r.can_approve_misspunch === 1,
                reporting_hod_code: r.reporting_hod_code || r.reporting_hod || '',
                photo: r.photo || ''
              };
              baseEmp.ctc_salary = this.computeCtcForEmployee(baseEmp);
              return baseEmp;
            });
            res(mapped);
          });
        });

        const p2 = new Promise<Attendance[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM attendance`, (err: any, rows: any[]) => err ? rej(err) : res(rows));
        });

        const p3 = new Promise<PayrollRun[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM payroll_runs`, (err: any, rows: any[]) => err ? rej(err) : res(rows));
        });

        const p4 = new Promise<Payslip[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM payslips`, (err: any, rows: any[]) => err ? rej(err) : res(rows));
        });

        const p5 = new Promise<LeaveApplication[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM leave_applications`, (err: any, rows: any[]) => err ? rej(err) : res(rows));
        });

        const p6 = new Promise<FullAndFinalSettlement[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM ff_settlements`, (err: any, rows: any[]) => err ? rej(err) : res(rows));
        });

        const p7 = new Promise<Loan[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM loans`, (err: any, rows: any[]) => {
            if (err) return rej(err);
            const mapped = (rows || []).map(r => {
              let skipped_months: string[] = [];
              let additional_loans: any[] = [];
              try { skipped_months = r.skipped_months ? JSON.parse(r.skipped_months) : []; } catch {}
              try { additional_loans = r.additional_loans ? JSON.parse(r.additional_loans) : []; } catch {}
              return {
                ...r,
                opening_balance: r.opening_balance !== null && r.opening_balance !== undefined ? Number(r.opening_balance) : Number(r.amount || 0),
                opening_date: r.opening_date || '2026-04-01',
                skipped_months: Array.isArray(skipped_months) ? skipped_months : [],
                additional_loans: Array.isArray(additional_loans) ? additional_loans : []
              };
            });
            res(mapped);
          });
        });

        const p8 = new Promise<string[]>((res, rej) => {
          this.dbSqlite.all(`SELECT name FROM departments`, (err: any, rows: any[]) => err ? rej(err) : res(rows.map(r => r.name)));
        });

        const p9 = new Promise<CompanyMaster[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM companies`, (err: any, rows: any[]) => {
            if (err) return rej(err);
            const mapped = (rows || []).map(r => {
              let logo = r.logo;
              if (r.id === 'SVN-1' || r.id === 'SVN-II') {
                if (!r.logo || r.logo.includes('unsplash.com')) {
                  logo = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E';
                  this.dbSqlite.run(`UPDATE companies SET logo = ? WHERE id = ?`, [logo, r.id]);
                }
              } else if (r.id === 'Sakar-I' || r.id === 'Sakar-III') {
                if (!r.logo || r.logo.includes('unsplash.com')) {
                  logo = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E';
                  this.dbSqlite.run(`UPDATE companies SET logo = ? WHERE id = ?`, [logo, r.id]);
                }
              }
              return { ...r, logo };
            });
            res(mapped);
          });
        });

        const p10 = new Promise<SalaryRevision[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM salary_revisions`, (err: any, rows: any[]) => err ? rej(err) : res(rows));
        });

        const p11 = new Promise<any[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM assets`, (err: any, rows: any[]) => err ? rej(err) : res(rows || []));
        });

        const p12 = new Promise<any[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM travel_reimbursements`, (err: any, rows: any[]) => err ? rej(err) : res(rows || []));
        });

        const p13 = new Promise<any[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM broadcasts`, (err: any, rows: any[]) => err ? rej(err) : res(rows || []));
        });

        const p14 = new Promise<any[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM attendance_corrections`, (err: any, rows: any[]) => err ? rej(err) : res(rows || []));
        });

        const p15 = new Promise<any[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM compoff_requests`, (err: any, rows: any[]) => err ? rej(err) : res(rows || []));
        });

        const p16 = new Promise<any[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM overtime_requests`, (err: any, rows: any[]) => err ? rej(err) : res(rows || []));
        });

        const pUsers = new Promise<HRUser[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM users`, (err: any, rows: any[]) => {
            if (err) return rej(err);
            const mapped = (rows || []).map(r => ({
              ...r,
              company_rights: r.company_rights ? JSON.parse(r.company_rights) : [],
              disabled: r.disabled === 1
            }));
            res(mapped);
          });
        });

        const pHods = new Promise<HODMaster[]>((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM hods`, (err: any, rows: any[]) => {
            if (err) return rej(err);
            const mapped = (rows || []).map(r => ({
              ...r,
              active: r.active === 1
            }));
            res(mapped);
          });
        });

        const pLedger = new Promise<any[]>((res) => {
          this.dbSqlite.all(`SELECT * FROM compoff_ledger`, (err: any, rows: any[]) => err ? res([]) : res(rows || []));
        });

        const pPolicies = new Promise<any[]>((res) => {
          this.dbSqlite.all(`SELECT * FROM policies`, (err: any, rows: any[]) => err ? res([]) : res(rows || []));
        });

        const pAcks = new Promise<any[]>((res) => {
          this.dbSqlite.all(`SELECT * FROM policy_acknowledgements`, (err: any, rows: any[]) => err ? res([]) : res(rows || []));
        });

        const pGatePasses = new Promise<any[]>((res) => {
          this.dbSqlite.all(`SELECT * FROM gate_passes`, (err: any, rows: any[]) => err ? res([]) : res(rows || []));
        });

        const pShifts = new Promise<any[]>((res) => {
          this.dbSqlite.all(`SELECT * FROM shifts`, (err: any, rows: any[]) => err ? res([]) : res(rows || []));
        });

        Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, pUsers, pHods, pLedger, pPolicies, pAcks, pGatePasses, pShifts]).then(([emps, atts, runs, slips, leaves, ffs, loans, depts, companies, revisions, assets, travel, broadcasts, corrections, compoffs, overtimes, users, hods, ledger, pols, acks, gatePasses, sfts]) => {
          this.data = {
            employees: emps,
            attendance: atts,
            payroll_runs: runs,
            payslips: slips,
            leave_applications: leaves,
            ff_settlements: (ffs || []).map((f: any) => {
              if (f.meta_json) {
                try {
                  const parsed = JSON.parse(f.meta_json);
                  return { ...f, ...parsed };
                } catch {
                  return f;
                }
              }
              return f;
            }),
            loans: loans,
            departments: depts,
            companies,
            salary_revisions: revisions,
            audit_logs: this.data.audit_logs,
            assets: assets,
            travel_reimbursements: travel,
            broadcasts: broadcasts,
            attendance_corrections: corrections,
            compoff_requests: compoffs,
            overtime_requests: overtimes,
            users: users,
            hods: hods,
            compoff_ledger: ledger,
            policies: pols,
            policy_acknowledgements: acks,
            gate_passes: gatePasses,
            shifts: sfts
          };
          resolve();
        }).catch(reject);
      });
    });
  }

  public syncUser(user: HRUser) {
    this.dbSqlite.run(`INSERT OR REPLACE INTO users (id, username, name, role, company_rights, title, password, disabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.username,
        user.name,
        user.role,
        JSON.stringify(user.company_rights),
        user.title || null,
        user.password || 'password123',
        user.disabled ? 1 : 0
      ],
      (err: any) => { if (err) console.error('SQLite Sync Error on Users:', err); }
    );
    
    if (!this.data.users) this.data.users = [];
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.persistData();
  }

  public deleteUser(id: string) {
    this.dbSqlite.run(`DELETE FROM users WHERE id = ?`, [id], (err: any) => {
      if (err) console.error('SQLite Delete Error on Users:', err);
    });
    if (this.data.users) {
      this.data.users = this.data.users.filter(u => u.id !== id);
    }
    this.persistData();
  }

  public getHods(): HODMaster[] {
    return this.data.hods || [];
  }

  public syncHod(hod: HODMaster) {
    this.dbSqlite.run(`INSERT OR REPLACE INTO hods (id, name, department, company, active) VALUES (?, ?, ?, ?, ?)`,
      [
        hod.id,
        hod.name,
        hod.department,
        hod.company,
        hod.active ? 1 : 0
      ],
      (err: any) => { if (err) console.error('SQLite Sync Error on HODs:', err); }
    );
    
    if (!this.data.hods) this.data.hods = [];
    const idx = this.data.hods.findIndex(h => h.id === hod.id);
    if (idx !== -1) {
      this.data.hods[idx] = hod;
    } else {
      this.data.hods.push(hod);
    }
    this.persistData();
  }

  public deleteHod(id: string) {
    this.dbSqlite.run(`DELETE FROM hods WHERE id = ?`, [id], (err: any) => {
      if (err) console.error('SQLite Delete Error on HODs:', err);
    });
    if (this.data.hods) {
      this.data.hods = this.data.hods.filter(h => h.id !== id);
    }
    this.persistData();
  }

  public getShifts(): Shift[] {
    if (!this.data.shifts) this.data.shifts = [];
    return this.data.shifts;
  }

  public syncShift(shift: Shift) {
    this.dbSqlite.run(`INSERT OR REPLACE INTO shifts (code, name, start_time, end_time, grace_time, weekly_off) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        shift.code.trim().toUpperCase(),
        shift.name,
        shift.start_time,
        shift.end_time,
        Number(shift.grace_time || 0),
        shift.weekly_off || 'Sunday'
      ],
      (err: any) => { if (err) console.error('SQLite Sync Error on Shifts:', err); }
    );
    
    if (!this.data.shifts) this.data.shifts = [];
    const idx = this.data.shifts.findIndex(s => s.code.toUpperCase() === shift.code.trim().toUpperCase());
    const cleanShift = {
      code: shift.code.trim().toUpperCase(),
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      grace_time: Number(shift.grace_time || 0),
      weekly_off: shift.weekly_off || 'Sunday'
    };
    if (idx !== -1) {
      this.data.shifts[idx] = cleanShift;
    } else {
      this.data.shifts.push(cleanShift);
    }
    this.persistData();
  }

  public deleteShift(code: string): boolean {
    this.dbSqlite.run(`DELETE FROM shifts WHERE code = ?`, [code.toUpperCase()]);
    if (this.data.shifts) {
      this.data.shifts = this.data.shifts.filter(s => s.code.toUpperCase() !== code.toUpperCase());
      this.persistData();
      return true;
    }
    return false;
  }

  private syncEmployee(emp: Employee) {
    this.dbSqlite.run(`INSERT OR REPLACE INTO employees (id, name, company, designation, department, email, phone, joining_date, exit_date, status, bank_name, bank_account, ifsc, pan, uan, base_salary, hra, special_allowance, da, pf_opt_in, esic_opt_in, professional_tax_opt_in, leave_balance_pl, leave_balance_cl, leave_balance_sl, qualification, location, vehicle_detail, prev_company_name, prev_company_location, total_experience, shift_timing, password, birth_year, needs_password_change, aadhaar_number, dob, gender, marital_status, emergency_contact, blood_group, esic_number, cost_center, reporting_manager, employee_category, reporting_hod, reporting_hod_name, conveyance_allowance, edu_allowance, medical_allowance, hidden_salary_heads, salary_structure_type, bonus_payable, ctc_salary, reporting_hod_code, is_hod, can_approve_leave, can_approve_misspunch, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp.id, emp.name, emp.company, emp.designation, emp.department, emp.email, emp.phone, emp.joining_date, emp.exit_date || null, emp.status,
        emp.bank_name, emp.bank_account, emp.ifsc, emp.pan, emp.uan, emp.base_salary, emp.hra, emp.special_allowance, emp.da,
        emp.pf_opt_in ? 1 : 0, emp.esic_opt_in ? 1 : 0, emp.professional_tax_opt_in ? 1 : 0,
        emp.leave_balance_pl, emp.leave_balance_cl, emp.leave_balance_sl,
        emp.qualification || null, emp.location || null, emp.vehicle_detail || null, emp.prev_company_name || null, emp.prev_company_location || null, emp.total_experience || null, emp.shift_timing || null,
        emp.password || null, emp.birth_year || null, emp.needs_password_change ? 1 : 0,
        emp.aadhaar_number || null, emp.dob || null, emp.gender || null, emp.marital_status || null, emp.emergency_contact || null, emp.blood_group || null, emp.esic_number || null, emp.cost_center || null, emp.reporting_manager || null, emp.employee_category || null,
        emp.reporting_hod || null, emp.reporting_hod_name || null,
        emp.conveyance_allowance ?? 0, emp.edu_allowance ?? 0, emp.medical_allowance ?? 0,
        emp.hidden_salary_heads || null, emp.salary_structure_type || 'FIXED',
        emp.bonus_payable ?? 0, emp.ctc_salary ?? 0,
        emp.reporting_hod_code || emp.reporting_hod || null,
        emp.is_hod ? 1 : 0,
        emp.can_approve_leave ? 1 : 0,
        emp.can_approve_misspunch ? 1 : 0,
        emp.photo || null
      ],
      (err: any) => { if (err) console.error('SQLite Sync Error on Employees:', err); }
    );
  }

  private deleteEmployeeSQLite(id: string) {
    this.dbSqlite.run(`DELETE FROM employees WHERE id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM attendance WHERE employee_id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM payslips WHERE employee_id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM leave_applications WHERE employee_id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM ff_settlements WHERE employee_id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM loans WHERE employee_id = ?`, [id]);
  }

  // Employee methods
  public getEmployees(companyFilter?: string): Employee[] {
    const activeEmps = this.data.employees || [];
    if (companyFilter && companyFilter !== 'ALL') {
      return activeEmps.filter(e => e.company === companyFilter);
    }
    return activeEmps;
  }

  public getCompanySettings(companyId: string): any {
    const DEFAULT_SETTINGS = {
      salary_base_percent: 50,
      salary_hra_percent: 40,
      salary_da_percent: 0,
      salary_special_percent: 15,
      salary_edu_percent: 2,
      salary_medical_percent: 5,
      salary_conveyance_percent: 8,
      pf_opt_in_default: true,
      pf_employer_rate: 12,
      esic_opt_in_threshold: 21000,
      esic_employer_rate: 3.25,
      bonus_rate_percent: 8.33,
    };

    const c = this.data.companies?.find(co => co.id === companyId);
    if (c && c.settings) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(c.settings) };
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_SETTINGS;
  }

  private computeCtcForEmployee(emp: Employee): number {
    const base = emp.base_salary;
    const sets = this.getCompanySettings(emp.company);
    const hiddenHeads = (emp.hidden_salary_heads || '').split(',').map(h => h.trim());
    const isHidden = (head: string) => hiddenHeads.includes(head);

    const rate_hra = isHidden('hra') ? 0 : (emp.salary_structure_type === 'PERCENTAGE' ? Math.round(base * (sets.salary_hra_percent / 100)) : (emp.hra ?? 0));
    const rate_special = isHidden('special_allowance') ? 0 : (emp.salary_structure_type === 'PERCENTAGE' ? Math.round(base * (sets.salary_special_percent / 100)) : (emp.special_allowance ?? 0));
    const rate_da = 0; // DA completely removed from VETAN ERP
    const rate_edu = isHidden('edu_allowance') ? 0 : (emp.salary_structure_type === 'PERCENTAGE' ? Math.round(base * (sets.salary_edu_percent || 2) / 100) : ((emp.edu_allowance && emp.edu_allowance > 0) ? emp.edu_allowance : Math.round(base * (sets.salary_edu_percent || 2) / 100)));
    const rate_medical = isHidden('medical_allowance') ? 0 : (emp.salary_structure_type === 'PERCENTAGE' ? Math.round(base * (sets.salary_medical_percent || 5) / 100) : ((emp.medical_allowance && emp.medical_allowance > 0) ? emp.medical_allowance : Math.round(base * (sets.salary_medical_percent || 5) / 100)));
    const rate_conveyance = isHidden('conveyance_allowance') ? 0 : (emp.salary_structure_type === 'PERCENTAGE' ? Math.round(base * (sets.salary_conveyance_percent || 8) / 100) : ((emp.conveyance_allowance && emp.conveyance_allowance > 0) ? emp.conveyance_allowance : Math.round(base * (sets.salary_conveyance_percent || 8) / 100)));
    const rate_bonus = Math.round(base * 0.0833);

    const gross = base + rate_hra + rate_special + rate_da + rate_edu + rate_medical + rate_conveyance;
    const employer_pf = emp.pf_opt_in ? Math.round((base) * (sets.pf_employer_rate / 100)) : 0;
    const employer_esic = (emp.esic_opt_in && gross <= sets.esic_opt_in_threshold) ? Math.round(gross * (sets.esic_employer_rate / 100)) : 0;

    return gross + employer_pf + employer_esic + rate_bonus;
  }

  public insertEmployee(employee: Employee): Employee {
    if (!employee.id || !employee.id.trim()) {
      throw new Error('Employee Code is a mandatory field and must be entered as per existing company records.');
    }
    const cleanId = employee.id.trim();
    if (this.data.employees.some(e => e.id.toLowerCase() === cleanId.toLowerCase())) {
      throw new Error(`Duplicate Employee Code error: Code "${cleanId}" already exists in organization records.`);
    }
    employee.id = cleanId;

    if (!employee.company) employee.company = 'SVN-1';
    if (!employee.status) employee.status = 'ACTIVE';
    if (employee.leave_balance_pl === undefined) employee.leave_balance_pl = 18;
    if (employee.leave_balance_cl === undefined) employee.leave_balance_cl = 6;
    if (employee.leave_balance_sl === undefined) employee.leave_balance_sl = 6;
    
    const phoneStr = employee.phone ? String(employee.phone).trim() : '0000';
    const last4 = phoneStr.length >= 4 ? phoneStr.slice(-4) : phoneStr.padStart(4, '0');
    const birthYearVal = employee.birth_year ? String(employee.birth_year).trim() : '1995';
    employee.password = last4 + birthYearVal;
    employee.needs_password_change = true;
    
    // Auto-calculate CTC on insert
    employee.ctc_salary = this.computeCtcForEmployee(employee);

    this.data.employees.push(employee);
    this.syncEmployee(employee);
    this.persistData();
    return employee;
  }

  public updateEmployee(id: string, updated: Partial<Employee>): Employee | undefined {
    const idx = this.data.employees.findIndex(e => e.id === id);
    if (idx === -1) return undefined;
    
    const oldEmp = this.data.employees[idx];
    const oldSalary = oldEmp.base_salary;
    const newSalary = updated.base_salary;
    
    if (newSalary !== undefined && Number(newSalary) !== Number(oldSalary)) {
      this.addSalaryRevision({
        employee_code: id,
        old_salary: Number(oldSalary),
        new_salary: Number(newSalary),
        effective_date: new Date().toISOString().split('T')[0],
        reason: 'Salary Revision / Increment',
        approved_by: 'Group HR Director'
      });
    }

    const newId = updated.id ? updated.id.trim() : undefined;
    const idChanged = newId && newId !== id;

    if (idChanged) {
      if (this.data.employees.some(e => e.id.toLowerCase() === newId.toLowerCase())) {
        throw new Error(`Duplicate Employee Code error: Code "${newId}" already exists in organization records.`);
      }

      // Cascade update Employee Code across all in-memory arrays
      this.data.attendance.forEach(a => {
        if (a.employee_id === id) a.employee_id = newId;
      });
      this.data.payslips.forEach(p => {
        if (p.employee_id === id) p.employee_id = newId;
      });
      if (this.data.leave_applications) {
        this.data.leave_applications.forEach(l => {
          if (l.employee_id === id) l.employee_id = newId;
        });
      }
      if (this.data.ff_settlements) {
        this.data.ff_settlements.forEach(f => {
          if (f.employee_id === id) f.employee_id = newId;
        });
      }
      if (this.data.loans) {
        this.data.loans.forEach(l => {
          if (l.employee_id === id) l.employee_id = newId;
        });
      }
      if (this.data.salary_revisions) {
        this.data.salary_revisions.forEach(sr => {
          if (sr.employee_code === id) sr.employee_code = newId;
        });
      }
      if (this.data.attendance_corrections) {
        this.data.attendance_corrections.forEach(ac => {
          if (ac.employee_id === id) ac.employee_id = newId;
        });
      }
      if (this.data.compoff_requests) {
        this.data.compoff_requests.forEach(cr => {
          if (cr.employee_id === id) cr.employee_id = newId;
        });
      }
      if (this.data.overtime_requests) {
        this.data.overtime_requests.forEach(ot => {
          if (ot.employee_id === id) ot.employee_id = newId;
        });
      }

      // Cascade SQLite UPDATE queries synchronously/asynchronously across tables
      this.dbSqlite.run(`UPDATE employees SET id = ? WHERE id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE attendance SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE payslips SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE leave_applications SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE loans SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE salary_revisions SET employee_code = ? WHERE employee_code = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE ff_settlements SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE attendance_corrections SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE compoff_requests SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE overtime_requests SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
    }

    const mergedPartial = { ...updated };
    if (idChanged) {
      mergedPartial.id = newId;
    }

    this.data.employees[idx] = { ...this.data.employees[idx], ...mergedPartial };

    // Normalize boolean fields (API may send 0/1 or true/false)
    const emp = this.data.employees[idx];
    emp.pf_opt_in = emp.pf_opt_in === 1 || emp.pf_opt_in === true;
    emp.esic_opt_in = emp.esic_opt_in === 1 || emp.esic_opt_in === true;
    emp.professional_tax_opt_in = emp.professional_tax_opt_in === 1 || emp.professional_tax_opt_in === true;

    // Auto-calculate CTC on update
    this.data.employees[idx].ctc_salary = this.computeCtcForEmployee(this.data.employees[idx]);

    this.syncEmployee(this.data.employees[idx]);
    this.persistData();
    
    // If the ID was updated, we need to clean up the old SQLite entry if INSERT OR REPLACE left it behind
    if (idChanged) {
      this.dbSqlite.run(`DELETE FROM employees WHERE id = ?`, [id]);
    }

    return this.data.employees[idx];
  }

  public deleteEmployee(id: string, force: boolean = false): 'PURGED' | 'INACTIVATED' | 'NOT_FOUND' {
    const idx = this.data.employees.findIndex(e => e.id === id);
    if (idx === -1) return 'NOT_FOUND';
    
    const emp = this.data.employees[idx];
    const hasPayrollHistory = this.data.payslips && this.data.payslips.some(p => p.employee_id === id);
    
    if (hasPayrollHistory && !force) {
      emp.status = 'SEPARATED';
      this.syncEmployee(emp);
      this.persistData();
      return 'INACTIVATED';
    } else {
      this.data.employees.splice(idx, 1);
      this.data.attendance = this.data.attendance.filter(a => a.employee_id !== id);
      this.data.payslips = this.data.payslips.filter(p => p.employee_id !== id);
      this.data.leave_applications = this.data.leave_applications.filter(l => l.employee_id !== id);
      this.data.ff_settlements = this.data.ff_settlements.filter(f => f.employee_id !== id);
      this.data.loans = (this.data.loans || []).filter(l => l.employee_id !== id);
      this.deleteEmployeeSQLite(id);
      this.persistData();
      return 'PURGED';
    }
  }

  public getLoans(employeeId?: string): Loan[] {
    if (!this.data.loans) this.data.loans = [];
    if (employeeId) {
      return this.data.loans.filter(l => l.employee_id === employeeId);
    }
    return this.data.loans;
  }

  public getLoanPolicy(): any {
    if (!this.data.loan_policy) {
      this.data.loan_policy = {
        max_amount: 300000,
        eligibility: "Minimum 1 Year of Continuous Service",
        interest_rate: 0,
        repayment_options: "Standard 6 to 12 Months EMI Repayment (Maximum 12 Months Limit)"
      };
    }
    return this.data.loan_policy;
  }

  public updateLoanPolicy(policy: any): void {
    this.data.loan_policy = {
      ...this.getLoanPolicy(),
      ...policy
    };
    this.persistData();
  }

  public addLoan(loan: Omit<Loan, 'id'> & { opening_balance?: number; opening_date?: string }): Loan {
    if (!this.data.loans) this.data.loans = [];
    const emp = this.getEmployeeById(loan.employee_id);
    const opening_balance = loan.opening_balance !== undefined ? Number(loan.opening_balance) : Number(loan.amount || 0);
    const opening_date = loan.opening_date || '2026-04-01';
    
    // Auto-generate sequential loan number e.g. LN-2026-001
    const count = this.data.loans.length + 1;
    const yearStr = new Date().getFullYear().toString();
    const generatedLoanNum = `LN-${yearStr}-${String(count).padStart(3, '0')}`;
    const loan_number = loan.loan_number || generatedLoanNum;

    const initialAudit: LoanAuditLog = {
      id: `AUD-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action: 'LOAN_ISSUED',
      details: `Loan ${loan_number} issued for ₹${loan.amount} (${loan.loan_type || 'Employee Loan'}). EMI: ₹${loan.monthly_deduction}`,
      performed_by: loan.approval_authority || 'HR Admin'
    };

    const newLoan: Loan = {
      ...loan,
      loan_number,
      department: loan.department || (emp ? emp.department : ''),
      company: loan.company || (emp ? emp.company : ''),
      unit: loan.unit || (emp ? emp.company : ''),
      loan_type: loan.loan_type || 'Employee Loan',
      loan_date: loan.loan_date || new Date().toISOString().split('T')[0],
      interest_rate: loan.interest_rate !== undefined ? Number(loan.interest_rate) : 0,
      emi_start_month: loan.emi_start_month || loan.month || '2026-04',
      total_installments: loan.total_installments || Math.ceil(Number(loan.amount || 0) / (Number(loan.monthly_deduction) || 1)),
      opening_balance,
      opening_date,
      employee_name: loan.employee_name || (emp ? emp.name : 'Unknown'),
      id: `LOAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      skipped_months: loan.skipped_months || [],
      additional_loans: loan.additional_loans || [],
      settlements: loan.settlements || [],
      audit_trail: [initialAudit],
      guarantor1_id: loan.guarantor1_id || '',
      guarantor1_code: loan.guarantor1_code || '',
      guarantor1_name: loan.guarantor1_name || '',
      guarantor1_department: loan.guarantor1_department || '',
      guarantor1_monthly_salary: loan.guarantor1_monthly_salary || 0,
      guarantor1_guarantee_limit: loan.guarantor1_guarantee_limit || 0,
      guarantor2_id: loan.guarantor2_id || '',
      guarantor2_code: loan.guarantor2_code || '',
      guarantor2_name: loan.guarantor2_name || '',
      guarantor2_department: loan.guarantor2_department || '',
      guarantor2_monthly_salary: loan.guarantor2_monthly_salary || 0,
      guarantor2_guarantee_limit: loan.guarantor2_guarantee_limit || 0
    };

    this.data.loans.push(newLoan);
    
    this.dbSqlite.run(
      `INSERT INTO loans (id, employee_id, employee_name, amount, month, monthly_deduction, reason, status, opening_balance, opening_date, skipped_months, additional_loans, loan_number, loan_type, interest_rate, total_installments, emi_start_month, approval_authority, remarks, settlements, audit_trail, guarantor1_id, guarantor1_code, guarantor1_name, guarantor1_department, guarantor1_monthly_salary, guarantor1_guarantee_limit, guarantor2_id, guarantor2_code, guarantor2_name, guarantor2_department, guarantor2_monthly_salary, guarantor2_guarantee_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newLoan.id,
        newLoan.employee_id,
        newLoan.employee_name,
        newLoan.amount,
        newLoan.month,
        newLoan.monthly_deduction,
        newLoan.reason,
        newLoan.status,
        opening_balance,
        opening_date,
        JSON.stringify(newLoan.skipped_months || []),
        JSON.stringify(newLoan.additional_loans || []),
        newLoan.loan_number,
        newLoan.loan_type,
        newLoan.interest_rate,
        newLoan.total_installments,
        newLoan.emi_start_month,
        newLoan.approval_authority || '',
        newLoan.remarks || '',
        JSON.stringify(newLoan.settlements || []),
        JSON.stringify(newLoan.audit_trail || []),
        newLoan.guarantor1_id || '',
        newLoan.guarantor1_code || '',
        newLoan.guarantor1_name || '',
        newLoan.guarantor1_department || '',
        newLoan.guarantor1_monthly_salary || 0,
        newLoan.guarantor1_guarantee_limit || 0,
        newLoan.guarantor2_id || '',
        newLoan.guarantor2_code || '',
        newLoan.guarantor2_name || '',
        newLoan.guarantor2_department || '',
        newLoan.guarantor2_monthly_salary || 0,
        newLoan.guarantor2_guarantee_limit || 0
      ],
      (err: any) => { if (err) console.error('SQLite Sync Error on Loans:', err); }
    );
    this.persistData();
    return newLoan;
  }

  public settleLoan(loanId: string, settlementData: {
    amount: number;
    recovery_type: 'FULL_SETTLEMENT' | 'PARTIAL' | 'MONTHLY_EMI' | 'ADDITIONAL_RECOVERY';
    payment_mode: 'Cash' | 'Bank Transfer' | 'Salary Deduction' | 'Cheque' | 'UPI' | 'Journal Entry';
    reference_number?: string;
    approved_by?: string;
    remarks?: string;
    date?: string;
  }): Loan | null {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex(l => l.id === loanId);
    if (idx === -1) return null;

    const loan = this.data.loans[idx];
    const settlements = Array.isArray(loan.settlements) ? [...loan.settlements] : [];
    
    const newSettlementsItem: LoanSettlement = {
      id: `STL-${Date.now()}`,
      date: settlementData.date || new Date().toISOString().split('T')[0],
      amount: Number(settlementData.amount),
      recovery_type: settlementData.recovery_type,
      payment_mode: settlementData.payment_mode,
      reference_number: settlementData.reference_number || '',
      approved_by: settlementData.approved_by || 'HR Admin',
      remarks: settlementData.remarks || '',
      principal_paid: Number(settlementData.amount)
    };

    settlements.push(newSettlementsItem);
    loan.settlements = settlements;

    const auditTrail = Array.isArray(loan.audit_trail) ? [...loan.audit_trail] : [];
    const auditItem: LoanAuditLog = {
      id: `AUD-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action: settlementData.recovery_type === 'FULL_SETTLEMENT' ? 'FULL_FORECLOSURE' : 'PARTIAL_SETTLEMENT',
      details: `${settlementData.recovery_type} of ₹${settlementData.amount} received via ${settlementData.payment_mode}. Ref: ${settlementData.reference_number || 'N/A'}`,
      performed_by: settlementData.approved_by || 'HR Admin'
    };
    auditTrail.push(auditItem);
    loan.audit_trail = auditTrail;

    // Calculate total repaid
    const slips = this.getPayslipsByEmployee(loan.employee_id);
    const slipRepaid = slips.reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
    const totalStlRepaid = settlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const openingBal = loan.opening_balance !== undefined ? Number(loan.opening_balance) : Number(loan.amount || 0);
    const addBal = (loan.additional_loans || []).reduce((s, a) => s + Number(a.amount || 0), 0);
    const totalBorrowed = openingBal + addBal;
    const currentOutstanding = Math.max(0, totalBorrowed - (slipRepaid + totalStlRepaid));

    if (currentOutstanding <= 0 || settlementData.recovery_type === 'FULL_SETTLEMENT') {
      loan.status = 'CLOSED';
      loan.closed_date = settlementData.date || new Date().toISOString().split('T')[0];
      loan.closure_reference = settlementData.reference_number || `STL-FULL-${Date.now()}`;
      
      auditTrail.push({
        id: `AUD-${Date.now() + 1}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        action: 'LOAN_CLOSED',
        details: `Loan account ${loan.loan_number || loan.id} marked CLOSED. Balance: ₹0`,
        performed_by: settlementData.approved_by || 'HR Admin'
      });
    }

    this.dbSqlite.run(
      `UPDATE loans SET settlements = ?, status = ?, closed_date = ?, closure_reference = ?, audit_trail = ? WHERE id = ?`,
      [
        JSON.stringify(loan.settlements),
        loan.status,
        loan.closed_date || '',
        loan.closure_reference || '',
        JSON.stringify(loan.audit_trail),
        loanId
      ]
    );

    this.persistData();
    return loan;
  }

  public updateLoanStatus(id: string, status: 'ACTIVE' | 'CLOSED'): boolean {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex(l => l.id === id);
    if (idx === -1) return false;
    const loan = this.data.loans[idx];
    loan.status = status;
    if (status === 'CLOSED') {
      loan.closed_date = new Date().toISOString().split('T')[0];
    }
    
    this.dbSqlite.run(`UPDATE loans SET status = ?, closed_date = ? WHERE id = ?`, [status, loan.closed_date || '', id]);
    this.persistData();
    return true;
  }

  public skipLoanEmi(loanId: string, month: string, action: 'SKIP' | 'UNSKIP', reason?: string): Loan | null {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex(l => l.id === loanId);
    if (idx === -1) return null;

    const loan = this.data.loans[idx];
    let skipped = Array.isArray(loan.skipped_months) ? [...loan.skipped_months] : [];

    if (action === 'SKIP') {
      if (!skipped.includes(month)) {
        skipped.push(month);
      }
    } else {
      skipped = skipped.filter(m => m !== month);
    }

    loan.skipped_months = skipped;

    this.dbSqlite.run(`UPDATE loans SET skipped_months = ? WHERE id = ?`, [JSON.stringify(skipped), loanId]);

    // Update existing payslips for this month if already generated
    const empPayslips = (this.data.payslips || []).filter(p => p.employee_id === loan.employee_id && p.month === month);
    for (const slip of empPayslips) {
      if (action === 'SKIP') {
        slip.loan_deduction = 0;
      } else {
        slip.loan_deduction = Math.min(Number(loan.monthly_deduction || 0), Number(loan.amount || 0));
      }
      slip.total_deductions = (slip.pf_deduction || 0) + (slip.esic_deduction || 0) + (slip.professional_tax || 0) + (slip.tds || 0) + (slip.loan_deduction || 0) + (slip.salary_advance || 0) + (slip.custom_deductions || 0);
      slip.net_salary = Math.max(0, slip.gross_salary - slip.total_deductions);
    }

    this.persistData();
    return loan;
  }

  public addLoanAmount(loanId: string, amount: number, month: string, reason?: string): Loan | null {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex(l => l.id === loanId);
    if (idx === -1) return null;

    const loan = this.data.loans[idx];
    const additional = Array.isArray(loan.additional_loans) ? [...loan.additional_loans] : [];
    additional.push({
      id: `ADD-${Date.now()}`,
      amount: Number(amount),
      month: month || '2026-04',
      reason: reason || 'Additional Loan Top-up',
      date: new Date().toISOString()
    });

    loan.additional_loans = additional;
    loan.amount = Number(loan.amount || 0) + Number(amount);
    if (loan.status === 'CLOSED') {
      loan.status = 'ACTIVE';
    }

    this.dbSqlite.run(`UPDATE loans SET amount = ?, additional_loans = ?, status = ? WHERE id = ?`,
      [loan.amount, JSON.stringify(additional), loan.status, loanId]
    );

    this.persistData();
    return loan;
  }

  public updateLoanDetails(loanId: string, updates: { amount?: number; opening_balance?: number; monthly_deduction?: number; total_installments?: number; opening_date?: string; reason?: string }): Loan | null {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex(l => l.id === loanId);
    if (idx === -1) return null;

    const loan = this.data.loans[idx];
    if (updates.amount !== undefined) loan.amount = Number(updates.amount);
    if (updates.opening_balance !== undefined) loan.opening_balance = Number(updates.opening_balance);
    if (updates.monthly_deduction !== undefined) loan.monthly_deduction = Number(updates.monthly_deduction);
    if (updates.total_installments !== undefined) loan.total_installments = Number(updates.total_installments);
    if (updates.opening_date !== undefined) loan.opening_date = updates.opening_date;
    if (updates.reason !== undefined) loan.reason = updates.reason;

    // Recalculate total_amount = amount (total loan value)
    loan.total_amount = loan.amount;

    this.dbSqlite.run(
      `UPDATE loans SET amount = ?, opening_balance = ?, monthly_deduction = ?, total_installments = ?, opening_date = ?, reason = ? WHERE id = ?`,
      [loan.amount, loan.opening_balance, loan.monthly_deduction, loan.total_installments, loan.opening_date, loan.reason, loanId]
    );

    this.persistData();
    return loan;
  }

  public getDepartments(): string[] {
    if (!this.data.departments || this.data.departments.length === 0) {
      this.data.departments = ['Production', 'QC', 'Maintenance', 'Stores', 'Purchase', 'Accounts', 'HR', 'Dispatch', 'Sales', 'Marketing', 'R&D', 'Administration'];
    }
    return this.data.departments;
  }

  public addDepartment(dept: string): string[] {
    if (!this.data.departments) {
      this.data.departments = ['Production', 'QC', 'Maintenance', 'Stores', 'Purchase', 'Accounts', 'HR', 'Dispatch', 'Sales', 'Marketing', 'R&D', 'Administration'];
    }
    const cleanDept = dept.trim();
    if (cleanDept && !this.data.departments.includes(cleanDept)) {
      this.data.departments.push(cleanDept);
      this.dbSqlite.run(`INSERT OR IGNORE INTO departments (name) VALUES (?)`, [cleanDept]);
    }
    return this.data.departments;
  }

  // Attendance spreadsheet methods
  public getAttendance(month: string, companyFilter?: string): Attendance[] {
    let records = this.data.attendance.filter(a => a.month === month);
    if (companyFilter && companyFilter !== 'ALL') {
      records = records.filter(a => {
        const emp = this.getEmployeeById(a.employee_id);
        return emp?.company === companyFilter;
      });
    }
    return records;
  }

  public getEmployeeAttendance(employeeId: string): Attendance[] {
    return this.data.attendance.filter(a => a.employee_id === employeeId);
  }

  public getAttendanceByEmployeeAndMonth(employeeId: string, month: string): Attendance[] {
    return this.data.attendance.filter(a => a.employee_id === employeeId && a.month === month);
  }

  public upsertAttendance(att: Attendance): void {
    const idx = this.data.attendance.findIndex(a => a.id === att.id);
    if (idx >= 0) {
      this.data.attendance[idx] = att;
    } else {
      this.data.attendance.push(att);
    }
    // Persist to Supabase
    if (this.supabaseAdmin) {
      this.supabaseAdmin.from('vetan_erp_store').upsert({
        id: 'live',
        payload: JSON.stringify(this.data),
        updated_at: new Date().toISOString()
      });
    }
  }

  public saveAttendance(bulk: Attendance[]) {
    for (const record of bulk) {
      // Auto-compute traditional fields if the new summary fields are provided
      if (record.present !== undefined) {
        const pres = record.present || 0;
        const abs = record.absent || 0;
        const woff = record.weekly_off || 0;
        const phol = record.paid_holiday || 0;
        const lve = record.leave || 0;
        const lw = record.lwp || 0;
        
        record.total_days = pres + abs + woff + phol + lve + lw;
        record.lop_days = abs + lw;
        record.working_days = pres + woff + phol + lve;
        record.overtime_hours = record.ot_hours || 0;
      }

      const idx = this.data.attendance.findIndex(a => a.employee_id === record.employee_id && a.month === record.month);
      if (idx !== -1) {
        this.data.attendance[idx] = { ...this.data.attendance[idx], ...record };
      } else {
        record.id = `ATT-${record.employee_id}-${record.month}`;
        this.data.attendance.push(record);
      }
      
      this.dbSqlite.run(
        `INSERT OR REPLACE INTO attendance (
          id, employee_id, month, total_days, working_days, lop_days, overtime_hours,
          present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked,
          in_time, out_time, leave_pl, leave_cl, leave_sl, compoff_used
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.employee_id,
          record.month,
          record.total_days || 0,
          record.working_days || 0,
          record.lop_days || 0,
          record.overtime_hours || 0,
          record.present !== undefined ? record.present : null,
          record.absent !== undefined ? record.absent : null,
          record.weekly_off !== undefined ? record.weekly_off : null,
          record.paid_holiday !== undefined ? record.paid_holiday : null,
          record.leave !== undefined ? record.leave : null,
          record.lwp !== undefined ? record.lwp : null,
          record.ot_hours !== undefined ? record.ot_hours : null,
          record.is_locked ? 1 : 0,
          record.in_time || null,
          record.out_time || null,
          record.leave_pl ?? null,
          record.leave_cl ?? null,
          record.leave_sl ?? null,
          record.compoff_used ?? null
        ]
      );
    }
    this.persistData();
  }

  public resolveReportingHodForEmployee(employeeId: string): { id: string; name: string } | null {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) return null;

    if (emp.reporting_hod) {
      return { id: emp.reporting_hod, name: emp.reporting_hod_name || 'HOD' };
    }

    // Lookup HOD by department and company
    const foundHod = this.data.hods?.find(h => h.department === emp.department && h.company === emp.company && h.active);
    if (foundHod) {
      return { id: foundHod.id, name: foundHod.name };
    }

    // Fallback lookup from other employees in same department and company who are flagged as is_hod
    const fallbackEmpHod = this.data.employees?.find(e => e.department === emp.department && e.company === emp.company && e.is_hod && e.id !== emp.id);
    if (fallbackEmpHod) {
      return { id: fallbackEmpHod.id, name: fallbackEmpHod.name };
    }

    // Global default HOD for company
    const defaultCompanyHod = this.data.hods?.find(h => h.company === emp.company && h.active) || 
                               this.data.employees?.find(e => e.company === emp.company && e.is_hod && e.id !== emp.id);
    if (defaultCompanyHod) {
      return { id: defaultCompanyHod.id, name: defaultCompanyHod.name };
    }

    return null;
  }

  // Leave Management operations
  public getLeaveApplications(companyFilter?: string): LeaveApplication[] {
    let apps = this.data.leave_applications || [];
    if (companyFilter && companyFilter !== 'ALL') {
      apps = apps.filter(a => a.company === companyFilter);
    }
    return apps;
  }

  public addLeaveApplication(app: LeaveApplication): LeaveApplication {
    const nextNum = Math.max(...(this.data.leave_applications || []).map(a => parseInt(a.id.replace('LV', '')) || 0), 0) + 1;
    app.id = `LV${String(nextNum).padStart(3, '0')}`;
    
    // Find employee's reporting HOD
    const hod = this.resolveReportingHodForEmployee(app.employee_id);
    if (hod) {
      app.reporting_hod = hod.id;
      app.reporting_hod_name = hod.name;
      app.status = 'PENDING_HOD';
    } else {
      app.status = 'PENDING_HR'; // Directly route to HR if no HOD assigned
    }
    app.applied_date = new Date().toISOString();
    
    if (!this.data.leave_applications) this.data.leave_applications = [];
    this.data.leave_applications.push(app);
    this.persistData();
    
    this.dbSqlite.run(`INSERT INTO leave_applications (id, employee_id, employee_name, company, leave_type, start_date, end_date, days, reason, status, applied_date, reporting_hod, reporting_hod_name, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [app.id, app.employee_id, app.employee_name, app.company, app.leave_type, app.start_date, app.end_date, app.days, app.reason, app.status, app.applied_date, app.reporting_hod || null, app.reporting_hod_name || null]
    );
    return app;
  }

  public updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED'): boolean {
    const app = this.data.leave_applications?.find(a => a.id === id);
    if (!app) return false;
    app.status = status;

    if (status === 'APPROVED') {
      const emp = this.getEmployeeById(app.employee_id);
      if (emp) {
        const leaveKey = `leave_balance_${app.leave_type.toLowerCase()}` as 'leave_balance_pl' | 'leave_balance_cl' | 'leave_balance_sl';
        emp[leaveKey] = Math.max(0, (emp[leaveKey] || 0) - app.days);
        this.syncEmployee(emp);
      }
    }
    
    this.dbSqlite.run(`UPDATE leave_applications SET status = ? WHERE id = ?`, [status, id]);
    this.persistData();
    return true;
  }

  private autoUpdateAttendanceForLeave(employeeId: string, leaveDays: number, startDate?: string, endDate?: string, leaveType?: string): void {
    if (!employeeId || !startDate) return;
    const emp = this.getEmployeeById(employeeId);
    if (!emp) return;
    const startDateObj = new Date(startDate);
    const month = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}`;
    let att = this.data.attendance.find(a => a.employee_id === employeeId && a.month === month);
    if (!att) {
      att = {
        id: `ATT-${employeeId}-${month}`,
        employee_id: employeeId,
        month: month,
        total_days: 30,
        present: 0,
        absent: 0,
        weekly_off: 0,
        paid_holiday: 0,
        leave: 0,
        lwp: 0,
        working_days: 0,
        lop_days: 0,
        overtime_hours: 0
      };
      this.data.attendance.push(att);
    }
    att.leave = (att.leave || 0) + leaveDays;
    // Track leave types separately
    if (!att.leave_pl) att.leave_pl = 0;
    if (!att.leave_cl) att.leave_cl = 0;
    if (!att.leave_sl) att.leave_sl = 0;
    if (!att.leave_coff) att.leave_coff = 0;
    if (leaveType) {
      const lt = leaveType.toLowerCase();
      if (lt === 'pl') att.leave_pl = (att.leave_pl || 0) + leaveDays;
      else if (lt === 'cl') att.leave_cl = (att.leave_cl || 0) + leaveDays;
      else if (lt === 'sl') att.leave_sl = (att.leave_sl || 0) + leaveDays;
      else if (lt === 'coff' || lt === 'c-off' || lt === 'compoff') att.leave_coff = (att.leave_coff || 0) + leaveDays;
    }
    att.working_days = (att.present || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + att.leave;
    att.lop_days = (att.absent || 0) + (att.lwp || 0);
    att.total_days = (att.present || 0) + (att.absent || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + att.leave + (att.lwp || 0);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked, leave_pl, leave_cl, leave_sl, leave_coff, pay_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [att.id, att.employee_id, att.month, att.total_days, att.working_days, att.lop_days, att.overtime_hours || 0, att.present || 0, att.absent || 0, att.weekly_off || 0, att.paid_holiday || 0, att.leave || 0, att.lwp || 0, att.overtime_hours || 0, att.is_locked ? 1 : 0, att.leave_pl || 0, att.leave_cl || 0, att.leave_sl || 0, att.leave_coff || 0, att.pay_days || null]
    );
  }

  private autoUpdateAttendanceForMissPunch(employeeId: string, date: string, requestedStatus: string): void {
    if (!employeeId || !date) return;
    const emp = this.getEmployeeById(employeeId);
    if (!emp) return;
    const dateObj = new Date(date);
    const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    let att = this.data.attendance.find(a => a.employee_id === employeeId && a.month === month);
    if (!att) {
      att = {
        id: `ATT-${employeeId}-${month}`,
        employee_id: employeeId,
        month: month,
        total_days: 30,
        present: 0,
        absent: 0,
        weekly_off: 0,
        paid_holiday: 0,
        leave: 0,
        lwp: 0,
        working_days: 0,
        lop_days: 0,
        overtime_hours: 0
      };
      this.data.attendance.push(att);
    }
    if (requestedStatus === 'PRESENT') {
      att.present = (att.present || 0) + 1;
      att.absent = Math.max(0, (att.absent || 0) - 1);
    } else if (requestedStatus === 'WEEKLY_OFF') {
      att.weekly_off = (att.weekly_off || 0) + 1;
      att.absent = Math.max(0, (att.absent || 0) - 1);
    } else if (requestedStatus === 'LEAVE') {
      att.leave = (att.leave || 0) + 1;
      att.absent = Math.max(0, (att.absent || 0) - 1);
    }
    att.working_days = (att.present || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + (att.leave || 0);
    att.lop_days = (att.absent || 0) + (att.lwp || 0);
    att.total_days = (att.present || 0) + (att.absent || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + (att.leave || 0) + (att.lwp || 0);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [att.id, att.employee_id, att.month, att.total_days, att.working_days, att.lop_days, att.overtime_hours || 0, att.present || 0, att.absent || 0, att.weekly_off || 0, att.paid_holiday || 0, att.leave || 0, att.lwp || 0, att.overtime_hours || 0, att.is_locked ? 1 : 0]
    );
  }

  public updateLeaveWorkflowStatus(id: string, actorRole: string, action: 'APPROVE' | 'REJECT', actorId?: string, override?: boolean): boolean {
    const app = this.data.leave_applications?.find(a => a.id === id);
    if (!app) return false;

    const isSuper = actorRole === 'SUPER_HR' || override;
    const isHR = actorRole === 'COMPANY_HR' || isSuper;

    if (app.status === 'PENDING_HOD') {
      if (actorRole === 'HOD' || isSuper) {
        if (action === 'APPROVE') {
          app.status = 'PENDING_HR';
          app.hod_approved_date = new Date().toISOString();
          app.hod_id = actorId || 'HOD';
        } else {
          app.status = 'REJECTED_HOD';
          app.hod_approved_date = new Date().toISOString();
          app.hod_id = actorId || 'HOD';
        }
      }
    } else if (app.status === 'PENDING_HR') {
      if (isHR) {
        if (action === 'APPROVE') {
          app.status = 'APPROVED';
          app.hr_approved_date = new Date().toISOString();
          app.hr_id = actorId || 'HR';
          const emp = this.getEmployeeById(app.employee_id);
          if (emp) {
            const leaveKey = `leave_balance_${app.leave_type.toLowerCase()}` as 'leave_balance_pl' | 'leave_balance_cl' | 'leave_balance_sl';
            emp[leaveKey] = Math.max(0, (emp[leaveKey] || 0) - app.days);
            this.syncEmployee(emp);
          }
          this.autoUpdateAttendanceForLeave(app.employee_id, app.days, app.start_date, app.end_date, app.leave_type);
        } else {
          app.status = 'REJECTED_HR';
          app.hr_approved_date = new Date().toISOString();
          app.hr_id = actorId || 'HR';
        }
      }
    } else if (isSuper) {
      if (action === 'APPROVE') {
        app.status = 'APPROVED';
        app.hod_approved_date = app.hod_approved_date || new Date().toISOString();
        app.hod_id = app.hod_id || actorId || 'SuperAdmin';
        app.hr_approved_date = new Date().toISOString();
        app.hr_id = actorId || 'SuperAdmin';
        const emp = this.getEmployeeById(app.employee_id);
        if (emp) {
          const leaveKey = `leave_balance_${app.leave_type.toLowerCase()}` as 'leave_balance_pl' | 'leave_balance_cl' | 'leave_balance_sl';
          emp[leaveKey] = Math.max(0, (emp[leaveKey] || 0) - app.days);
          this.syncEmployee(emp);
        }
        this.autoUpdateAttendanceForLeave(app.employee_id, app.days, app.start_date, app.end_date, app.leave_type);
      } else {
        app.status = 'REJECTED';
        app.hod_approved_date = app.hod_approved_date || new Date().toISOString();
        app.hr_approved_date = new Date().toISOString();
      }
    }

    this.dbSqlite.run(`UPDATE leave_applications SET status = ?, hod_approved_date = ?, hr_approved_date = ?, hod_id = ?, hr_id = ? WHERE id = ?`,
      [app.status, app.hod_approved_date || null, app.hr_approved_date || null, app.hod_id || null, app.hr_id || null, id]
    );
    this.persistData();
    return true;
  }

  // Attendance Correction operations
  public getAttendanceCorrections(): any[] {
    if (!this.data.attendance_corrections) this.data.attendance_corrections = [];
    return this.data.attendance_corrections;
  }

  public addAttendanceCorrection(req: any): any {
    const nextNum = Math.max(...(this.data.attendance_corrections || []).map(a => parseInt(a.id.replace('AC', '')) || 0), 0) + 1;
    req.id = `AC${String(nextNum).padStart(3, '0')}`;
    
    // Find employee's reporting HOD
    const hod = this.resolveReportingHodForEmployee(req.employee_id);
    if (hod) {
      req.reporting_hod = hod.id;
      req.reporting_hod_name = hod.name;
      req.status = 'PENDING_HOD';
    } else {
      req.status = 'PENDING_HR';
    }
    req.applied_date = new Date().toISOString();
    
    if (!this.data.attendance_corrections) this.data.attendance_corrections = [];
    this.data.attendance_corrections.push(req);
    
    this.dbSqlite.run(`INSERT INTO attendance_corrections (id, employee_id, employee_name, company, date, original_status, requested_status, reason, applied_date, reporting_hod, reporting_hod_name, status, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [req.id, req.employee_id, req.employee_name, req.company, req.date, req.original_status, req.requested_status, req.reason, req.applied_date, req.reporting_hod || null, req.reporting_hod_name || null, req.status]
    );
    return req;
  }

  public updateAttendanceCorrectionWorkflowStatus(id: string, actorRole: string, action: 'APPROVE' | 'REJECT', actorId?: string, override?: boolean): boolean {
    if (!this.data.attendance_corrections) this.data.attendance_corrections = [];
    const req = this.data.attendance_corrections.find(a => a.id === id);
    if (!req) return false;

    const isSuper = actorRole === 'SUPER_HR' || override;
    const isHR = actorRole === 'COMPANY_HR' || isSuper;

    if (req.status === 'PENDING_HOD') {
      if (actorRole === 'HOD' || isSuper) {
        if (action === 'APPROVE') {
          req.status = 'PENDING_HR';
          req.hod_approved_date = new Date().toISOString();
          req.hod_id = actorId || 'HOD';
        } else {
          req.status = 'REJECTED_HOD';
          req.hod_approved_date = new Date().toISOString();
          req.hod_id = actorId || 'HOD';
        }
      }
    } else if (req.status === 'PENDING_HR') {
      if (isHR) {
        if (action === 'APPROVE') {
          req.status = 'APPROVED';
          req.hr_approved_date = new Date().toISOString();
          req.hr_id = actorId || 'HR';
          this.autoUpdateAttendanceForMissPunch(req.employee_id, req.date, req.requested_status);
        } else {
          req.status = 'REJECTED_HR';
          req.hr_approved_date = new Date().toISOString();
          req.hr_id = actorId || 'HR';
        }
      }
    } else if (isSuper) {
      if (action === 'APPROVE') {
        req.status = 'APPROVED';
        req.hod_approved_date = req.hod_approved_date || new Date().toISOString();
        req.hr_approved_date = new Date().toISOString();
        this.autoUpdateAttendanceForMissPunch(req.employee_id, req.date, req.requested_status);
      } else {
        req.status = 'REJECTED_HR';
        req.hr_approved_date = new Date().toISOString();
      }
    }

    this.dbSqlite.run(`UPDATE attendance_corrections SET status = ?, hod_approved_date = ?, hr_approved_date = ?, hod_id = ?, hr_id = ? WHERE id = ?`,
      [req.status, req.hod_approved_date || null, req.hr_approved_date || null, req.hod_id || null, req.hr_id || null, id]
    );
    this.persistData();
    return true;
  }

  // Comp-off operations
  public getCompOffRequests(): any[] {
    if (!this.data.compoff_requests) this.data.compoff_requests = [];
    return this.data.compoff_requests;
  }

  public addCompOffRequest(req: any): any {
    const nextNum = Math.max(...(this.data.compoff_requests || []).map(a => parseInt(a.id.replace('CO', '')) || 0), 0) + 1;
    req.id = `CO${String(nextNum).padStart(3, '0')}`;
    
    // Find employee's reporting HOD
    const hod = this.resolveReportingHodForEmployee(req.employee_id);
    if (hod) {
      req.reporting_hod = hod.id;
      req.reporting_hod_name = hod.name;
      req.status = 'PENDING_HOD';
    } else {
      req.status = 'PENDING_HR';
    }
    req.applied_date = new Date().toISOString();
    
    if (!this.data.compoff_requests) this.data.compoff_requests = [];
    this.data.compoff_requests.push(req);
    
    this.dbSqlite.run(`INSERT INTO compoff_requests (id, employee_id, employee_name, company, date, reason, applied_date, reporting_hod, reporting_hod_name, status, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [req.id, req.employee_id, req.employee_name, req.company, req.date, req.reason, req.applied_date, req.reporting_hod || null, req.reporting_hod_name || null, req.status]
    );
    return req;
  }

  public updateCompOffWorkflowStatus(id: string, actorRole: string, action: 'APPROVE' | 'REJECT', actorId?: string, override?: boolean): boolean {
    if (!this.data.compoff_requests) this.data.compoff_requests = [];
    const req = this.data.compoff_requests.find(a => a.id === id);
    if (!req) return false;

    const isSuper = actorRole === 'SUPER_HR' || override;
    const isHR = actorRole === 'COMPANY_HR' || isSuper;

    if (req.status === 'PENDING_HOD') {
      if (actorRole === 'HOD' || isSuper) {
        if (action === 'APPROVE') {
          req.status = 'PENDING_HR';
          req.hod_approved_date = new Date().toISOString();
          req.hod_id = actorId || 'HOD';
        } else {
          req.status = 'REJECTED_HOD';
          req.hod_approved_date = new Date().toISOString();
          req.hod_id = actorId || 'HOD';
        }
      }
    } else if (req.status === 'PENDING_HR') {
      if (isHR) {
        if (action === 'APPROVE') {
          req.status = 'APPROVED';
          req.hr_approved_date = new Date().toISOString();
          req.hr_id = actorId || 'HR';
        } else {
          req.status = 'REJECTED_HR';
          req.hr_approved_date = new Date().toISOString();
          req.hr_id = actorId || 'HR';
        }
      }
    } else if (isSuper) {
      if (action === 'APPROVE') {
        req.status = 'APPROVED';
        req.hod_approved_date = req.hod_approved_date || new Date().toISOString();
        req.hr_approved_date = new Date().toISOString();
      } else {
        req.status = 'REJECTED_HR';
        req.hr_approved_date = new Date().toISOString();
      }
    }

    this.dbSqlite.run(`UPDATE compoff_requests SET status = ?, hod_approved_date = ?, hr_approved_date = ?, hod_id = ?, hr_id = ? WHERE id = ?`,
      [req.status, req.hod_approved_date || null, req.hr_approved_date || null, req.hod_id || null, req.hr_id || null, id]
    );
    return true;
  }

  // Overtime operations
  public getOvertimeRequests(): any[] {
    if (!this.data.overtime_requests) this.data.overtime_requests = [];
    return this.data.overtime_requests;
  }

  public addOvertimeRequest(req: any): any {
    const nextNum = Math.max(...(this.data.overtime_requests || []).map(a => parseInt(a.id.replace('OT', '')) || 0), 0) + 1;
    req.id = `OT${String(nextNum).padStart(3, '0')}`;
    
    // Find employee's reporting HOD
    const hod = this.resolveReportingHodForEmployee(req.employee_id);
    if (hod) {
      req.reporting_hod = hod.id;
      req.reporting_hod_name = hod.name;
      req.status = 'PENDING_HOD';
    } else {
      req.status = 'PENDING_HR';
    }
    req.applied_date = new Date().toISOString();
    
    if (!this.data.overtime_requests) this.data.overtime_requests = [];
    this.data.overtime_requests.push(req);
    
    this.dbSqlite.run(`INSERT INTO overtime_requests (id, employee_id, employee_name, company, date, hours, reason, applied_date, reporting_hod, reporting_hod_name, status, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [req.id, req.employee_id, req.employee_name, req.company, req.date, req.hours, req.reason, req.applied_date, req.reporting_hod || null, req.reporting_hod_name || null, req.status]
    );
    return req;
  }

  public updateOvertimeWorkflowStatus(id: string, actorRole: string, action: 'APPROVE' | 'REJECT', actorId?: string, override?: boolean): boolean {
    if (!this.data.overtime_requests) this.data.overtime_requests = [];
    const req = this.data.overtime_requests.find(a => a.id === id);
    if (!req) return false;

    const isSuper = actorRole === 'SUPER_HR' || override;
    const isHR = actorRole === 'COMPANY_HR' || isSuper;

    if (req.status === 'PENDING_HOD') {
      if (actorRole === 'HOD' || isSuper) {
        if (action === 'APPROVE') {
          req.status = 'PENDING_HR';
          req.hod_approved_date = new Date().toISOString();
          req.hod_id = actorId || 'HOD';
        } else {
          req.status = 'REJECTED_HOD';
          req.hod_approved_date = new Date().toISOString();
          req.hod_id = actorId || 'HOD';
        }
      }
    } else if (req.status === 'PENDING_HR') {
      if (isHR) {
        if (action === 'APPROVE') {
          req.status = 'APPROVED';
          req.hr_approved_date = new Date().toISOString();
          req.hr_id = actorId || 'HR';

          // When approved by HR, add overtime hours premium directly to the employee's attendance record!
          const emp = this.getEmployeeById(req.employee_id);
          if (emp) {
            const reqMonth = req.date.substring(0, 7); // YYYY-MM
            let att = this.data.attendance.find(a => a.employee_id === emp.id && a.month === reqMonth);
            if (!att) {
              att = {
                id: `ATT-${emp.id}-${reqMonth}`,
                employee_id: emp.id,
                month: reqMonth,
                total_days: 30,
                working_days: 30,
                lop_days: 0,
                overtime_hours: 0
              };
              this.data.attendance.push(att);
            }
            att.overtime_hours += Number(req.hours);
            this.dbSqlite.run(`INSERT OR REPLACE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [att.id, att.employee_id, att.month, att.total_days, att.working_days, att.lop_days, att.overtime_hours]
            );
          }
        } else {
          req.status = 'REJECTED_HR';
          req.hr_approved_date = new Date().toISOString();
          req.hr_id = actorId || 'HR';
        }
      }
    } else if (isSuper) {
      if (action === 'APPROVE') {
        req.status = 'APPROVED';
        req.hod_approved_date = req.hod_approved_date || new Date().toISOString();
        req.hr_approved_date = new Date().toISOString();
      } else {
        req.status = 'REJECTED_HR';
        req.hr_approved_date = new Date().toISOString();
      }
    }

    this.dbSqlite.run(`UPDATE overtime_requests SET status = ?, hod_approved_date = ?, hr_approved_date = ?, hod_id = ?, hr_id = ? WHERE id = ?`,
      [req.status, req.hod_approved_date || null, req.hr_approved_date || null, req.hod_id || null, req.hr_id || null, id]
    );
    return true;
  }

  // Full and Final settlement (F&F)
  public getFFSettlements(companyFilter?: string): FullAndFinalSettlement[] {
    let ff = this.data.ff_settlements || [];
    if (companyFilter && companyFilter !== 'ALL') {
      ff = ff.filter(f => f.company === companyFilter);
    }
    return ff;
  }

  public calculateFFSettlement(employeeId: string, lastDay: string): FullAndFinalSettlement {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) throw new Error('Employee not found for Full & Final processing');

    const joinDate = new Date(emp.joining_date);
    const exitDate = new Date(lastDay);
    const diffMs = exitDate.getTime() - joinDate.getTime();
    const serviceYears = Math.max(0, Number((diffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2)));

    // Calculate Gratuity: standard eligibility is 5 years.
    let gratuity_earned = 0;
    if (serviceYears >= 5) {
      gratuity_earned = Math.round((emp.base_salary / 26) * 15 * Math.floor(serviceYears));
    }

    // Leave balances
    const active_pl = emp.leave_balance_pl || 0;
    const active_cl = emp.leave_balance_cl || 0;
    const active_sl = emp.leave_balance_sl || 0;

    // Only PL is eligible for encashment: (Base Salary / 30) * PL Balance
    const earned_leave_encashment = Math.round((emp.base_salary / 30) * active_pl);

    // Unpaid salary days - let's default to 0 and let user edit
    const unpaid_salary_days = 0;
    const fullMonthlyGross = emp.base_salary + emp.hra + emp.special_allowance + (emp.conveyance_allowance || 0) + (emp.edu_allowance || 0) + (emp.medical_allowance || 0);
    const unpaid_salary_earned = Math.round((fullMonthlyGross / 30) * unpaid_salary_days);

    // Notice Period shortfall - default to 0
    const notice_applicable_days = 30;
    const notice_served_days = 30;
    const notice_shortfall_days = 0;
    const notice_period_deduction = 0;

    // Recoveries
    const recovery_salary_advance = 0;

    // Fetch active approved outstanding loans
    const empLoans = (this.data.loans || []).filter(l => l.employee_id === employeeId);
    const approvedLoans = empLoans.filter(l => l.status === 'ACTIVE');
    const empSlips = (this.data.payslips || []).filter(p => p.employee_id === employeeId);
    const totalRepaidLoans = empSlips.reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
    const totalLoanAmount = approvedLoans.reduce((sum, l) => sum + l.amount, 0);
    const recovery_loan_outstanding = Math.max(0, totalLoanAmount - totalRepaidLoans);

    const recovery_asset = 0;
    const recovery_other = 0;

    // Fetch comp off balance from ledger
    const ledger = this.data.compoff_ledger || [];
    const empLedger = ledger.filter(l => l.employee_id === employeeId);
    const leave_balance_compoff = empLedger.reduce((sum, item) => sum + (item.balance || 0), 0);

    const pending_bonus = 0;

    const gross_earnings = gratuity_earned + earned_leave_encashment + unpaid_salary_earned + pending_bonus;
    const gross_deductions = notice_period_deduction + recovery_salary_advance + recovery_loan_outstanding + recovery_asset + recovery_other;
    const net_settlement_pay = gross_earnings - gross_deductions;

    // Total service period string helper
    const years = Math.floor(serviceYears);
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor((totalDays % 365) / 30);
    const remainingDays = totalDays % 30;
    let tenureStr = "";
    if (years > 0) tenureStr += `${years} Year${years > 1 ? 's' : ''} `;
    if (months > 0) tenureStr += `${months} Month${months > 1 ? 's' : ''} `;
    tenureStr += `${remainingDays} Day${remainingDays !== 1 ? 's' : ''}`;
    if (!tenureStr.trim()) tenureStr = "0 Days";

    const nextId = `FF-${emp.id}`;

    const fAndF: FullAndFinalSettlement = {
      id: nextId,
      employee_id: emp.id,
      employee_name: emp.name,
      company: emp.company,
      last_working_day: lastDay,
      gratuity_earned,
      earned_leave_encashment,
      unpaid_salary_days,
      unpaid_salary_earned,
      notice_period_deduction,
      pending_bonus,
      gross_earnings,
      gross_deductions,
      net_settlement_pay,
      status: 'DRAFT',

      // Profile details
      department: emp.department || 'General',
      designation: emp.designation || 'Staff',
      reporting_manager: emp.reporting_hod_name || emp.reporting_hod || 'Management',
      joining_date: emp.joining_date,
      resignation_date: new Date(exitDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      resignation_acceptance_date: new Date(exitDate.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      leaving_date: lastDay,
      total_service_period: tenureStr,

      // Exit details
      reason_for_leaving: 'Personal Reasons',
      exit_remarks: 'Completed knowledge transfer and handed over all corporate assets.',

      // Notice period
      notice_applicable_days,
      notice_served_days,
      notice_shortfall_days,

      // Leaves
      leave_balance_pl: active_pl,
      leave_balance_cl: active_cl,
      leave_balance_sl: active_sl,
      leave_balance_compoff,

      // Recoveries
      recovery_salary_advance,
      recovery_loan_outstanding,
      recovery_asset,
      recovery_other,

      // Clearance Checklist
      clearance_id_card: true,
      clearance_laptop: true,
      clearance_mobile: true,
      clearance_access_card: true,
      clearance_other_assets: true,
      clearance_remarks: 'All clearances obtained successfully from IT, HR, and Admin departments.',

      // Sign-offs
      approval_prepared_by: '',
      approval_prepared_date: '',
      approval_verified_by: '',
      approval_verified_date: '',
      approval_approved_by: '',
      approval_approved_date: '',
      approval_final_approved_by: '',
      approval_final_approved_date: ''
    };

    return fAndF;
  }

  public saveFFSettlement(settlement: FullAndFinalSettlement) {
    if (!this.data.ff_settlements) this.data.ff_settlements = [];
    
    const idx = this.data.ff_settlements.findIndex(f => f.id === settlement.id);
    if (idx !== -1) {
      this.data.ff_settlements[idx] = settlement;
    } else {
      this.data.ff_settlements.push(settlement);
    }

    if (settlement.status === 'DISBURSED') {
      const emp = this.getEmployeeById(settlement.employee_id);
      if (emp) {
        emp.status = 'RESIGNED';
        emp.exit_date = settlement.last_working_day;
        this.syncEmployee(emp);
      }
    }

    // Persist JSON
    this.persistData();
    
    // Persist SQLite with JSON serialization for metadata fallback
    const serialized = JSON.stringify(settlement);
    this.dbSqlite.run(`INSERT OR REPLACE INTO ff_settlements (id, employee_id, employee_name, company, last_working_day, gratuity_earned, earned_leave_encashment, unpaid_salary_days, unpaid_salary_earned, notice_period_deduction, pending_bonus, gross_earnings, gross_deductions, net_settlement_pay, status, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        settlement.id, settlement.employee_id, settlement.employee_name, settlement.company, settlement.last_working_day,
        settlement.gratuity_earned, settlement.earned_leave_encashment, settlement.unpaid_salary_days, settlement.unpaid_salary_earned,
        settlement.notice_period_deduction, settlement.pending_bonus || 0, settlement.gross_earnings, settlement.gross_deductions, settlement.net_settlement_pay,
        settlement.status, serialized
      ],
      (err: any) => { if (err) console.error('SQLite Sync Error on F&F:', err); }
    );
  }

  // Form 16 Tax Estimation engine
  public calculateForm16(employeeId: string): Form16Calculation {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) throw new Error('Employee not found for Form 16 calculation');

    const monthlyGross = emp.base_salary + emp.hra + emp.special_allowance + (emp.conveyance_allowance || 0) + (emp.edu_allowance || 0) + (emp.medical_allowance || 0);
    const gross_annual_salary = monthlyGross * 12;

    const standard_deduction = 50000; 

    let section_80c = 0;
    if (emp.pf_opt_in) {
      const pfContributionBasis = emp.base_salary;
      section_80c = Math.min(150000, Math.round(pfContributionBasis * 0.12 * 12));
    }

    const section_80d = 12500; 

    const hra_exemption = Math.round(emp.hra * 12 * 0.90); 

    const taxable_income = Math.max(0, gross_annual_salary - standard_deduction - section_80c - section_80d - hra_exemption);

    let tax_on_income = 0;
    if (taxable_income > 1500000) {
      tax_on_income = 150000 + (taxable_income - 1500000) * 0.30;
    } else if (taxable_income > 1000000) {
      tax_on_income = 60000 + (taxable_income - 1000000) * 0.20;
    } else if (taxable_income > 700000) {
      tax_on_income = 30000 + (taxable_income - 700000) * 0.10;
    } else if (taxable_income > 300000) {
      tax_on_income = (taxable_income - 300000) * 0.05;
    }

    let rebate_87a = 0;
    if (taxable_income <= 700000) {
      rebate_87a = tax_on_income;
    }

    const net_tax_payable = Math.max(0, tax_on_income - rebate_87a);

    return {
      employee_id: emp.id,
      employee_name: emp.name,
      company: emp.company,
      pan: emp.pan,
      gross_annual_salary,
      standard_deduction,
      section_80c,
      section_80d,
      hra_exemption,
      taxable_income,
      tax_on_income,
      rebate_87a,
      net_tax_payable
    };
  }

  // Core helper methods
  public getEmployeeById(id: string): Employee | undefined {
    return this.data.employees.find(e => e.id === id);
  }

  public getPayrollRuns(): PayrollRun[] {
    return this.data.payroll_runs || [];
  }

  public getPayslipsByMonth(month: string, companyFilter?: string): Payslip[] {
    let slips = this.data.payslips.filter(p => p.month === month);
    if (companyFilter && companyFilter !== 'ALL') {
      slips = slips.filter(p => {
        const emp = this.getEmployeeById(p.employee_id);
        return emp?.company === companyFilter;
      });
    }
    return slips;
  }

  public getPayslipById(id: string): Payslip | undefined {
    return this.data.payslips.find(p => p.id === id);
  }

  public getPayslipsByEmployee(employeeId: string): Payslip[] {
    if (!this.data.payslips) this.data.payslips = [];
    return this.data.payslips.filter(p => p.employee_id === employeeId);
  }

  public updatePayslipDeductions(id: string, pf: number, esic: number, pt: number, tds: number, loan: number, advance: number, custom: number): Payslip | null {
    const s = this.data.payslips.find(p => p.id === id);
    if (!s) return null;

    s.pf_deduction = pf;
    s.esic_deduction = esic;
    s.professional_tax = pt;
    s.tds = tds;
    s.loan_deduction = loan;
    s.salary_advance = advance;
    s.custom_deductions = custom;

    s.total_deductions = s.pf_deduction + s.esic_deduction + s.professional_tax + s.tds + s.loan_deduction + s.salary_advance + s.custom_deductions;
    s.net_salary = Math.max(0, s.gross_salary - s.total_deductions);

    // Save to SQLite
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO payslips (
        id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month,
        rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance,
        earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance,
        overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction, salary_advance,
        gross_salary, total_deductions, net_salary, employer_pf, employer_esic, payment_status, payment_date, hidden_salary_heads, salary_structure_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
      [
        s.id, s.employee_id, s.employee_name, s.designation, s.department, s.pan, s.uan, s.bank_name, s.bank_account, s.ifsc, s.month,
        s.rate_base_salary, s.rate_hra, s.rate_special_allowance, s.rate_da, s.rate_edu_allowance || 0, s.rate_medical_allowance || 0, s.rate_conveyance_allowance || 0,
        s.earned_base_salary, s.earned_hra, s.earned_special_allowance, s.earned_da, s.earned_edu_allowance || 0, s.earned_medical_allowance || 0, s.earned_conveyance_allowance || 0,
        s.overtime_pay, s.lop_deduction, s.pf_deduction, s.esic_deduction, s.professional_tax, s.tds, s.custom_deductions, s.loan_deduction, s.salary_advance || 0,
        s.gross_salary, s.total_deductions, s.net_salary, s.employer_pf, s.employer_esic, s.payment_status || 'PENDING', s.payment_date || null,
        s.hidden_salary_heads || null, s.salary_structure_type || 'FIXED'
      ]
    );

    // Save to JSON
    this.persistData();

    return s;
  }

  // Helper: Get previous month string (e.g., '2026-04' -> '2026-03')
  private getPreviousMonth(month: string): string {
    const [year, mon] = month.split('-').map(Number);
    if (mon === 1) return `${year - 1}-12`;
    return `${year}-${String(mon - 1).padStart(2, '0')}`;
  }

  // Automation Calculation Logic for Single Employee Draft Wage Slip
  public calculateSingleSlip(emp: Employee, att: any, month: string): Payslip {
    const totalDays = att.total_days || 30;
    const payDays = att.pay_days !== undefined ? Number(att.pay_days) : (totalDays - (att.lop_days || 0));
    const workDays = payDays;

    const proration = Math.max(0, workDays) / totalDays;

    const sets = this.getCompanySettings(emp.company);
    const isFormulaMonth = false;
    const isLockedPercentage = emp.salary_structure_type === 'PERCENTAGE' || isFormulaMonth;
    const hiddenHeads = (emp.hidden_salary_heads || '').split(',').map(h => h.trim());
    const isHidden = (head: string) => hiddenHeads.includes(head);

    const rate_base = emp.base_salary;
    const rate_hra = isHidden('hra') ? 0 : (isLockedPercentage ? Math.round(rate_base * (sets.salary_hra_percent / 100)) : (emp.hra ?? 0));
    const rate_special = isHidden('special_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * (sets.salary_special_percent / 100)) : (emp.special_allowance ?? 0));
    const rate_da = 0; // DA completely removed from salary structure
    const rate_edu = isHidden('edu_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * (sets.salary_edu_percent || 2) / 100) : ((emp.edu_allowance && emp.edu_allowance > 0) ? emp.edu_allowance : Math.round(rate_base * (sets.salary_edu_percent || 2) / 100)));
    const rate_medical = isHidden('medical_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * (sets.salary_medical_percent || 5) / 100) : ((emp.medical_allowance && emp.medical_allowance > 0) ? emp.medical_allowance : Math.round(rate_base * (sets.salary_medical_percent || 5) / 100)));
    const rate_conveyance = isHidden('conveyance_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * (sets.salary_conveyance_percent || 8) / 100) : ((emp.conveyance_allowance && emp.conveyance_allowance > 0) ? emp.conveyance_allowance : Math.round(rate_base * (sets.salary_conveyance_percent || 8) / 100)));
    const rate_bonus = Math.round(rate_base * 0.0833);

    const earned_base = Math.round(rate_base * proration);
    const earned_hra = Math.round(rate_hra * proration);
    const earned_special = Math.round(rate_special * proration);
    const earned_da = 0; // DA completely removed
    const earned_edu = Math.round(rate_edu * proration);
    const earned_medical = Math.round(rate_medical * proration);
    const earned_conveyance = Math.round(rate_conveyance * proration);
    const earned_bonus = Math.round(rate_bonus * proration);

    const overtime_hours = att.overtime_hours || 0;
    const overtime_rate = Math.round(((rate_base) / (26 * 8)) * 1.5) || 150;
    const overtime_pay = overtime_hours * overtime_rate;

    const lopDays = att.lop_days || (totalDays - payDays);
    const gross_rate_full = rate_base + rate_hra + rate_special + rate_edu + rate_medical + rate_conveyance;
    const lop_deduction = Math.round(gross_rate_full * (lopDays / totalDays));

    const gross_salary = earned_base + earned_hra + earned_special + earned_edu + earned_medical + earned_conveyance;

    let pf_deduction = 0;
    let employer_pf = 0;
    if (emp.pf_opt_in) {
      const pf_basis = earned_base;
      pf_deduction = Math.round(pf_basis * 0.12);
      employer_pf = Math.round(pf_basis * (sets.pf_employer_rate / 100));
    }

    let esic_deduction = 0;
    let employer_esic = 0;
    const monthly_gross_cap_rate = rate_base + rate_hra + rate_special + rate_edu + rate_medical + rate_conveyance;
    if (emp.esic_opt_in && monthly_gross_cap_rate <= sets.esic_opt_in_threshold) {
      esic_deduction = Math.round(gross_salary * 0.0075);
      employer_esic = Math.round(gross_salary * (sets.esic_employer_rate / 100));
    }

    let professional_tax = 0;
    if (emp.professional_tax_opt_in) {
      if (gross_salary > 15000) {
        professional_tax = 200;
      } else if (gross_salary > 10000) {
        professional_tax = 150;
      }
    }

    let tds = 0;
    const annual_estimated_taxable = (gross_salary - pf_deduction - professional_tax) * 12;
    if (annual_estimated_taxable > 700000) {
      const excess = annual_estimated_taxable - 700000;
      tds = Math.round((excess * 0.10) / 12);
    }
    
    // Get previous month's TDS for fallback
    const prevMonth = this.getPreviousMonth(month);
    const prevSlip = (this.data.payslips || []).find(p => p.employee_id === emp.id && p.month === prevMonth);
    const prevTds = prevSlip?.tds || 0;
    const prevCustom = prevSlip?.custom_deductions || 0;
    const prevAdvance = prevSlip?.salary_advance || 0;

    let loan_deduction = 0;
    const activeLoans = (this.data.loans || []).filter(l => {
      if (l.employee_id !== emp.id) return false;
      if (l.status !== 'ACTIVE' && l.status !== 'NONE' && l.status !== undefined && l.status !== null) return false;
      // FIX: Only deduct loan from its start month onwards
      const loanStart = l.emi_start_month || l.opening_date?.substring(0, 7) || '2026-04';
      if (loanStart > month) return false;
      return true;
    });
    for (const l of activeLoans) {
      const skipped = Array.isArray(l.skipped_months) ? l.skipped_months : [];
      if (skipped.includes(month)) {
        continue; // Skip EMI for this month
      }

      const openingBal = l.opening_balance !== undefined ? Number(l.opening_balance) : Number(l.amount || 0);
      const additionalTotal = (l.additional_loans || [])
        .filter(a => !a.month || a.month <= month)
        .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const totalLoanAmount = openingBal + additionalTotal;

      const previousDeductions = this.data.payslips
        .filter(p => p.employee_id === emp.id && p.month !== month)
        .reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
      
      const remaining = Math.max(0, totalLoanAmount - previousDeductions);
      if (remaining > 0) {
        const deduct = Math.min(Number(l.monthly_deduction || 0), remaining);
        loan_deduction += deduct;
      }
    }

    // Check if existing slip already has manual variable inputs
    const existingSlip = (this.data.payslips || []).find(p => p.id === `SLIP-${emp.id}-${month}`);

    // TDS: Use existing slip value, or previous month value, or auto-calculate
    const tdsVal = existingSlip?.tds !== undefined ? existingSlip.tds : (prevTds > 0 ? prevTds : tds);
    
    // Other Deductions: Use existing slip value, or previous month value
    const customDed = existingSlip?.custom_deductions !== undefined ? (existingSlip.custom_deductions || 0) : prevCustom;
    
    // Salary Advance: Use existing slip value, or previous month value
    const advanceDed = existingSlip?.salary_advance !== undefined ? (existingSlip.salary_advance || 0) : prevAdvance;
    const canteenDed = existingSlip?.canteen_deduction || 0;
    const uniformDed = existingSlip?.uniform_deduction || 0;
    const noticeDed = existingSlip?.notice_deduction || 0;
    const mobileDed = existingSlip?.mobile_deduction || 0;
    const damageDed = existingSlip?.damage_deduction || 0;

    const bonusInc = existingSlip?.bonus_incentive || 0;
    const perfInc = existingSlip?.performance_incentive || 0;
    const attInc = existingSlip?.attendance_incentive || 0;
    const prodInc = existingSlip?.production_incentive || 0;
    const reimb = existingSlip?.reimbursement || 0;
    const specAdd = existingSlip?.special_allowance_addition || 0;
    const arrearPay = existingSlip?.arrear_payment || 0;
    const otherEarn = existingSlip?.other_earnings || 0;
    const remarksText = existingSlip?.remarks || '';

    const varEarnings = bonusInc + perfInc + attInc + prodInc + reimb + specAdd + arrearPay + otherEarn;
    const final_gross_salary = gross_salary + varEarnings;

    const varDeductions = customDed + advanceDed;
    const total_deductions = pf_deduction + esic_deduction + tdsVal + loan_deduction + varDeductions;
    const net_salary = Math.max(0, final_gross_salary - total_deductions);

    // Store bonus provision in bonus_provisions table
    if (earned_bonus > 0) {
      const bonusId = `BONUS-${emp.id}-${month}`;
      const existingBonus = (this.data as any).bonus_provisions?.find((b: any) => b.id === bonusId);
      if (!existingBonus) {
        if (!(this.data as any).bonus_provisions) (this.data as any).bonus_provisions = [];
        (this.data as any).bonus_provisions.push({
          id: bonusId,
          employee_id: emp.id,
          employee_name: emp.name,
          company: emp.company,
          month,
          base_salary: rate_base,
          bonus_rate: 8.33,
          bonus_amount: earned_bonus,
          status: 'ACCUMULATED',
          paid_in_month: null,
          created_at: new Date().toISOString()
        });
        try {
          this.dbSqlite.run(`INSERT OR REPLACE INTO bonus_provisions (id, employee_id, employee_name, company, month, base_salary, bonus_rate, bonus_amount, status, paid_in_month, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            bonusId, emp.id, emp.name, emp.company, month, rate_base, 8.33, earned_bonus, 'ACCUMULATED', null, new Date().toISOString()
          ]);
        } catch (e: any) { console.error('[Bonus] Insert error:', e?.message); }
      }
    }
    const ctc_salary = final_gross_salary + employer_pf + employer_esic + earned_bonus;

    return {
      id: `SLIP-${emp.id}-${month}`,
      employee_id: emp.id,
      employee_name: emp.name,
      designation: emp.designation,
      department: emp.department,
      pan: emp.pan,
      uan: emp.uan,
      bank_name: emp.bank_name,
      bank_account: emp.bank_account,
      ifsc: emp.ifsc,
      month,
      rate_base_salary: rate_base,
      rate_hra: rate_hra,
      rate_special_allowance: rate_special,
      rate_da: rate_da,
      rate_edu_allowance: rate_edu,
      rate_medical_allowance: rate_medical,
      rate_conveyance_allowance: rate_conveyance,
      earned_base_salary: earned_base,
      earned_hra: earned_hra,
      earned_special_allowance: earned_special,
      earned_da: earned_da,
      earned_edu_allowance: earned_edu,
      earned_medical_allowance: earned_medical,
      earned_conveyance_allowance: earned_conveyance,
      overtime_pay,
      lop_deduction,
      pf_deduction,
      esic_deduction,
      professional_tax,
      tds: tdsVal,
      custom_deductions: customDed,
      loan_deduction,
      salary_advance: advanceDed,
      canteen_deduction: 0,
      uniform_deduction: 0,
      notice_deduction: 0,
      mobile_deduction: 0,
      damage_deduction: 0,
      bonus_incentive: bonusInc,
      performance_incentive: perfInc,
      attendance_incentive: attInc,
      production_incentive: prodInc,
      reimbursement: reimb,
      special_allowance_addition: specAdd,
      arrear_payment: arrearPay,
      other_earnings: otherEarn,
      remarks: remarksText,
      gross_salary: final_gross_salary,
      total_deductions,
      net_salary,
      employer_pf,
      employer_esic,
      rate_bonus_payable: rate_bonus,
      earned_bonus_payable: earned_bonus,
      ctc_salary,
      hidden_salary_heads: emp.hidden_salary_heads || '',
      salary_structure_type: emp.salary_structure_type || 'FIXED',
      pay_days: workDays,
      total_days: totalDays
    };
  }

  public updatePayslipFullVariableInputs(id: string, inputs: any): Payslip | null {
    const s = this.data.payslips.find(p => p.id === id);
    if (!s) return null;

    // Super Admin can update salary rates directly
    if (inputs.rate_base_salary !== undefined) s.rate_base_salary = Number(inputs.rate_base_salary);
    if (inputs.rate_hra !== undefined) s.rate_hra = Number(inputs.rate_hra);
    if (inputs.rate_edu_allowance !== undefined) s.rate_edu_allowance = Number(inputs.rate_edu_allowance);
    if (inputs.rate_medical_allowance !== undefined) s.rate_medical_allowance = Number(inputs.rate_medical_allowance);
    if (inputs.rate_conveyance_allowance !== undefined) s.rate_conveyance_allowance = Number(inputs.rate_conveyance_allowance);
    if (inputs.rate_special_allowance !== undefined) s.rate_special_allowance = Number(inputs.rate_special_allowance);
    if (inputs.rate_da !== undefined) s.rate_da = Number(inputs.rate_da);
    // Recalculate earned values from rates
    s.earned_base_salary = s.rate_base_salary;
    s.earned_hra = s.rate_hra;
    s.earned_edu_allowance = s.rate_edu_allowance;
    s.earned_medical_allowance = s.rate_medical_allowance;
    s.earned_conveyance_allowance = s.rate_conveyance_allowance;
    s.earned_special_allowance = s.rate_special_allowance;
    s.earned_da = s.rate_da;

    // Attendance changes — recalculate earned values
    if (inputs.pay_days !== undefined) {
      const newPayDays = Number(inputs.pay_days);
      const totalDays = s.total_days || 30;
      s.pay_days = newPayDays;
      s.lop_days = inputs.lop_days !== undefined ? Number(inputs.lop_days) : (totalDays - newPayDays);
      const proration = Math.max(0, newPayDays) / totalDays;
      s.earned_base_salary = Math.round(s.rate_base_salary * proration);
      s.earned_hra = Math.round(s.rate_hra * proration);
      s.earned_special_allowance = Math.round(s.rate_special_allowance * proration);
      s.earned_edu_allowance = Math.round((s.rate_edu_allowance || 0) * proration);
      s.earned_medical_allowance = Math.round((s.rate_medical_allowance || 0) * proration);
      s.earned_conveyance_allowance = Math.round((s.rate_conveyance_allowance || 0) * proration);
      s.lop_deduction = Math.round((s.rate_base_salary + (s.rate_hra || 0) + (s.rate_special_allowance || 0)) * (s.lop_days / totalDays));
      // Recalculate PF/ESIC on new earned base
      if (s.pf_deduction > 0) s.pf_deduction = Math.round(s.earned_base_salary * 0.12);
    }
    s.tds = inputs.tds !== undefined ? Number(inputs.tds) : (s.tds || 0);
    s.pf_deduction = inputs.pf_deduction !== undefined ? Number(inputs.pf_deduction) : (s.pf_deduction || 0);
    s.loan_deduction = inputs.loan_deduction !== undefined ? Number(inputs.loan_deduction) : (s.loan_deduction || 0);
    s.esic_deduction = inputs.esic_deduction !== undefined ? Number(inputs.esic_deduction) : (s.esic_deduction || 0);
    s.custom_deductions = inputs.custom_deductions !== undefined ? Number(inputs.custom_deductions) : (s.custom_deductions || 0);
    s.salary_advance = inputs.salary_advance !== undefined ? Number(inputs.salary_advance) : (s.salary_advance || 0);
    s.canteen_deduction = inputs.canteen_deduction !== undefined ? Number(inputs.canteen_deduction) : (s.canteen_deduction || 0);
    s.uniform_deduction = inputs.uniform_deduction !== undefined ? Number(inputs.uniform_deduction) : (s.uniform_deduction || 0);
    s.notice_deduction = inputs.notice_deduction !== undefined ? Number(inputs.notice_deduction) : (s.notice_deduction || 0);
    s.mobile_deduction = inputs.mobile_deduction !== undefined ? Number(inputs.mobile_deduction) : (s.mobile_deduction || 0);
    s.damage_deduction = inputs.damage_deduction !== undefined ? Number(inputs.damage_deduction) : (s.damage_deduction || 0);

    s.bonus_incentive = inputs.bonus_incentive !== undefined ? Number(inputs.bonus_incentive) : (s.bonus_incentive || 0);
    s.performance_incentive = inputs.performance_incentive !== undefined ? Number(inputs.performance_incentive) : (s.performance_incentive || 0);
    s.attendance_incentive = inputs.attendance_incentive !== undefined ? Number(inputs.attendance_incentive) : (s.attendance_incentive || 0);
    s.production_incentive = inputs.production_incentive !== undefined ? Number(inputs.production_incentive) : (s.production_incentive || 0);
    s.reimbursement = inputs.reimbursement !== undefined ? Number(inputs.reimbursement) : (s.reimbursement || 0);
    s.special_allowance_addition = inputs.special_allowance_addition !== undefined ? Number(inputs.special_allowance_addition) : (s.special_allowance_addition || 0);
    s.arrear_payment = inputs.arrear_payment !== undefined ? Number(inputs.arrear_payment) : (s.arrear_payment || 0);
    s.other_earnings = inputs.other_earnings !== undefined ? Number(inputs.other_earnings) : (s.other_earnings || 0);
    s.remarks = inputs.remarks !== undefined ? String(inputs.remarks) : (s.remarks || '');

    const baseGross = s.earned_base_salary + s.earned_hra + s.earned_special_allowance + (s.earned_edu_allowance || 0) + (s.earned_medical_allowance || 0) + (s.earned_conveyance_allowance || 0);
    const varEarnings = (s.bonus_incentive || 0) + (s.performance_incentive || 0) + (s.attendance_incentive || 0) + (s.production_incentive || 0) + (s.reimbursement || 0) + (s.special_allowance_addition || 0) + (s.arrear_payment || 0) + (s.other_earnings || 0);
    
    s.gross_salary = baseGross + varEarnings;

    const varDeductions = (s.custom_deductions || 0) + (s.canteen_deduction || 0) + (s.uniform_deduction || 0) + (s.notice_deduction || 0) + (s.mobile_deduction || 0) + (s.damage_deduction || 0) + (s.salary_advance || 0);
    
    s.total_deductions = s.pf_deduction + s.esic_deduction + s.professional_tax + s.tds + s.loan_deduction + varDeductions;
    s.net_salary = Math.max(0, s.gross_salary - s.total_deductions);

    // Save in SQLite
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO payslips (
        id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month,
        rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance,
        earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance,
        overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction, salary_advance,
        gross_salary, total_deductions, net_salary, employer_pf, employer_esic, payment_status, payment_date, hidden_salary_heads, salary_structure_type,
        bonus_incentive, performance_incentive, attendance_incentive, production_incentive, reimbursement, special_allowance_addition,
        arrear_payment, other_earnings, canteen_deduction, uniform_deduction, notice_deduction, mobile_deduction, damage_deduction, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id, s.employee_id, s.employee_name, s.designation, s.department, s.pan, s.uan, s.bank_name, s.bank_account, s.ifsc, s.month,
        s.rate_base_salary, s.rate_hra, s.rate_special_allowance, s.rate_da, s.rate_edu_allowance || 0, s.rate_medical_allowance || 0, s.rate_conveyance_allowance || 0,
        s.earned_base_salary, s.earned_hra, s.earned_special_allowance, s.earned_da, s.earned_edu_allowance || 0, s.earned_medical_allowance || 0, s.earned_conveyance_allowance || 0,
        s.overtime_pay, s.lop_deduction, s.pf_deduction, s.esic_deduction, s.professional_tax, s.tds, s.custom_deductions, s.loan_deduction, s.salary_advance || 0,
        s.gross_salary, s.total_deductions, s.net_salary, s.employer_pf, s.employer_esic, s.payment_status || 'PENDING', s.payment_date || null,
        s.hidden_salary_heads || null, s.salary_structure_type || 'FIXED',
        s.bonus_incentive || 0, s.performance_incentive || 0, s.attendance_incentive || 0, s.production_incentive || 0, s.reimbursement || 0, s.special_allowance_addition || 0,
        s.arrear_payment || 0, s.other_earnings || 0, s.canteen_deduction || 0, s.uniform_deduction || 0, s.notice_deduction || 0, s.mobile_deduction || 0, s.damage_deduction || 0, s.remarks || ''
      ]
    );

    this.persistData();
    return s;
  }

  public runPayroll(month: string, companyFilter?: string): PayrollRun {
    // FIX: Save manual edits before deleting payslips so they survive recalculation
    const existingSlipsForMonth = this.data.payslips.filter(p => p.month === month);
    const savedManualInputs: Record<string, any> = {};
    for (const es of existingSlipsForMonth) {
      savedManualInputs[es.employee_id] = {
        tds: es.tds,
        custom_deductions: es.custom_deductions,
        salary_advance: es.salary_advance,
        // NOTE: loan_deduction is AUTO-CALCULATED from Loan Register - do NOT preserve
        bonus_incentive: es.bonus_incentive,
        performance_incentive: es.performance_incentive,
        attendance_incentive: es.attendance_incentive,
        production_incentive: es.production_incentive,
        reimbursement: es.reimbursement,
        special_allowance_addition: es.special_allowance_addition,
        arrear_payment: es.arrear_payment,
        other_earnings: es.other_earnings,
        remarks: es.remarks,
      };
    }

    if (companyFilter && companyFilter !== 'ALL') {
      this.data.payslips = this.data.payslips.filter(p => {
        const emp = this.getEmployeeById(p.employee_id);
        const matchMonth = p.month === month;
        return !(matchMonth && emp?.company === companyFilter);
      });
      this.data.payroll_runs = this.data.payroll_runs.filter(r => !(r.month === month && r.id.includes(companyFilter)));
      
      this.dbSqlite.run(`DELETE FROM payslips WHERE month = ? AND employee_id IN (SELECT id FROM employees WHERE company = ?)`, [month, companyFilter]);
      this.dbSqlite.run(`DELETE FROM payroll_runs WHERE month = ? AND id LIKE ?`, [month, `%${companyFilter}%`]);
    } else {
      this.data.payslips = this.data.payslips.filter(p => p.month !== month);
      this.data.payroll_runs = this.data.payroll_runs.filter(r => r.month !== month);
      
      this.dbSqlite.run(`DELETE FROM payslips WHERE month = ?`, [month]);
      this.dbSqlite.run(`DELETE FROM payroll_runs WHERE month = ?`, [month]);
    }

    const activeSlips: Payslip[] = [];
    let gross_sum = 0;
    let deduct_sum = 0;
    let net_sum = 0;

    const targets = this.getEmployees(companyFilter).filter(e => e.status === 'ACTIVE');

    for (const emp of targets) {
      let att = this.data.attendance.find(a => a.employee_id === emp.id && a.month === month);
      if (!att) {
        att = {
          id: `ATT-${emp.id}-${month}`,
          employee_id: emp.id,
          month,
          total_days: 30,
          working_days: 30,
          lop_days: 0,
          overtime_hours: 0
        };
        this.data.attendance.push(att);
        this.dbSqlite.run(`INSERT OR REPLACE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [att.id, att.employee_id, att.month, att.total_days, att.working_days, att.lop_days, att.overtime_hours]
        );
      }

      const slip = this.calculateSingleSlip(emp, att, month);

      // FIX: Restore manual edits that HR made before recalculation
      const saved = savedManualInputs[emp.id];
      if (saved) {
        if (saved.tds !== undefined) slip.tds = saved.tds;
        if (saved.custom_deductions !== undefined) slip.custom_deductions = saved.custom_deductions;
        if (saved.salary_advance !== undefined) slip.salary_advance = saved.salary_advance;
        if (saved.loan_deduction !== undefined && saved.loan_deduction !== 0) slip.loan_deduction = saved.loan_deduction;
        if (saved.bonus_incentive !== undefined) slip.bonus_incentive = saved.bonus_incentive;
        if (saved.performance_incentive !== undefined) slip.performance_incentive = saved.performance_incentive;
        if (saved.attendance_incentive !== undefined) slip.attendance_incentive = saved.attendance_incentive;
        if (saved.production_incentive !== undefined) slip.production_incentive = saved.production_incentive;
        if (saved.reimbursement !== undefined) slip.reimbursement = saved.reimbursement;
        if (saved.special_allowance_addition !== undefined) slip.special_allowance_addition = saved.special_allowance_addition;
        if (saved.arrear_payment !== undefined) slip.arrear_payment = saved.arrear_payment;
        if (saved.other_earnings !== undefined) slip.other_earnings = saved.other_earnings;
        if (saved.remarks !== undefined) slip.remarks = saved.remarks;
        // Recalculate totals after restoring manual edits
        const varDeductions = (slip.custom_deductions || 0) + (slip.salary_advance || 0);
        slip.total_deductions = (slip.pf_deduction || 0) + (slip.esic_deduction || 0) + (slip.tds || 0) + (slip.loan_deduction || 0) + varDeductions;
        slip.net_salary = Math.max(0, slip.gross_salary - slip.total_deductions);
      }

      activeSlips.push(slip);

      gross_sum += slip.gross_salary;
      deduct_sum += slip.total_deductions;
      net_sum += slip.net_salary;
    }

    this.data.payslips.push(...activeSlips);

    const suffix = companyFilter && companyFilter !== 'ALL' ? `-${companyFilter}` : '';
    const newRun: PayrollRun = {
      id: `RUN-${month}${suffix}`,
      month,
      status: 'DRAFT',
      processed_at: new Date().toISOString(),
      total_employees: activeSlips.length,
      total_gross: gross_sum,
      total_deductions: deduct_sum,
      total_net: net_sum
    };

    this.data.payroll_runs.push(newRun);

    this.dbSqlite.serialize(() => {
      this.dbSqlite.run(`INSERT OR REPLACE INTO payroll_runs (id, month, status, processed_at, total_employees, total_gross, total_deductions, total_net) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newRun.id, newRun.month, newRun.status, newRun.processed_at, newRun.total_employees, newRun.total_gross, newRun.total_deductions, newRun.total_net]
      );

      for (const s of activeSlips) {
        s.payment_status = 'PENDING';
        s.payment_date = '';
        this.dbSqlite.run(`INSERT OR REPLACE INTO payslips (id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month, rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance, earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance, overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction, salary_advance, gross_salary, total_deductions, net_salary, employer_pf, employer_esic, payment_status, payment_date, hidden_salary_heads, salary_structure_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.id, s.employee_id, s.employee_name, s.designation, s.department, s.pan, s.uan, s.bank_name, s.bank_account, s.ifsc, s.month,
            s.rate_base_salary, s.rate_hra, s.rate_special_allowance, s.rate_da, s.rate_edu_allowance || 0, s.rate_medical_allowance || 0, s.rate_conveyance_allowance || 0,
            s.earned_base_salary, s.earned_hra, s.earned_special_allowance, s.earned_da, s.earned_edu_allowance || 0, s.earned_medical_allowance || 0, s.earned_conveyance_allowance || 0,
            s.overtime_pay, s.lop_deduction, s.pf_deduction, s.esic_deduction, s.professional_tax, s.tds, s.custom_deductions, s.loan_deduction, s.salary_advance || 0,
            s.gross_salary, s.total_deductions, s.net_salary, s.employer_pf, s.employer_esic,
            s.payment_status, s.payment_date,
            s.hidden_salary_heads || null, s.salary_structure_type || 'FIXED'
          ]
        );
      }
    });

    this.persistData();
    return newRun;
  }

  public closePayroll(month: string, companyFilter?: string): boolean {
    const suffix = companyFilter && companyFilter !== 'ALL' ? `-${companyFilter}` : '';
    const run = this.data.payroll_runs.find(r => r.month === month && r.id === `RUN-${month}${suffix}`);
    if (!run) return false;
    run.status = 'CLOSED';
    
    this.dbSqlite.run(`UPDATE payroll_runs SET status = 'CLOSED' WHERE id = ?`, [run.id]);
    this.persistData();
    return true;
  }

  public payPayslips(month: string, companyFilter?: string, paymentDate?: string): { success: boolean; count: number; notifications: any[] } {
    const payDate = paymentDate || new Date().toISOString().split('T')[0];
    const matchingSlips = this.data.payslips.filter(s => {
      if (s.month !== month) return false;
      if (companyFilter && companyFilter !== 'ALL') {
        const emp = this.getEmployeeById(s.employee_id);
        if (!emp || emp.company !== companyFilter) return false;
      }
      return true;
    });

    const notifications: any[] = [];
    matchingSlips.forEach(s => {
      s.payment_status = 'PAID';
      s.payment_date = payDate;
      this.dbSqlite.run(`UPDATE payslips SET payment_status = 'PAID', payment_date = ? WHERE id = ?`, [payDate, s.id]);

      const last4 = s.bank_account ? s.bank_account.slice(-4) : 'XXXX';
      
      const parts = month.split('-');
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthFormatted = parts.length === 2 ? `${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}` : month;

      const whatsappTemplate = `*SALARY CREDIT ALERT* 💸
      
Dear *${s.employee_name}*,

We are pleased to inform you that your salary for the month of *${monthFormatted}* has been successfully processed and credited.

🔹 *Net Amount:* ₹${s.net_salary.toLocaleString('en-IN')}
🔹 *Account:* ******${last4}
🔹 *Date:* ${payDate}
🔹 *Status:* SUCCESS / CREDITED

You can download your detailed payslip from the employee portal. Thank you for your hard work!

Best regards,
*HR Operations Team*
_Sakar & SVN Group_`;

      const smsTemplate = `Alert: Dear ${s.employee_name}, your salary for ${monthFormatted} of INR ${s.net_salary.toLocaleString('en-IN')} has been credited to bank account ******${last4} on ${payDate}. Regards, HR Dept, Sakar Group.`;

      const emailTemplate = `Subject: Salary Credit Intimation - ${monthFormatted}

Dear ${s.employee_name} ({employee_id}),

This is to inform you that your salary for the month of ${monthFormatted} has been credited to your registered bank account on ${payDate}.

Disbursement Details:
------------------------------------
Employee Name:     ${s.employee_name}
Designation:       ${s.employee_id}
Bank Account:      ******${last4}
Net Salary Paid:   ₹${s.net_salary.toLocaleString('en-IN')}
------------------------------------

The detailed payslip is available for download on the Employee Self-Service (ESS) Portal. If you have any queries regarding your payroll calculation, please write to us at hr@sakarelectricals.com.

Thank you for your valuable contribution and dedication!

Sincerely,
HR & Payroll Team
Sakar & SVN Group`;

      notifications.push({
        employee_id: s.employee_id,
        employee_name: s.employee_name,
        whatsapp: whatsappTemplate,
        sms: smsTemplate,
        email: emailTemplate,
        amount: s.net_salary,
        date: payDate
      });
    });

    return {
      success: true,
      count: matchingSlips.length,
      notifications
    };
  }

  // Mark individual payslip as PAID
  public markPayslipPaid(payslipId: string, paymentDate: string): boolean {
    const slip = this.data.payslips.find(s => s.id === payslipId);
    if (!slip) return false;
    slip.payment_status = 'PAID';
    slip.payment_date = paymentDate;
    this.dbSqlite.run(`UPDATE payslips SET payment_status = 'PAID', payment_date = ? WHERE id = ?`, [paymentDate, payslipId]);
    return true;
  }

  // Company Master Module methods
  public getCompanies(): CompanyMaster[] {
    if (!this.data.companies) this.data.companies = [];
    return this.data.companies;
  }

  public addCompany(c: CompanyMaster): CompanyMaster {
    if (!this.data.companies) this.data.companies = [];
    const idx = this.data.companies.findIndex(co => co.id === c.id);
    if (idx >= 0) {
      this.data.companies[idx] = c;
    } else {
      this.data.companies.push(c);
    }

    this.dbSqlite.run(`INSERT OR REPLACE INTO companies (id, name, unit_name, logo, registered_office, factory_address, gst_number, pan_number, tan_number, cin_number, pf_number, esic_number, pt_number, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.unit_name, c.logo, c.registered_office, c.factory_address, c.gst_number, c.pan_number, c.tan_number, c.cin_number, c.pf_number, c.esic_number, c.pt_number, c.settings || ''],
      (err: any) => { if (err) console.error('SQLite Sync Error on adding Company:', err); }
    );
    return c;
  }

  public updateCompany(id: string, updated: Partial<CompanyMaster>): CompanyMaster | undefined {
    if (!this.data.companies) this.data.companies = [];
    const idx = this.data.companies.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.data.companies[idx] = { ...this.data.companies[idx], ...updated };
    
    const c = this.data.companies[idx];
    this.dbSqlite.run(`INSERT OR REPLACE INTO companies (id, name, unit_name, logo, registered_office, factory_address, gst_number, pan_number, tan_number, cin_number, pf_number, esic_number, pt_number, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.unit_name, c.logo, c.registered_office, c.factory_address, c.gst_number, c.pan_number, c.tan_number, c.cin_number, c.pf_number, c.esic_number, c.pt_number, c.settings || ''],
      (err: any) => { if (err) console.error('SQLite Sync Error on Companies:', err); }
    );
    return c;
  }

  // Salary Revision Module methods
  public getSalaryRevisions(employeeCode?: string): SalaryRevision[] {
    if (!this.data.salary_revisions) this.data.salary_revisions = [];
    if (employeeCode) {
      return this.data.salary_revisions.filter(r => r.employee_code === employeeCode);
    }
    return this.data.salary_revisions;
  }

  public addSalaryRevision(rev: Omit<SalaryRevision, 'id' | 'created_at'> & {
    hra?: number;
    conveyance_allowance?: number;
    edu_allowance?: number;
    medical_allowance?: number;
    special_allowance?: number;
    da?: number;
    remarks?: string;
    increment_amount?: number;
    old_structure?: string;
    new_structure?: string;
  }): SalaryRevision {
    if (!this.data.salary_revisions) this.data.salary_revisions = [];
    const newRev: SalaryRevision = {
      id: `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employee_code: rev.employee_code,
      old_salary: Number(rev.old_salary),
      new_salary: Number(rev.new_salary),
      effective_date: rev.effective_date,
      reason: rev.reason || '',
      approved_by: rev.approved_by || 'Admin',
      remarks: rev.remarks || '',
      increment_amount: rev.increment_amount !== undefined ? Number(rev.increment_amount) : (Number(rev.new_salary) - Number(rev.old_salary)),
      old_structure: rev.old_structure || '',
      new_structure: rev.new_structure || '',
      created_at: new Date().toISOString()
    };
    this.data.salary_revisions.push(newRev);
    this.persistData();

    this.dbSqlite.run(
      `INSERT INTO salary_revisions (id, employee_code, old_salary, new_salary, effective_date, reason, approved_by, created_at, remarks, increment_amount, old_structure, new_structure) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newRev.id, 
        newRev.employee_code, 
        newRev.old_salary, 
        newRev.new_salary, 
        newRev.effective_date, 
        newRev.reason, 
        newRev.approved_by, 
        newRev.created_at,
        newRev.remarks,
        newRev.increment_amount,
        newRev.old_structure,
        newRev.new_structure
      ],
      (err: any) => { if (err) console.error('SQLite Sync Error on Salary Revisions:', err); }
    );

    const emp = this.getEmployeeById(rev.employee_code);
    if (emp) {
      emp.base_salary = rev.new_salary;
      emp.hra = rev.hra !== undefined ? Number(rev.hra) : Math.round(rev.new_salary * 0.40);
      emp.special_allowance = rev.special_allowance !== undefined ? Number(rev.special_allowance) : Math.round(rev.new_salary * 0.15);
      emp.da = 0; // DA completely removed
      
      if (rev.conveyance_allowance !== undefined) emp.conveyance_allowance = Number(rev.conveyance_allowance);
      if (rev.edu_allowance !== undefined) emp.edu_allowance = Number(rev.edu_allowance);
      if (rev.medical_allowance !== undefined) emp.medical_allowance = Number(rev.medical_allowance);
      
      // Calculate total CTC
      emp.ctc_salary = emp.base_salary + emp.hra + emp.special_allowance + 
                       (emp.conveyance_allowance || 0) + (emp.edu_allowance || 0) + (emp.medical_allowance || 0);
      
      this.syncEmployee(emp);
    }

    return newRev;
  }

  public deleteSalaryRevision(id: string): void {
    if (!this.data.salary_revisions) this.data.salary_revisions = [];
    this.data.salary_revisions = this.data.salary_revisions.filter(r => r.id !== id);
    this.persistData();
    this.dbSqlite.run(`DELETE FROM salary_revisions WHERE id = ?`, [id], (err: any) => {
      if (err) console.error('SQLite Sync Error on Salary Revision Delete:', err);
    });
  }

  public updateSalaryRevision(id: string, updates: { old_salary?: number; new_salary?: number; effective_date?: string; reason?: string; remarks?: string }): void {
    if (!this.data.salary_revisions) this.data.salary_revisions = [];
    const rev = this.data.salary_revisions.find(r => r.id === id);
    if (!rev) throw new Error('Revision not found');
    if (updates.old_salary !== undefined) rev.old_salary = Number(updates.old_salary);
    if (updates.new_salary !== undefined) rev.new_salary = Number(updates.new_salary);
    if (updates.effective_date !== undefined) rev.effective_date = updates.effective_date;
    if (updates.reason !== undefined) rev.reason = updates.reason;
    if (updates.remarks !== undefined) rev.remarks = updates.remarks;
    rev.increment_amount = Number(rev.new_salary) - Number(rev.old_salary);
    this.persistData();
    this.dbSqlite.run(
      `UPDATE salary_revisions SET old_salary=?, new_salary=?, effective_date=?, reason=?, remarks=?, increment_amount=? WHERE id=?`,
      [rev.old_salary, rev.new_salary, rev.effective_date, rev.reason, rev.remarks, rev.increment_amount, id],
      (err: any) => { if (err) console.error('SQLite Sync Error on Salary Revision Update:', err); }
    );
  }

  // Simple SQL analyzer 
  public querySQL(sql: string): SQLResult {
    const startTime = Date.now();
    try {
      let statement = sql.trim().replace(/\s+/g, ' ');
      if (statement.endsWith(';')) {
        statement = statement.slice(0, -1).trim();
      }

      const upperStmt = statement.toUpperCase();

      if (upperStmt.startsWith('SELECT')) {
        return this.executeSelect(statement, startTime);
      } else {
        throw new Error('This ERP playground supports real-time SELECT queries across schema tables to audit compliance (e.g., SELECT * FROM employees)');
      }
    } catch (e: any) {
      return {
        success: false,
        error: `SQL Syntax Error: ${e.message}`,
        queryTimeMs: Date.now() - startTime
      };
    }
  }

  private executeSelect(statement: string, startTime: number): SQLResult {
    const selectMatch = statement.match(/^SELECT\s+(.*?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.*?))?(?:\s+ORDER\s+BY\s+(.*?))?$/i);
    if (!selectMatch) {
      throw new Error("Syntax error. Try SELECT * FROM employees [WHERE company = 'SVN-1']");
    }

    const colStr = selectMatch[1].trim();
    const tableName = selectMatch[2].trim().toLowerCase();
    const whereStr = selectMatch[3] ? selectMatch[3].trim() : '';

    const validTables = ['employees', 'attendance', 'payroll_runs', 'payslips', 'leave_applications', 'ff_settlements', 'companies', 'salary_revisions', 'loans'];
    if (!validTables.includes(tableName)) {
      throw new Error(`Table "${tableName}" is not valid. Choose from: ${validTables.join(', ')}`);
    }

    let keyDB = tableName;
    const rows = (this.data as any)[keyDB] as any[];
    if (!rows || rows.length === 0) {
      return {
        success: true,
        columns: colStr === '*' ? ['id'] : colStr.split(','),
        rows: [],
        queryTimeMs: Date.now() - startTime
      };
    }

    let filteredRows = [...rows];
    if (whereStr) {
      filteredRows = filteredRows.filter(row => this.evaluateWhereCondition(row, whereStr));
    }

    const columns = colStr === '*' 
      ? Object.keys(rows[0] || {}) 
      : colStr.split(',').map(c => c.trim());

    const visualRows = filteredRows.map(row => {
      return columns.map(col => {
        if (row[col] !== undefined) {
          if (typeof row[col] === 'boolean') return row[col] ? 'TRUE' : 'FALSE';
          return row[col];
        }
        return 'NULL';
      });
    });

    return {
      success: true,
      columns,
      rows: visualRows,
      queryTimeMs: Date.now() - startTime
    };
  }

  private evaluateWhereCondition(row: any, conditionStr: string): boolean {
    const regex = /([a-zA-Z0-9_.]+)\s*((?:[!=<>]=?)|LIKE)\s*(.*)/i;
    const match = conditionStr.match(regex);
    if (!match) {
      return row[conditionStr.trim()] ? true : false;
    }

    const key = match[1].trim();
    const op = match[2].trim().toUpperCase();
    let rValue: any = match[3].trim();

    if (rValue.startsWith("'") && rValue.endsWith("'")) {
      rValue = rValue.slice(1, -1);
    } else if (rValue.toUpperCase() === 'TRUE') {
      rValue = true;
    } else if (rValue.toUpperCase() === 'FALSE') {
      rValue = false;
    } else if (!isNaN(Number(rValue))) {
      rValue = Number(rValue);
    }

    const lValue = row[key];
    if (lValue === undefined) return false;

    if (op === '=' || op === 'IS') return lValue == rValue;
    if (op === '!=') return lValue != rValue;
    if (op === '<') return lValue < rValue;
    if (op === '>') return lValue > rValue;
    if (op === 'LIKE') {
      const matchPattern = String(rValue).replace(/%/g, '.*').replace(/_/g, '.');
      return new RegExp(`^${matchPattern}$`, 'i').test(String(lValue));
    }

    return false;
  }

  // Audit Log, Payroll Lock and Database helpers
  public logAudit(action: string, details: string, userName: string): void {
    const timestamp = new Date().toISOString();
    const id = 'AUDIT-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    
    if (!this.data.audit_logs) {
      this.data.audit_logs = [];
    }
    this.data.audit_logs.push({
      id,
      action,
      details,
      user_name: userName || 'Admin',
      timestamp
    });

    this.dbSqlite.run(
      `INSERT INTO audit_logs (id, action, details, user_name, timestamp) VALUES (?, ?, ?, ?, ?)`,
      [id, action, details, userName || 'Admin', timestamp],
      (err: any) => {
        if (err) console.error('Error writing audit log:', err);
      }
    );
  }

  public getAuditLogs(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (this.inMemoryOnly) {
        resolve(this.data.audit_logs || []);
        return;
      }
      this.dbSqlite.all(`SELECT * FROM audit_logs ORDER BY timestamp DESC`, (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  public isPayrollLocked(month: string, company?: string): boolean {
    const suffix = company && company !== 'ALL' ? `-${company}` : '';
    const runId = `RUN-${month}${suffix}`;
    const run = this.data.payroll_runs.find(r => r.id === runId);
    return !!(run && run.status === 'CLOSED');
  }

  public unlockPayroll(month: string, companyFilter?: string): boolean {
    const suffix = companyFilter && companyFilter !== 'ALL' ? `-${companyFilter}` : '';
    const runId = `RUN-${month}${suffix}`;
    const run = this.data.payroll_runs.find(r => r.month === month && (r.id === runId || r.id === `RUN-${month}`));
    if (!run) return false;
    run.status = 'DRAFT';
    
    this.dbSqlite.run(`UPDATE payroll_runs SET status = 'DRAFT' WHERE id = ?`, [run.id]);
    return true;
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.dbSqlite) {
        this.dbSqlite.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // --- Assets tracking ---
  public getAssets(employeeId?: string): EmployeeAsset[] {
    const list = this.data.assets || [];
    if (employeeId) {
      return list.filter(a => a.employee_id === employeeId);
    }
    return list;
  }

  public saveAsset(asset: EmployeeAsset): void {
    if (!this.data.assets) this.data.assets = [];
    const index = this.data.assets.findIndex(a => a.id === asset.id);
    if (index >= 0) {
      this.data.assets[index] = asset;
    } else {
      this.data.assets.push(asset);
    }

    this.dbSqlite.run(
      `INSERT OR REPLACE INTO assets (id, employee_id, employee_name, asset_name, serial_number, type, issue_date, return_date, status, condition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [asset.id, asset.employee_id, asset.employee_name, asset.asset_name, asset.serial_number, asset.type, asset.issue_date, asset.return_date || null, asset.status, asset.condition]
    );
  }

  public deleteAsset(id: string): void {
    if (this.data.assets) {
      this.data.assets = this.data.assets.filter(a => a.id !== id);
    }
    this.dbSqlite.run(`DELETE FROM assets WHERE id = ?`, [id]);
  }

  // --- Travel Allowance ---
  public getTravelReimbursements(employeeId?: string): TravelReimbursement[] {
    const list = this.data.travel_reimbursements || [];
    if (employeeId) {
      return list.filter(t => t.employee_id === employeeId);
    }
    return list;
  }

  public saveTravelReimbursement(reimb: TravelReimbursement): void {
    if (!this.data.travel_reimbursements) this.data.travel_reimbursements = [];
    const index = this.data.travel_reimbursements.findIndex(t => t.id === reimb.id);
    if (index >= 0) {
      this.data.travel_reimbursements[index] = reimb;
    } else {
      this.data.travel_reimbursements.push(reimb);
    }

    this.dbSqlite.run(
      `INSERT OR REPLACE INTO travel_reimbursements (id, employee_id, employee_name, month, fuel_liters, rate_per_liter, amount, travel_purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reimb.id, reimb.employee_id, reimb.employee_name, reimb.month, reimb.fuel_liters, reimb.rate_per_liter, reimb.amount, reimb.travel_purpose, reimb.status]
    );
  }

  public deleteTravelReimbursement(id: string): void {
    if (this.data.travel_reimbursements) {
      this.data.travel_reimbursements = this.data.travel_reimbursements.filter(t => t.id !== id);
    }
    this.dbSqlite.run(`DELETE FROM travel_reimbursements WHERE id = ?`, [id]);
  }

  // --- Broadcasts/Notice Board ---
  public getBroadcasts(): BroadcastNotice[] {
    return this.data.broadcasts || [];
  }

  public saveBroadcast(notice: BroadcastNotice): void {
    if (!this.data.broadcasts) this.data.broadcasts = [];
    const index = this.data.broadcasts.findIndex(b => b.id === notice.id);
    if (index >= 0) {
      this.data.broadcasts[index] = notice;
    } else {
      this.data.broadcasts.push(notice);
    }

    this.dbSqlite.run(
      `INSERT OR REPLACE INTO broadcasts (id, title, message, target_type, target_value, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [notice.id, notice.title, notice.message, notice.target_type, notice.target_value, notice.created_at, notice.created_by]
    );
  }

  public deleteBroadcast(id: string): void {
    if (this.data.broadcasts) {
      this.data.broadcasts = this.data.broadcasts.filter(b => b.id !== id);
    }
    this.dbSqlite.run(`DELETE FROM broadcasts WHERE id = ?`, [id]);
  }

  // --- Users management ---
  public getUsers(): HRUser[] {
    return this.data.users || [];
  }

  // --- Secure System Settings & PIN management ---
  public getSystemSetting(key: string, defaultValue: string): Promise<string> {
    return new Promise<string>((resolve) => {
      this.dbSqlite.all(`SELECT value FROM system_settings WHERE key = ?`, [key], (err: any, rows: any[]) => {
        if (err || !rows || rows.length === 0) {
          resolve(defaultValue);
        } else {
          resolve(rows[0].value);
        }
      });
    });
  }

  public setSystemSetting(key: string, value: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.dbSqlite.run(`INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)`, [key, value], () => {
        resolve();
      });
    });
  }

  public getFullBackupJSON(): any {
    return this.data;
  }

  /** Track last persist success/failure for HR error surfacing */
  public lastPersistError: string | null = null;
  public lastPersistSuccess: boolean = true;

  private async _persistToSupabaseWithRetry(maxRetries = 3): Promise<{ ok: boolean; error?: string }> {
    if (!this.supabaseAdmin) return { ok: false, error: 'No Supabase client' };
    if (this.loadedFromSeed) return { ok: false, error: 'Loaded from seed — blocked' };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const TIMEOUT_MS = 15_000;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Supabase persist timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        );
        const upsertPromise = this.supabaseAdmin
          .from('vetan_erp_store')
          .upsert(
            { id: 'live', payload: this.data, updated_at: new Date().toISOString() },
            { onConflict: 'id' }
          );

        const { error } = await Promise.race([upsertPromise, timeoutPromise]);

        if (error) {
          const msg = error.message || String(error);
          console.error(`[Supabase] persist attempt ${attempt}/${maxRetries} FAILED:`, msg);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
          }
          return { ok: false, error: msg };
        }

        // Success — mark persist time so reloadFromSupabase won't overwrite
        this.lastPersistError = null;
        this.lastPersistSuccess = true;
        this.lastPersistedAt = new Date().toISOString();
        return { ok: true };
      } catch (e: any) {
        const msg = e?.message || String(e);
        console.error(`[Supabase] persist attempt ${attempt}/${maxRetries} EXCEPTION:`, msg);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        this.lastPersistError = msg;
        this.lastPersistSuccess = false;
        return { ok: false, error: msg };
      }
    }
    return { ok: false, error: 'All retries exhausted' };
  }

  /** Track pending Supabase persist so API handlers can await it. */
  private _pendingPersist: Promise<any> | null = null;

  private persistData() {
    // 1. Local JSON file (existing behavior for local dev)
    try {
      const dbPath = path.join(process.cwd(), 'payroll_persisted_store.json');
      fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist data to JSON:', e);
    }

    // 2. Supabase push — tracked so flushPendingWrites() can await it
    if (this.supabaseAdmin && !this.loadedFromSeed) {
      this._pendingPersist = this._persistToSupabaseWithRetry(3).then(result => {
        this._pendingPersist = null;
        if (!result.ok) {
          console.error('[Supabase] persistData FAILED after retries:', result.error);
        }
        return result;
      });
    } else if (this.loadedFromSeed && this.supabaseAdmin) {
      console.warn('[Supabase] persistData BLOCKED — data was loaded from seed, not pushing to prevent data loss.');
    }
  }

  /** Await any pending Supabase write — call at end of API handlers. */
  public async flushPendingWrites(): Promise<void> {
    if (this._pendingPersist) {
      try {
        await this._pendingPersist;
      } catch { /* already logged */ }
    }
  }

  /**
   * Synchronous Supabase persist — awaits the write so callers can be sure
   * data is saved before returning the HTTP response.
   */
  public async persistDataSync(): Promise<{ ok: boolean; error?: string }> {
    if (!this.supabaseAdmin) {
      const msg = 'Supabase client not available';
      console.error('[Supabase] persistDataSync ABORTED:', msg);
      return { ok: false, error: msg };
    }
    if (this.loadedFromSeed) {
      const msg = 'Data loaded from seed — not pushing';
      console.warn('[Supabase] persistDataSync BLOCKED:', msg);
      return { ok: false, error: msg };
    }
    try {
      const employeeCount = this.data?.employees?.length || 0;
      const payloadSize = JSON.stringify(this.data).length;
      console.log(`[Supabase] persistDataSync START — ${employeeCount} employees, ${payloadSize} bytes`);
      const result = await this._persistToSupabaseWithRetry(3);
      if (result.ok) {
        this.lastLoadedAt = new Date().toISOString();
        console.log('[Supabase] persistDataSync SUCCESS — data saved to vetan_erp_store');
      } else {
        console.error('[Supabase] persistDataSync FAILED:', result.error);
      }
      return result;
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error('[Supabase] persistDataSync EXCEPTION:', msg);
      return { ok: false, error: msg };
    }
  }

  /** Track when we last loaded from Supabase to avoid stale reloads. */
  private lastLoadedAt: string = '';

  /**
   * Vercel: Refresh in-memory data from Supabase so warm-started instances
   * see mutations made by other serverless invocations.
   * 
   * Only reloads if Supabase has NEWER data (updated_at > lastLoadedAt)
   * to prevent overwriting fresh in-memory mutations with stale data.
   */
  /** Track when we last WROTE to Supabase (not just read). */
  private lastPersistedAt: string = '';

  public async reloadFromSupabase(): Promise<void> {
    if (!this.supabaseAdmin) return;
    const MAX_RETRIES = 2;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const TIMEOUT_MS = 10_000;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('reloadFromSupabase timeout')), TIMEOUT_MS)
        );
        const queryPromise = this.supabaseAdmin
          .from('vetan_erp_store')
          .select('payload, updated_at')
          .eq('id', 'live')
          .maybeSingle();

        const { data: row, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
          console.error(`[Supabase] reloadFromSupabase attempt ${attempt} ERROR:`, error.message);
          if (attempt < MAX_RETRIES) { await new Promise(r => setTimeout(r, 500 * attempt)); continue; }
          return;
        }
        if (!row?.payload || typeof row.payload !== 'object') {
          console.warn('[Supabase] reloadFromSupabase — no payload found');
          return;
        }

        const remoteUpdatedAt = row.updated_at || '';

        // FIX 3: Don't reload if we just persisted newer data locally
        if (this.lastPersistedAt && remoteUpdatedAt && remoteUpdatedAt <= this.lastPersistedAt) {
          console.log(`[Supabase] reloadFromSupabase SKIPPED — remote (${remoteUpdatedAt}) <= last persisted (${this.lastPersistedAt})`);
          return;
        }
        if (this.lastLoadedAt && remoteUpdatedAt && remoteUpdatedAt <= this.lastLoadedAt) {
          console.log(`[Supabase] reloadFromSupabase SKIPPED — remote (${remoteUpdatedAt}) <= last loaded (${this.lastLoadedAt})`);
          return;
        }

        this.data = { ...this.data, ...row.payload };
        this.lastLoadedAt = remoteUpdatedAt || new Date().toISOString();
        this.inMemoryOnly = true;
        console.log(`[Supabase] reloadFromSupabase OK — ${this.data.employees?.length || 0} employees`);
        return;
      } catch (e: any) {
        console.error(`[Supabase] reloadFromSupabase attempt ${attempt} EXCEPTION:`, e?.message || e);
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
  }

  /** Force an awaited upsert to Supabase (for critical writes). */
  public async forcePersistToSupabase(): Promise<{ ok: boolean; error?: string }> {
    if (!this.supabaseAdmin) return { ok: false, error: 'No Supabase client' };
    if (this.loadedFromSeed) {
      console.warn('[Supabase] forcePersist BLOCKED — loadedFromSeed is true.');
      return { ok: false, error: 'Loaded from seed' };
    }
    return this._persistToSupabaseWithRetry(3);
  }

  public async restoreFullBackupJSON(backupData: any): Promise<void> {
    // 1. Update in-memory data
    this.data = { ...this.data, ...backupData };

    // 2. Clear and rewrite tables in SQLite
    const runSql = (sql: string, params: any[] = []): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        this.dbSqlite.run(sql, params, (err: any) => {
          if (err) {
            console.error('[restoreFullBackupJSON] SQL Error:', err, 'SQL Statement:', sql);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    };

    // Helper to clear and batch insert
    const tablesToClear = [
      'employees', 'attendance', 'payroll_runs', 'payslips', 'leave_applications',
      'ff_settlements', 'loans', 'departments', 'companies', 'salary_revisions',
      'assets', 'travel_reimbursements', 'broadcasts', 'attendance_corrections',
      'compoff_requests', 'overtime_requests', 'users', 'hods', 'audit_logs'
    ];

    try {
      await runSql('BEGIN TRANSACTION');

      for (const tbl of tablesToClear) {
        await runSql(`DELETE FROM ${tbl}`);
      }

    if (backupData.companies && Array.isArray(backupData.companies)) {
      for (const c of backupData.companies) {
        await runSql(
          `INSERT OR REPLACE INTO companies (id, name, unit_name, logo, registered_office, factory_address, gst_number, pan_number, tan_number, cin_number, pf_number, esic_number, pt_number, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.name, c.unit_name, c.logo, c.registered_office, c.factory_address, c.gst_number, c.pan_number, c.tan_number, c.cin_number, c.pf_number, c.esic_number, c.pt_number, c.settings ? (typeof c.settings === 'string' ? c.settings : JSON.stringify(c.settings)) : null]
        );
      }
    }

    if (backupData.departments && Array.isArray(backupData.departments)) {
      for (const d of backupData.departments) {
        const deptName = typeof d === 'string' ? d : d.name;
        if (deptName) {
          await runSql(`INSERT OR REPLACE INTO departments (name) VALUES (?)`, [deptName]);
        }
      }
    }

    if (backupData.employees && Array.isArray(backupData.employees)) {
      for (const e of backupData.employees) {
        const id = e.id || '';
        const name = e.name || '';
        const company = e.company || '';
        const designation = e.designation || '';
        const department = e.department || '';
        const email = e.email || '';
        const phone = e.phone || '';
        const joining_date = e.joining_date || '';
        const exit_date = e.exit_date || null;
        const status = e.status || 'ACTIVE';
        const bank_name = e.bank_name || '';
        const bank_account = e.bank_account || '';
        const ifsc = e.ifsc || '';
        const pan = e.pan || '';
        const uan = e.uan || '';
        const base_salary = e.base_salary !== undefined ? Number(e.base_salary) : 0;
        const hra = e.hra !== undefined ? Number(e.hra) : 0;
        const special_allowance = e.special_allowance !== undefined ? Number(e.special_allowance) : 0;
        const da = e.da !== undefined ? Number(e.da) : 0;
        const pf_opt_in = e.pf_opt_in ? 1 : 0;
        const esic_opt_in = e.esic_opt_in ? 1 : 0;
        const professional_tax_opt_in = e.professional_tax_opt_in ? 1 : 0;
        const leave_balance_pl = e.leave_balance_pl !== undefined ? Number(e.leave_balance_pl) : 0;
        const leave_balance_cl = e.leave_balance_cl !== undefined ? Number(e.leave_balance_cl) : 0;
        const leave_balance_sl = e.leave_balance_sl !== undefined ? Number(e.leave_balance_sl) : 0;
        const qualification = e.qualification || '';
        const location = e.location || '';
        const vehicle_detail = e.vehicle_detail || '';
        const prev_company_name = e.prev_company_name || '';
        const prev_company_location = e.prev_company_location || '';
        const total_experience = e.total_experience || '';
        const shift_timing = e.shift_timing || '8:00 AM to 5:30 PM';
        const password = e.password || '';
        const birth_year = e.birth_year !== undefined ? Number(e.birth_year) : null;
        const needs_password_change = e.needs_password_change ? 1 : 0;
        const aadhaar_number = e.aadhaar_number || '';
        const dob = e.dob || '';
        const gender = e.gender || 'Male';
        const marital_status = e.marital_status || 'Single';
        const emergency_contact = e.emergency_contact || '';
        const blood_group = e.blood_group || 'O+';
        const esic_number = e.esic_number || '';
        const cost_center = e.cost_center || '';
        const reporting_manager = e.reporting_manager || '';
        const employee_category = e.employee_category || 'Staff';
        const reporting_hod = e.reporting_hod || null;
        const reporting_hod_name = e.reporting_hod_name || null;
        const conveyance_allowance = e.conveyance_allowance !== undefined ? Number(e.conveyance_allowance) : 0;
        const edu_allowance = e.edu_allowance !== undefined ? Number(e.edu_allowance) : 0;
        const medical_allowance = e.medical_allowance !== undefined ? Number(e.medical_allowance) : 0;
        const hidden_salary_heads = e.hidden_salary_heads || '';
        const salary_structure_type = e.salary_structure_type || 'FIXED';
        const bonus_payable = e.bonus_payable !== undefined ? Number(e.bonus_payable) : 0;
        const ctc_salary = e.ctc_salary !== undefined ? Number(e.ctc_salary) : 0;
        const reporting_hod_code = e.reporting_hod_code || e.reporting_hod || '';
        const is_hod = e.is_hod ? 1 : 0;
        const can_approve_leave = e.can_approve_leave ? 1 : 0;
        const can_approve_misspunch = e.can_approve_misspunch || e.can_approve_miss_punch ? 1 : 0;
        const photo = e.photo || '';

        await runSql(
          `INSERT OR REPLACE INTO employees (
            id, name, company, designation, department, email, phone, joining_date, exit_date, status,
            bank_name, bank_account, ifsc, pan, uan, base_salary, hra, special_allowance, da,
            pf_opt_in, esic_opt_in, professional_tax_opt_in, leave_balance_pl, leave_balance_cl, leave_balance_sl,
            qualification, location, vehicle_detail, prev_company_name, prev_company_location, total_experience,
            shift_timing, password, birth_year, needs_password_change, aadhaar_number, dob, gender,
            marital_status, emergency_contact, blood_group, esic_number, cost_center, reporting_manager,
            employee_category, reporting_hod, reporting_hod_name, conveyance_allowance, edu_allowance,
            medical_allowance, hidden_salary_heads, salary_structure_type, bonus_payable, ctc_salary,
            reporting_hod_code, is_hod, can_approve_leave, can_approve_misspunch, photo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, name, company, designation, department, email, phone, joining_date, exit_date, status,
            bank_name, bank_account, ifsc, pan, uan, base_salary, hra, special_allowance, da,
            pf_opt_in, esic_opt_in, professional_tax_opt_in, leave_balance_pl, leave_balance_cl, leave_balance_sl,
            qualification, location, vehicle_detail, prev_company_name, prev_company_location, total_experience,
            shift_timing, password, birth_year, needs_password_change, aadhaar_number, dob, gender,
            marital_status, emergency_contact, blood_group, esic_number, cost_center, reporting_manager,
            employee_category, reporting_hod, reporting_hod_name, conveyance_allowance, edu_allowance,
            medical_allowance, hidden_salary_heads, salary_structure_type, bonus_payable, ctc_salary,
            reporting_hod_code, is_hod, can_approve_leave, can_approve_misspunch, photo
          ]
        );
      }
    }

    if (backupData.attendance && Array.isArray(backupData.attendance)) {
      for (const a of backupData.attendance) {
        const id = a.id || `ATT-${a.employee_id || ''}-${a.month || ''}`;
        const employee_id = a.employee_id || '';
        const month = a.month || '';
        const total_days = a.total_days !== undefined ? Number(a.total_days) : 30;
        const working_days = a.working_days !== undefined ? Number(a.working_days) : 30;
        const lop_days = a.lop_days !== undefined ? Number(a.lop_days) : 0;
        const overtime_hours = a.overtime_hours !== undefined ? Number(a.overtime_hours) : 0;
        const present = a.present !== undefined ? Number(a.present) : null;
        const absent = a.absent !== undefined ? Number(a.absent) : null;
        const weekly_off = a.weekly_off !== undefined ? Number(a.weekly_off) : null;
        const paid_holiday = a.paid_holiday !== undefined ? Number(a.paid_holiday) : null;
        const leave = a.leave !== undefined ? Number(a.leave) : null;
        const lwp = a.lwp !== undefined ? Number(a.lwp) : null;
        const ot_hours = a.ot_hours !== undefined ? Number(a.ot_hours) : (a.overtime_hours || 0);
        const is_locked = a.is_locked ? 1 : 0;

        await runSql(
          `INSERT OR REPLACE INTO attendance (
            id, employee_id, month, total_days, working_days, lop_days, overtime_hours,
            present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, employee_id, month, total_days, working_days, lop_days, overtime_hours, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked]
        );
      }
    }

    if (backupData.payroll_runs && Array.isArray(backupData.payroll_runs)) {
      for (const r of backupData.payroll_runs) {
        const id = r.id || '';
        const month = r.month || '';
        const status = r.status || '';
        const processed_at = r.processed_at || '';
        const total_employees = r.total_employees !== undefined ? Number(r.total_employees) : 0;
        const total_gross = r.total_gross !== undefined ? Number(r.total_gross) : (r.total_gross_salary !== undefined ? Number(r.total_gross_salary) : 0);
        const total_deductions = r.total_deductions !== undefined ? Number(r.total_deductions) : 0;
        const total_net = r.total_net !== undefined ? Number(r.total_net) : (r.total_net_payout !== undefined ? Number(r.total_net_payout) : 0);

        await runSql(
          `INSERT OR REPLACE INTO payroll_runs (id, month, status, processed_at, total_employees, total_gross, total_deductions, total_net) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, month, status, processed_at, total_employees, total_gross, total_deductions, total_net]
        );
      }
    }

    if (backupData.payslips && Array.isArray(backupData.payslips)) {
      for (const p of backupData.payslips) {
        const id = p.id || '';
        const employee_id = p.employee_id || '';
        const employee_name = p.employee_name || '';
        const designation = p.designation || '';
        const department = p.department || '';
        const pan = p.pan || '';
        const uan = p.uan || '';
        const bank_name = p.bank_name || '';
        const bank_account = p.bank_account || '';
        const ifsc = p.ifsc || '';
        const month = p.month || '';
        const rate_base_salary = p.rate_base_salary !== undefined ? Number(p.rate_base_salary) : (p.base_salary !== undefined ? Number(p.base_salary) : 0);
        const rate_hra = p.rate_hra !== undefined ? Number(p.rate_hra) : (p.hra !== undefined ? Number(p.hra) : 0);
        const rate_special_allowance = p.rate_special_allowance !== undefined ? Number(p.rate_special_allowance) : (p.special_allowance !== undefined ? Number(p.special_allowance) : 0);
        const rate_da = p.rate_da !== undefined ? Number(p.rate_da) : (p.da !== undefined ? Number(p.da) : 0);
        const rate_edu_allowance = p.rate_edu_allowance !== undefined ? Number(p.rate_edu_allowance) : Number(p.edu_allowance || 0);
        const rate_medical_allowance = p.rate_medical_allowance !== undefined ? Number(p.rate_medical_allowance) : Number(p.medical_allowance || 0);
        const rate_conveyance_allowance = p.rate_conveyance_allowance !== undefined ? Number(p.rate_conveyance_allowance) : Number(p.conveyance_allowance || 0);
        const earned_base_salary = p.earned_base_salary !== undefined ? Number(p.earned_base_salary) : Number(rate_base_salary);
        const earned_hra = p.earned_hra !== undefined ? Number(p.earned_hra) : Number(rate_hra);
        const earned_special_allowance = p.earned_special_allowance !== undefined ? Number(p.earned_special_allowance) : Number(rate_special_allowance);
        const earned_da = p.earned_da !== undefined ? Number(p.earned_da) : Number(rate_da);
        const earned_edu_allowance = p.earned_edu_allowance !== undefined ? Number(p.earned_edu_allowance) : Number(rate_edu_allowance);
        const earned_medical_allowance = p.earned_medical_allowance !== undefined ? Number(p.earned_medical_allowance) : Number(rate_medical_allowance);
        const earned_conveyance_allowance = p.earned_conveyance_allowance !== undefined ? Number(p.earned_conveyance_allowance) : Number(rate_conveyance_allowance);
        const overtime_pay = p.overtime_pay !== undefined ? Number(p.overtime_pay) : 0;
        const lop_deduction = p.lop_deduction !== undefined ? Number(p.lop_deduction) : (p.lwp_deduction !== undefined ? Number(p.lwp_deduction) : 0);
        const pf_deduction = p.pf_deduction !== undefined ? Number(p.pf_deduction) : 0;
        const esic_deduction = p.esic_deduction !== undefined ? Number(p.esic_deduction) : 0;
        const professional_tax = p.professional_tax !== undefined ? Number(p.professional_tax) : (p.pt_deduction !== undefined ? Number(p.pt_deduction) : 0);
        const tds = p.tds !== undefined ? Number(p.tds) : 0;
        const custom_deductions = p.custom_deductions !== undefined ? Number(p.custom_deductions) : 0;
        const loan_deduction = p.loan_deduction !== undefined ? Number(p.loan_deduction) : 0;
        const gross_salary = p.gross_salary !== undefined ? Number(p.gross_salary) : (p.gross_earnings !== undefined ? Number(p.gross_earnings) : 0);
        const total_deductions = p.total_deductions !== undefined ? Number(p.total_deductions) : 0;
        const net_salary = p.net_salary !== undefined ? Number(p.net_salary) : 0;
        const employer_pf = p.employer_pf !== undefined ? Number(p.employer_pf) : 0;
        const employer_esic = p.employer_esic !== undefined ? Number(p.employer_esic) : 0;
        const payment_status = p.payment_status || 'PENDING';
        const payment_date = p.payment_date || null;
        const hidden_salary_heads = p.hidden_salary_heads || '';
        const salary_structure_type = p.salary_structure_type || 'FIXED';

        await runSql(
          `INSERT OR REPLACE INTO payslips (
            id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month,
            rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance,
            earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance,
            overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction,
            gross_salary, total_deductions, net_salary, employer_pf, employer_esic, payment_status, payment_date, hidden_salary_heads, salary_structure_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month,
            rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance,
            earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance,
            overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction,
            gross_salary, total_deductions, net_salary, employer_pf, employer_esic, payment_status, payment_date, hidden_salary_heads, salary_structure_type
          ]
        );
      }
    }

    if (backupData.leave_applications && Array.isArray(backupData.leave_applications)) {
      for (const l of backupData.leave_applications) {
        await runSql(
          `INSERT OR REPLACE INTO leave_applications (id, employee_id, employee_name, company, leave_type, start_date, end_date, days, reason, applied_date, status, reporting_hod, reporting_hod_name, hod_approved_date, hr_approved_date, hod_id, hr_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            l.id, l.employee_id, l.employee_name, l.company, l.leave_type, l.start_date, l.end_date, l.days, l.reason, l.applied_date,
            l.status, l.reporting_hod || null, l.reporting_hod_name || null, l.hod_approved_date || null, l.hr_approved_date || null,
            l.hod_id || null, l.hr_id || null
          ]
        );
      }
    }

    if (backupData.ff_settlements && Array.isArray(backupData.ff_settlements)) {
      for (const f of backupData.ff_settlements) {
        await runSql(
          `INSERT OR REPLACE INTO ff_settlements (id, employee_id, employee_name, company, last_working_day, gratuity_earned, earned_leave_encashment, unpaid_salary_days, unpaid_salary_earned, notice_period_deduction, gross_earnings, gross_deductions, net_settlement_pay, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            f.id, f.employee_id, f.employee_name, f.company, f.last_working_day, f.gratuity_earned, f.earned_leave_encashment,
            f.unpaid_salary_days, f.unpaid_salary_earned, f.notice_period_deduction, f.gross_earnings, f.gross_deductions, f.net_settlement_pay,
            f.status
          ]
        );
      }
    }

    if (backupData.loans && Array.isArray(backupData.loans)) {
      for (const lo of backupData.loans) {
        const id = lo.id || '';
        const employee_id = lo.employee_id || '';
        const employee_name = lo.employee_name || '';
        const amount = lo.amount !== undefined ? Number(lo.amount) : 0;
        const month = lo.month || '';
        const monthly_deduction = lo.monthly_deduction !== undefined ? Number(lo.monthly_deduction) : 0;
        const reason = lo.reason || '';
        const status = lo.status || 'PENDING';

        await runSql(
          `INSERT OR REPLACE INTO loans (id, employee_id, employee_name, amount, month, monthly_deduction, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, employee_id, employee_name, amount, month, monthly_deduction, reason, status]
        );
      }
    }

    if (backupData.salary_revisions && Array.isArray(backupData.salary_revisions)) {
      for (const sr of backupData.salary_revisions) {
        const id = sr.id;
        const employee_code = sr.employee_code || sr.employee_id || '';
        const old_salary = sr.old_salary !== undefined ? Number(sr.old_salary) : 0;
        const new_salary = sr.new_salary !== undefined ? Number(sr.new_salary) : 0;
        const effective_date = sr.effective_date || '';
        const reason = sr.reason || '';
        const approved_by = sr.approved_by || '';
        const created_at = sr.created_at || sr.approved_date || new Date().toISOString();
        const remarks = sr.remarks || '';
        const increment_amount = sr.increment_amount !== undefined ? Number(sr.increment_amount) : (new_salary - old_salary);
        const old_structure = typeof sr.old_structure === 'object' ? JSON.stringify(sr.old_structure) : (sr.old_structure || '');
        const new_structure = typeof sr.new_structure === 'object' ? JSON.stringify(sr.new_structure) : (sr.new_structure || '');

        await runSql(
          `INSERT OR REPLACE INTO salary_revisions (id, employee_code, old_salary, new_salary, effective_date, reason, approved_by, created_at, remarks, increment_amount, old_structure, new_structure) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, employee_code, old_salary, new_salary, effective_date, reason, approved_by, created_at, remarks, increment_amount, old_structure, new_structure]
        );
      }
    }

    if (backupData.assets && Array.isArray(backupData.assets)) {
      for (const as of backupData.assets) {
        const id = as.id || '';
        const employee_id = as.employee_id || null;
        const employee_name = as.employee_name || null;
        const asset_name = as.asset_name || as.name || '';
        const serial_number = as.serial_number || '';
        const type = as.type || '';
        const issue_date = as.issue_date || as.assigned_date || as.purchase_date || '';
        const return_date = as.return_date || null;
        const status = as.status || 'ASSIGNED';
        const condition = as.condition || '';

        await runSql(
          `INSERT OR REPLACE INTO assets (id, employee_id, employee_name, asset_name, serial_number, type, issue_date, return_date, status, condition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, employee_id, employee_name, asset_name, serial_number, type, issue_date, return_date, status, condition]
        );
      }
    }

    if (backupData.travel_reimbursements && Array.isArray(backupData.travel_reimbursements)) {
      for (const tr of backupData.travel_reimbursements) {
        const id = tr.id || '';
        const employee_id = tr.employee_id || '';
        const employee_name = tr.employee_name || '';
        const month = tr.month || '';
        const fuel_liters = tr.fuel_liters !== undefined ? Number(tr.fuel_liters) : 0;
        const rate_per_liter = tr.rate_per_liter !== undefined ? Number(tr.rate_per_liter) : 0;
        const amount = tr.amount !== undefined ? Number(tr.amount) : (tr.total_amount !== undefined ? Number(tr.total_amount) : 0);
        const travel_purpose = tr.travel_purpose || tr.purpose || '';
        const status = tr.status || 'PENDING';

        await runSql(
          `INSERT OR REPLACE INTO travel_reimbursements (id, employee_id, employee_name, month, fuel_liters, rate_per_liter, amount, travel_purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, employee_id, employee_name, month, fuel_liters, rate_per_liter, amount, travel_purpose, status]
        );
      }
    }

    if (backupData.broadcasts && Array.isArray(backupData.broadcasts)) {
      for (const br of backupData.broadcasts) {
        const id = br.id || '';
        const title = br.title || '';
        const message = br.message || '';
        const created_by = br.created_by || '';
        const created_at = br.created_at || '';

        await runSql(
          `INSERT OR REPLACE INTO broadcasts (id, title, message, created_by, created_at) VALUES (?, ?, ?, ?, ?)`,
          [id, title, message, created_by, created_at]
        );
      }
    }

    if (backupData.attendance_corrections && Array.isArray(backupData.attendance_corrections)) {
      for (const ac of backupData.attendance_corrections) {
        await runSql(
          `INSERT OR REPLACE INTO attendance_corrections (id, employee_id, employee_name, company, date, original_status, requested_status, reason, applied_date, reporting_hod, reporting_hod_name, status, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [ac.id, ac.employee_id, ac.employee_name, ac.company, ac.date, ac.original_status, ac.requested_status, ac.reason, ac.applied_date, ac.reporting_hod || null, ac.reporting_hod_name || null, ac.status, ac.escalated_reminder_sent ? 1 : 0]
        );
      }
    }

    if (backupData.compoff_requests && Array.isArray(backupData.compoff_requests)) {
      for (const co of backupData.compoff_requests) {
        await runSql(
          `INSERT OR REPLACE INTO compoff_requests (id, employee_id, employee_name, company, date, reason, applied_date, status, reporting_hod, reporting_hod_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [co.id, co.employee_id, co.employee_name, co.company, co.date, co.reason, co.applied_date, co.status, co.reporting_hod || null, co.reporting_hod_name || null]
        );
      }
    }

    if (backupData.overtime_requests && Array.isArray(backupData.overtime_requests)) {
      for (const ov of backupData.overtime_requests) {
        await runSql(
          `INSERT OR REPLACE INTO overtime_requests (id, employee_id, employee_name, company, date, hours, reason, applied_date, status, reporting_hod, reporting_hod_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [ov.id, ov.employee_id, ov.employee_name, ov.company, ov.date, ov.hours, ov.reason, ov.applied_date, ov.status, ov.reporting_hod || null, ov.reporting_hod_name || null]
        );
      }
    }

    if (backupData.users && Array.isArray(backupData.users)) {
      for (const u of backupData.users) {
        const username = u.username || '';
        const password_hash = u.password_hash || '';
        const name = u.name || '';
        const role = u.role || '';
        const email = u.email || '';
        const phone = u.phone || '';
        const company = u.company || '';
        const status = u.status || 'ACTIVE';
        const company_rights = typeof u.company_rights === 'string' ? u.company_rights : JSON.stringify(u.company_rights || u.allowed_units || []);

        await runSql(
          `INSERT OR REPLACE INTO users (username, password_hash, name, role, email, phone, company, status, company_rights) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [username, password_hash, name, role, email, phone, company, status, company_rights]
        );
      }
    }

    if (backupData.hods && Array.isArray(backupData.hods)) {
      for (const h of backupData.hods) {
        const id = h.id || '';
        const name = h.name || '';
        const department = h.department || '';
        const email = h.email || '';
        const phone = h.phone || '';
        const active = h.active !== undefined ? (h.active ? 1 : 0) : (h.is_active ? 1 : 0);
        const company_rights = typeof h.company_rights === 'string' ? h.company_rights : JSON.stringify(h.company_rights || h.allowed_companies || []);

        await runSql(
          `INSERT OR REPLACE INTO hods (id, name, department, email, phone, active, company_rights) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, name, department, email, phone, active, company_rights]
        );
      }
    }

    if (backupData.audit_logs && Array.isArray(backupData.audit_logs)) {
      for (const al of backupData.audit_logs) {
        const id = al.id || 'AUDIT-' + Math.random().toString(36).substring(2, 11).toUpperCase();
        const action = al.action || '';
        const details = al.details || '';
        const user_name = al.user_name || al.operator || 'Admin';
        const timestamp = al.timestamp || new Date().toISOString();

        await runSql(
          `INSERT OR REPLACE INTO audit_logs (id, action, details, user_name, timestamp) VALUES (?, ?, ?, ?, ?)`,
          [id, action, details, user_name, timestamp]
        );
      }
    }

      await runSql('COMMIT');
    } catch (error: any) {
      try {
        await runSql('ROLLBACK');
      } catch (rollbackErr) {
        console.error('[restoreFullBackupJSON] Rollback failed:', rollbackErr);
      }
      throw error;
    }

    // 3. IMPORTANT: Force server to load all data from SQLite back into cache arrays!
    await this.loadAllFromSQLite();
    this.persistData();
  }

  public async purgeEmployees(): Promise<void> {
    const runSql = (query: string, params: any[] = []): Promise<void> => {
      return new Promise((resolve, reject) => {
        this.dbSqlite.run(query, params, (err: any) => err ? reject(err) : resolve());
      });
    };

    await runSql(`DELETE FROM employees`);
    await runSql(`DELETE FROM attendance`);
    await runSql(`DELETE FROM leave_applications`);
    await runSql(`DELETE FROM payroll_runs`);
    await runSql(`DELETE FROM payslips`);
    await runSql(`DELETE FROM loans`);
    await runSql(`DELETE FROM salary_revisions`);
    await runSql(`DELETE FROM assets`);
    await runSql(`DELETE FROM travel_reimbursements`);
    await runSql(`DELETE FROM attendance_corrections`);
    await runSql(`DELETE FROM compoff_requests`);
    await runSql(`DELETE FROM overtime_requests`);
    await runSql(`DELETE FROM ff_settlements`);
    await runSql(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('database_seeded', '1')`);

    // Reload all from SQLite to ensure memory arrays are cleared
    await this.loadAllFromSQLite();
  }

  // Comp-off Ledger Operations
  public getCompOffLedger(): any[] {
    if (!this.data.compoff_ledger) this.data.compoff_ledger = [];
    return this.data.compoff_ledger;
  }

  public addCompOffLedgerEntry(entry: any): any {
    if (!this.data.compoff_ledger) this.data.compoff_ledger = [];
    const id = entry.id || `COL${Date.now()}`;
    const earnedDays = Number(entry.earned_days || 0);
    const availedDays = Number(entry.availed_days || 0);
    const newEntry = {
      id,
      employee_id: entry.employee_id,
      employee_name: entry.employee_name,
      company: entry.company,
      date_earned: entry.date_earned,
      reason: entry.reason,
      earned_days: earnedDays,
      availed_days: availedDays,
      balance: Number(entry.balance ?? (earnedDays - availedDays)),
      expiry_date: entry.expiry_date
    };
    this.data.compoff_ledger.push(newEntry);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO compoff_ledger (id, employee_id, employee_name, company, date_earned, reason, earned_days, availed_days, balance, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newEntry.id, newEntry.employee_id, newEntry.employee_name, newEntry.company, newEntry.date_earned, newEntry.reason, newEntry.earned_days, newEntry.availed_days, newEntry.balance, newEntry.expiry_date]
    );

    // Auto-update employee's Comp Off leave balance
    if (entry.employee_id) {
      const emp = this.data.employees.find(e => e.id === entry.employee_id);
      if (emp) {
        const netChange = earnedDays - availedDays;
        emp.leave_balance_compoff = Number(emp.leave_balance_compoff || 0) + netChange;
        if (emp.leave_balance_compoff < 0) emp.leave_balance_compoff = 0;
        if (this.dbSqlite && typeof this.dbSqlite.run === 'function') {
          this.dbSqlite.run(`UPDATE employees SET leave_balance_compoff = ? WHERE id = ?`, [emp.leave_balance_compoff, emp.id]);
        }
        console.log(`[CompOff] ${emp.name}: +${earnedDays} earned, -${availedDays} availed → balance: ${emp.leave_balance_compoff}`);
      }
    }

    this.persistData();
    return newEntry;
  }

  // HR Policy & Employee Handbook Operations
  public getPolicies(): any[] {
    if (!this.data.policies) this.data.policies = [];
    return this.data.policies;
  }

  public addPolicy(policy: any): any {
    if (!this.data.policies) this.data.policies = [];
    const id = policy.id || `POL${Date.now()}`;
    const newPolicy = {
      id,
      name: policy.name,
      content: policy.content || '',
      pdf_url: policy.pdf_url || '',
      version: policy.version || '1.0',
      is_archived: policy.is_archived ? 1 : 0,
      created_at: policy.created_at || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0]
    };
    
    // If we're updating, replace in array
    const idx = this.data.policies.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.policies[idx] = newPolicy;
    } else {
      this.data.policies.push(newPolicy);
    }

    this.dbSqlite.run(
      `INSERT OR REPLACE INTO policies (id, name, content, pdf_url, version, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newPolicy.id, newPolicy.name, newPolicy.content, newPolicy.pdf_url, newPolicy.version, newPolicy.is_archived, newPolicy.created_at, newPolicy.updated_at]
    );
    return newPolicy;
  }

  // Policy Acknowledgements
  public getPolicyAcknowledgements(): any[] {
    if (!this.data.policy_acknowledgements) this.data.policy_acknowledgements = [];
    return this.data.policy_acknowledgements;
  }

  public addPolicyAcknowledgement(ack: any): any {
    if (!this.data.policy_acknowledgements) this.data.policy_acknowledgements = [];
    const id = ack.id || `ACK${Date.now()}`;
    const newAck = {
      id,
      employee_id: ack.employee_id,
      policy_name: ack.policy_name,
      read_date: ack.read_date || new Date().toISOString().split('T')[0],
      acknowledgement_date: ack.acknowledgement_date || new Date().toISOString().split('T')[0],
      version: ack.version || '1.0'
    };

    // Replace if employee already acknowledged this exact policy and version
    const idx = this.data.policy_acknowledgements.findIndex(a => a.employee_id === ack.employee_id && a.policy_name === ack.policy_name && a.version === ack.version);
    if (idx !== -1) {
      this.data.policy_acknowledgements[idx] = newAck;
    } else {
      this.data.policy_acknowledgements.push(newAck);
    }

    this.dbSqlite.run(
      `INSERT OR REPLACE INTO policy_acknowledgements (id, employee_id, policy_name, read_date, acknowledgement_date, version) VALUES (?, ?, ?, ?, ?, ?)`,
      [newAck.id, newAck.employee_id, newAck.policy_name, newAck.read_date, newAck.acknowledgement_date, newAck.version]
    );
    return newAck;
  }

  // Gate Passes Operations
  public getGatePasses(): any[] {
    if (!this.data.gate_passes) this.data.gate_passes = [];
    return this.data.gate_passes;
  }

  public addGatePass(pass: any): any {
    if (!this.data.gate_passes) this.data.gate_passes = [];
    const nextNum = Math.max(...(this.data.gate_passes || []).map(g => {
      const numericPart = g.id ? parseInt(g.id.replace('GP', '')) : 0;
      return isNaN(numericPart) ? 0 : numericPart;
    }), 0) + 1;
    const id = `GP${String(nextNum).padStart(3, '0')}`;
    const newPass = {
      id,
      employee_id: pass.employee_id,
      employee_name: pass.employee_name,
      company: pass.company,
      target_company: pass.target_company,
      purpose: pass.purpose,
      applied_date: pass.applied_date || new Date().toISOString(),
      status: pass.status || 'PENDING_HOD',
      reporting_hod: pass.reporting_hod || null,
      reporting_hod_name: pass.reporting_hod_name || null,
      departure_time: pass.departure_time || null,
      arrival_time: pass.arrival_time || null,
      return_departure_time: pass.return_departure_time || null,
      return_arrival_time: pass.return_arrival_time || null,
      out_gate_security_id: pass.out_gate_security_id || null,
      in_gate_security_id: pass.in_gate_security_id || null,
      return_out_gate_security_id: pass.return_out_gate_security_id || null,
      return_in_gate_security_id: pass.return_in_gate_security_id || null,
      destination_type: pass.destination_type || 'INTERNAL',
      vendor_location: pass.vendor_location || null
    };

    this.data.gate_passes.push(newPass);

    this.dbSqlite.run(
      `INSERT INTO gate_passes (id, employee_id, employee_name, company, target_company, purpose, applied_date, status, reporting_hod, reporting_hod_name, departure_time, arrival_time, return_departure_time, return_arrival_time, out_gate_security_id, in_gate_security_id, return_out_gate_security_id, return_in_gate_security_id, destination_type, vendor_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newPass.id, newPass.employee_id, newPass.employee_name, newPass.company, newPass.target_company, newPass.purpose, newPass.applied_date, newPass.status, newPass.reporting_hod, newPass.reporting_hod_name,
        newPass.departure_time, newPass.arrival_time, newPass.return_departure_time, newPass.return_arrival_time, newPass.out_gate_security_id, newPass.in_gate_security_id, newPass.return_out_gate_security_id, newPass.return_in_gate_security_id,
        newPass.destination_type, newPass.vendor_location
      ]
    );

    return newPass;
  }

  public updateGatePassStatus(id: string, status: string, details?: any): boolean {
    if (!this.data.gate_passes) this.data.gate_passes = [];
    const idx = this.data.gate_passes.findIndex(g => g.id === id);
    if (idx === -1) return false;

    const pass = this.data.gate_passes[idx];
    pass.status = status;
    if (details) {
      if (details.departure_time !== undefined) pass.departure_time = details.departure_time;
      if (details.arrival_time !== undefined) pass.arrival_time = details.arrival_time;
      if (details.return_departure_time !== undefined) pass.return_departure_time = details.return_departure_time;
      if (details.return_arrival_time !== undefined) pass.return_arrival_time = details.return_arrival_time;
      if (details.out_gate_security_id !== undefined) pass.out_gate_security_id = details.out_gate_security_id;
      if (details.in_gate_security_id !== undefined) pass.in_gate_security_id = details.in_gate_security_id;
      if (details.return_out_gate_security_id !== undefined) pass.return_out_gate_security_id = details.return_out_gate_security_id;
      if (details.return_in_gate_security_id !== undefined) pass.return_in_gate_security_id = details.return_in_gate_security_id;
    }

    this.dbSqlite.run(
      `UPDATE gate_passes SET status = ?, departure_time = ?, arrival_time = ?, return_departure_time = ?, return_arrival_time = ?, out_gate_security_id = ?, in_gate_security_id = ?, return_out_gate_security_id = ?, return_in_gate_security_id = ? WHERE id = ?`,
      [
        pass.status, pass.departure_time, pass.arrival_time, pass.return_departure_time, pass.return_arrival_time,
        pass.out_gate_security_id, pass.in_gate_security_id, pass.return_out_gate_security_id, pass.return_in_gate_security_id, id
      ]
    );
    return true;
  }
}
