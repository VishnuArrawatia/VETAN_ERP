/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  UserCheck,
  Info
} from 'lucide-react';
import { Employee } from '../types';
import { CompanyLogo } from './CompanyLogos';

interface LoginPortalProps {
  onLoginSuccess: (employee: Employee) => void;
  onHRAdminSuccess: (hrUser: any, forcePinChange?: boolean) => void;
}



const SIMULATED_HR_USERS = [
  {
    id: 'USR001',
    username: 'vishnu',
    name: 'Vishnu Arrawatia',
    title: 'Company Management',
    role: 'SUPER_HR',
    company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'],
    password: 'Varrawatia'
  },
  {
    id: 'USR002',
    username: 'vijay',
    name: 'Mr. V. K. Saraf (MD)',
    title: 'Managing Director',
    role: 'MANAGEMENT',
    company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'],
    password: 'VKS'
  },
  {
    id: 'USR003',
    username: 'vijendra',
    name: 'Vijendra',
    title: 'HR Officer (SVN Unit I)',
    role: 'COMPANY_HR',
    company_rights: ['SVN-1'],
    password: 'vijendra'
  },
  {
    id: 'USR004',
    username: 'manisha_s',
    name: 'Manisha Sapate',
    title: 'HR Officer (SVN Unit II)',
    role: 'COMPANY_HR',
    company_rights: ['SVN-II'],
    password: 'manisha_s'
  },
  {
    id: 'USR005',
    username: 'manisha',
    name: 'Manisha',
    title: 'HR Officer (Sakar Unit I)',
    role: 'COMPANY_HR',
    company_rights: ['Sakar-I'],
    password: 'manisha'
  },
  {
    id: 'USR006',
    username: 'indraprakash',
    name: 'Indraprakash',
    title: 'HR Officer (Sakar Unit III)',
    role: 'COMPANY_HR',
    company_rights: ['Sakar-III'],
    password: 'indraprakash'
  },
  {
    id: 'USR007',
    username: 'nilesh',
    name: 'Nilesh',
    title: 'HR Officer (Flare)',
    role: 'COMPANY_HR',
    company_rights: ['Flare-1'],
    password: 'nilesh'
  },
  {
    id: 'USR008',
    username: 'pinki',
    name: 'Pinki',
    title: 'HR Officer (Zenivo)',
    role: 'COMPANY_HR',
    company_rights: ['Zenivo-1'],
    password: 'pinki'
  }
];

/** Vercel hosts only the frontend — /api/* Express routes are missing there. */
async function readApiJson(res: Response): Promise<{ ok: true; data: any } | { ok: false; missingApi: boolean; message: string }> {
  const text = await res.text();
  if (!text || !text.trim()) {
    return {
      ok: false,
      missingApi: true,
      message: 'Server API not available on this host (Vercel frontend-only). Using offline login.'
    };
  }
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    // Often HTML index.html from SPA rewrite instead of JSON API
    return {
      ok: false,
      missingApi: true,
      message: 'Server API not available on this host (Vercel frontend-only). Using offline login.'
    };
  }
}

function offlineAdminLogin(username: string, password: string) {
  const user = SIMULATED_HR_USERS.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    return { success: false as const, error: 'User Not Found' };
  }
  if (user.password !== password) {
    return { success: false as const, error: 'Password Incorrect' };
  }
  const { password: _pw, ...safeUser } = user;
  return { success: true as const, user: safeUser, forcePinChange: false };
}

export default function LoginPortal({ onLoginSuccess, onHRAdminSuccess }: LoginPortalProps) {
  const [activeTab, setActiveTab] = useState<'employee' | 'admin'>('employee');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Admin select state
  const [selectedAdminIndex, setSelectedAdminIndex] = useState(0);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Compulsory password change state
  const [compulsoryEmployee, setCompulsoryEmployee] = useState<Employee | null>(null);
  const [typedAdminPassword, setTypedAdminPassword] = useState('');
  const [compulsoryHR, setCompulsoryHR] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot password state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotIsEmployee, setForgotIsEmployee] = useState(true);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  useEffect(() => {
    fetch('/api/hr/users')
      .then(async res => {
        const parsed = await readApiJson(res);
        if (parsed.ok && Array.isArray(parsed.data) && parsed.data.length > 0) {
          setAdminUsers(parsed.data);
        } else {
          setAdminUsers(SIMULATED_HR_USERS.map(({ password: _p, ...u }) => u));
        }
      })
      .catch(() => {
        setAdminUsers(SIMULATED_HR_USERS.map(({ password: _p, ...u }) => u));
      });
  }, []);

  const handleEmployeeLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/employee/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password })
      });
      const parsed = await readApiJson(res);
      if (!parsed.ok) {
        setErrorMsg(
          'missingApi' in parsed && parsed.missingApi
            ? 'Authentication service unavailable. Please try again later or contact your HR administrator.'
            : ('message' in parsed ? parsed.message : 'Login failed')
        );
        return;
      }
      const data = parsed.data;
      if (data.success) {
        if (data.needsPasswordChange) {
          setCompulsoryEmployee(data.employee);
        } else {
          onLoginSuccess(data.employee);
        }
      } else {
        setErrorMsg(data.error || 'Authentication failure. Check Employee ID and password.');
      }
    } catch (err: any) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompulsoryChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compulsoryEmployee) return;
    if (newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New Password and Confirm Password do not match.');
      return;
    }
    if (newPassword.toLowerCase() === compulsoryEmployee.id.toLowerCase()) {
      setErrorMsg('Your new password cannot be your Employee Code for security compliance.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/employee/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeId: compulsoryEmployee.id, 
          oldPassword: password || compulsoryEmployee.id,
          newPassword: newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.employee);
      } else {
        setErrorMsg(data.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg('Password update error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompulsoryHRChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compulsoryHR) return;
    if (newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New Password and Confirm Password do not match.');
      return;
    }
    if (newPassword.toLowerCase() === compulsoryHR.username.toLowerCase()) {
      setErrorMsg('Your new password cannot be your Username/User ID for security compliance.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/hr/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: compulsoryHR.username, 
          oldPassword: typedAdminPassword || compulsoryHR.username,
          newPassword: newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        onHRAdminSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'Failed to update administrator password.');
      }
    } catch (err: any) {
      setErrorMsg('Password update error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername) {
      setErrorMsg('Please enter your Employee ID or Username.');
      return;
    }
    setLoading(true);
    setForgotSuccess('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername,
          role: forgotIsEmployee ? 'Employee' : 'Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setForgotSuccess(data.message || 'Forgot password request logged. Please contact your Super Admin to approve.');
      } else {
        setErrorMsg(data.error || 'Failed to submit reset request.');
      }
    } catch (err: any) {
      setErrorMsg('Request error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/hr/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const parsed = await readApiJson(res);

      if (!parsed.ok) {
        const offline = offlineAdminLogin(adminUsername, adminPassword);
        if (offline.success) {
          onHRAdminSuccess(offline.user, offline.forcePinChange);
          return;
        }
        setErrorMsg(offline.error || ('message' in parsed ? parsed.message : 'Login failed'));
        return;
      }

      const data = parsed.data;
      if (data.success) {
        if (data.needsPasswordChange) {
          setCompulsoryHR(data.user);
          setTypedAdminPassword(adminPassword);
        } else {
          onHRAdminSuccess(data.user, data.forcePinChange);
        }
      } else {
        setErrorMsg(data.error || 'Authentication failure. Check Username and password.');
      }
    } catch (err: any) {
      // Network failure — still try offline credentials (Vercel has no /api)
      const offline = offlineAdminLogin(adminUsername, adminPassword);
      if (offline.success) {
        onHRAdminSuccess(offline.user, offline.forcePinChange);
      } else {
        setErrorMsg(offline.error || ('Authentication error: ' + err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const autofillEmployee = (id: string) => {
    setEmployeeId(id);
    setPassword('123456');
    setErrorMsg('');
  };

  if (compulsoryEmployee) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-sky-150/65 via-sky-50/90 to-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
        <div className="absolute top-10 left-10 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden z-10 p-6 md:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 animate-pulse">
              <KeyRound size={22} />
            </div>
            <h3 className="text-lg font-black text-white font-display">Compulsory Password Change</h3>
            <p className="text-xs text-slate-300">
              Hi <span className="text-pink-400 font-bold">{compulsoryEmployee.name}</span>, this is your first-time login. For security compliance, please choose a secure personal password.
            </p>
          </div>

          <form onSubmit={handleCompulsoryChangeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">Employee ID</label>
              <input
                type="text"
                disabled
                value={compulsoryEmployee.id}
                className="w-full text-xs p-3 border border-slate-800 bg-slate-900/50 rounded-xl text-slate-400 font-semibold font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter secure new password"
                  className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your secure new password"
                className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-xs text-rose-300 leading-normal">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCompulsoryEmployee(null);
                  setNewPassword('');
                  setConfirmPassword('');
                  setErrorMsg('');
                }}
                className="flex-1 py-3 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer select-none"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:brightness-110 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none shadow-md"
              >
                {loading ? 'Updating...' : 'Update & Sign In'}
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (compulsoryHR) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-sky-150/65 via-sky-50/90 to-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
        <div className="absolute top-10 left-10 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden z-10 p-6 md:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
              <KeyRound size={22} />
            </div>
            <h3 className="text-lg font-black text-white font-display">Administrator Password Change</h3>
            <p className="text-xs text-slate-300">
              Hi <span className="text-amber-400 font-bold">{compulsoryHR.name}</span>, this is your first-time login. For security compliance, please choose a secure personal password before continuing.
            </p>
          </div>

          <form onSubmit={handleCompulsoryHRChangeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Username / ID</label>
              <input
                type="text"
                disabled
                value={compulsoryHR.username}
                className="w-full text-xs p-3 border border-slate-800 bg-slate-900/50 rounded-xl text-slate-400 font-semibold font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter secure new password"
                  className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your secure new password"
                className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-xs text-rose-300 leading-normal">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCompulsoryHR(null);
                  setNewPassword('');
                  setConfirmPassword('');
                  setErrorMsg('');
                }}
                className="flex-1 py-3 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer select-none"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-pink-500 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none shadow-md"
              >
                {loading ? 'Updating...' : 'Update & Sign In'}
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-sky-150/65 via-sky-50/90 to-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Decorative ambient blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>



      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden z-10">
        {/* Left column: Visual Branding Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-950 p-8 md:p-12 flex flex-col justify-between text-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-500/10 via-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
                <CompanyLogo company="combined" className="h-8" showText={false} />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight flex flex-wrap items-center gap-1 font-display text-amber-400">
                  VETAN ERP
                  <span className="text-[9px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-1 py-0.5 rounded font-bold uppercase shrink-0">ERP</span>
                </h1>
                <p className="text-[10px] text-amber-100/90 font-medium">Sakar Electricals & Electronics Pvt. Ltd.</p>
                <p className="text-[9px] text-pink-200/90 font-medium leading-none mt-0.5">SVN Opto Electronics Pvt. Ltd.</p>
                <p className="text-[9px] text-amber-400 font-extrabold tracking-wide uppercase mt-1">Powered by Vishnu Intelligence Services</p>
              </div>
            </div>

            <div className="pt-8 space-y-5">
              <h2 className="text-xl md:text-2xl font-extrabold leading-tight font-display">
                Welcome to <span className="text-amber-400">Sakar</span> & <span className="text-pink-400">SVN</span> <span className="text-white">Staff Workspace</span>
              </h2>
              <p className="text-xs text-slate-200 leading-relaxed">
                Unlock direct self-service access to your statutory wage calculations, download secure monthly payslips, track leave balances, and review Form-16 statements.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-amber-400/20 text-amber-400 rounded mt-0.5">
                <Sparkles size={12} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-400">Instant Payslips (Gold)</h4>
                <p className="text-[10px] text-slate-300">Generate and print professional salary slips anytime.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 bg-pink-500/20 text-pink-400 rounded mt-0.5">
                <UserCheck size={12} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-pink-400">Self-Service Portal (Pink)</h4>
                <p className="text-[10px] text-slate-300">Submit leaves online and monitor real-time approval status.</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 select-none mt-8 space-y-1">
            <div className="text-slate-300">© 2026 Sakar Electricals & Electronics Pvt. Ltd. &amp; SVN Opto Electronics Pvt. Ltd.</div>
            <div className="text-amber-400 font-black tracking-wide uppercase text-[8px] pt-1">Powered by Vishnu Intelligence Services</div>
          </div>
        </div>

        {/* Right column: Login Interactive Card */}
        <div className="lg:col-span-7 p-6 md:p-10 bg-slate-950 flex flex-col justify-center">
          
          {/* Dual Portal Switch tabs */}
          <div className="flex bg-slate-900 p-1.5 rounded-2xl mb-8 border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('employee');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'employee' 
                  ? 'bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/40 shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck size={14} className={activeTab === 'employee' ? 'text-pink-400' : 'text-slate-400'} />
              Employee ESS Portal <span className="text-[9px] text-pink-500/80 font-mono">(Pink)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'admin' 
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40 shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={14} className={activeTab === 'admin' ? 'text-amber-400' : 'text-slate-400'} />
              Admin / HR Desk <span className="text-[9px] text-amber-500/80 font-mono">(Gold)</span>
            </button>
          </div>

          {activeTab === 'employee' ? (
            /* Employee Login View */
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-white font-display">Sign In as <span className="text-pink-400">Employee</span></h3>
                <p className="text-xs text-pink-100/70 mt-1">Enter your assigned Employee ID and Personal Password.</p>
              </div>

              <form onSubmit={handleEmployeeLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    placeholder="e.g. EMP001"
                    className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl text-white font-semibold font-mono placeholder:text-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotIsEmployee(true);
                        setForgotUsername(employeeId);
                        setForgotSuccess('');
                        setErrorMsg('');
                        setIsForgotOpen(true);
                      }}
                      className="text-[10px] text-amber-400 font-bold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter personal password"
                      className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-xs text-rose-300 leading-normal">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:brightness-110 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none shadow-md"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Employee Portal (ESS)'}
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          ) : (
            /* Admin / HR Login View */
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-white font-display">Sign In as <span className="text-amber-400">Admin / HR</span></h3>
                <p className="text-xs text-amber-100/70 mt-1">Enter your administrator credentials to access the management panel.</p>
              </div>

              <form onSubmit={handleAdminLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Username / Admin ID</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().trim();
                      setAdminUsername(val);
                    }}
                    placeholder="Enter Username or Admin ID (e.g. vishnu)"
                    className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl text-white font-semibold placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">Administrator Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotIsEmployee(false);
                        setForgotUsername(adminUsername);
                        setForgotSuccess('');
                        setErrorMsg('');
                        setIsForgotOpen(true);
                      }}
                      className="text-[10px] text-amber-400 font-bold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter administrator password..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
                    >
                      {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-xs text-rose-300 leading-normal">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-pink-500 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer select-none shadow-md"
                >
                  {loading ? 'Authenticating...' : 'Sign In as Admin'}
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Forgot Password Modal Overlay */}
      {isForgotOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <KeyRound size={22} />
              </div>
              <h3 className="text-lg font-black text-white font-display">Forgot Password Request</h3>
              <p className="text-xs text-slate-400">
                Submit a password reset request. Only the Super Admin can approve resets.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Type</label>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setForgotIsEmployee(true)}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition ${forgotIsEmployee ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'text-slate-400'}`}
                  >
                    Employee (ESS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotIsEmployee(false)}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition ${!forgotIsEmployee ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400'}`}
                  >
                    Admin / HR Desk
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  {forgotIsEmployee ? 'Employee ID' : 'Username / Admin ID'}
                </label>
                <input
                  type="text"
                  required
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  placeholder={forgotIsEmployee ? 'e.g. EMP001' : 'e.g. vishnu'}
                  className="w-full text-xs p-3 border border-slate-800 bg-slate-950 rounded-xl text-white font-semibold font-mono focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {errorMsg && !forgotSuccess && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-xs text-rose-300 leading-normal">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 leading-normal">
                  {forgotSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(false);
                    setForgotSuccess('');
                    setErrorMsg('');
                  }}
                  className="flex-1 py-3 px-4 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer select-none"
                >
                  Close
                </button>
                {!forgotSuccess && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-pink-500 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none shadow-md"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
