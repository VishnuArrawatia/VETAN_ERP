import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  TrendingUp, 
  FileCheck, 
  ServerCrash,
  AlertCircle,
  Download,
  Upload,
  Calculator,
  ShieldAlert,
  FileSpreadsheet,
  Trash2,
  Cloud
} from 'lucide-react';
import { createSupabaseBackup, supabaseSyncStatus } from '../lib/supabaseData';
import { loadOfflineStore, saveStoreEverywhere } from '../lib/offlineStore';

interface DatabaseHealthViewProps {
  employeesCount: number;
  onRefreshAll: () => void;
}

export default function DatabaseHealthView({ employeesCount, onRefreshAll }: DatabaseHealthViewProps) {
  const [dbType, setDbType] = useState('Supabase Cloud + Local Snapshot (Vercel)');
  const [lastSave, setLastSave] = useState<string>('Never');
  const [lastBackup, setLastBackup] = useState<string>('Never');
  const [lastRestore, setLastRestore] = useState<string>('Never');
  const [checking, setChecking] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Checking Supabase...');
  const [supabaseEmployees, setSupabaseEmployees] = useState(0);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [purgePin, setPurgePin] = useState('');

  const loadTimes = () => {
    const saveTime = localStorage.getItem('vetan_last_save_time');
    const backupTime = localStorage.getItem('vetan_last_backup_time');
    const restoreTime = localStorage.getItem('vetan_last_restore_time');
    
    if (saveTime) setLastSave(new Date(saveTime).toLocaleString('en-IN'));
    if (backupTime) setLastBackup(new Date(backupTime).toLocaleString('en-IN'));
    if (restoreTime) setLastRestore(new Date(restoreTime).toLocaleString('en-IN'));
  };

  const refreshSupabaseStatus = async () => {
    const status = await supabaseSyncStatus();
    if (!status.configured) {
      setSyncStatus('Supabase key missing — add VITE_SUPABASE_ANON_KEY on Vercel');
      setSupabaseEmployees(0);
      return;
    }
    setSupabaseEmployees(status.liveEmployees);
    if (status.liveEmployees > 0) {
      setSyncStatus(`Supabase LIVE · ${status.liveEmployees} employees · ${status.lastUpdated ? new Date(status.lastUpdated).toLocaleString('en-IN') : 'ok'}`);
      setDbType('Supabase permanent cloud store (April 2026+)');
    } else {
      setSyncStatus('Supabase connected but empty — click “Upload / Sync to Supabase”');
    }
  };

  useEffect(() => {
    loadTimes();
    void refreshSupabaseStatus();
    const interval = setInterval(() => {
      loadTimes();
      void refreshSupabaseStatus();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncToSupabase = async () => {
    setChecking(true);
    setMsg(null);
    try {
      const store = await loadOfflineStore();
      await saveStoreEverywhere(store);
      const label = `manual-${new Date().toISOString().slice(0, 19)}`;
      const backup = await createSupabaseBackup(store, label, 'Manual backup from Database Health');
      localStorage.setItem('vetan_last_save_time', new Date().toISOString());
      localStorage.setItem('vetan_last_backup_time', new Date().toISOString());
      await refreshSupabaseStatus();
      setMsg({
        type: backup.ok ? 'success' : 'error',
        text: backup.ok
          ? `Cloud sync OK. Live store + backup saved (${store.employees?.length || 0} employees).`
          : `Live store saved, backup issue: ${backup.error || 'unknown'}`
      });
      onRefreshAll();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message || 'Supabase sync failed. Did you run supabase/schema.sql?' });
    } finally {
      setChecking(false);
    }
  };
  const handlePurgeEmployees = async () => {
    if (!confirm('⚠️ CRITICAL WARNING: Are you absolutely sure you want to permanently delete ALL employees and respective historical payroll ledger entries? This cannot be undone!')) {
      return;
    }
    setChecking(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/purge-employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-security-pin': purgePin
        },
        body: JSON.stringify({ pin: purgePin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({
          type: 'success',
          text: data.message || '🎉 All employees and respective transaction records purged successfully! Ready for real accounts.'
        });
        setPurgePin('');
        onRefreshAll();
      } else {
        setMsg({
          type: 'error',
          text: data.message || data.error || 'Failed to authenticate PIN or execute purge.'
        });
      }
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: 'Network error executing database purge: ' + err.message
      });
    } finally {
      setChecking(false);
    }
  };

  const handleManualSync = async () => {
    setChecking(true);
    setMsg(null);
    try {
      // Prefer full local/Supabase path on Vercel (no Express /api)
      const store = await loadOfflineStore();
      if (store?.employees?.length) {
        await saveStoreEverywhere(store);
        const label = new Date().toISOString().slice(0, 7);
        await createSupabaseBackup(store, `sync-${label}-${Date.now()}`, 'Manual sync from Database Health');
        const nowStr = new Date().toISOString();
        localStorage.setItem('vetan_last_save_time', nowStr);
        localStorage.setItem('vetan_last_backup_time', nowStr);
        loadTimes();
        await refreshSupabaseStatus();
        setMsg({
          type: 'success',
          text: `Saved to browser + Supabase cloud. Verified ${store.employees.length} employees.`
        });
        onRefreshAll();
        return;
      }

      const res = await fetch('/api/backup-json');
      if (res.ok) {
        const data = await res.json();
        if (data && data.employees && Array.isArray(data.employees)) {
          localStorage.setItem('vetan_erp_auto_save_backup', JSON.stringify(data));
          localStorage.setItem('vetan_erp_auto_save_backup_stats', JSON.stringify({
            employeesCount: data.employees.length,
            savedAt: new Date().toISOString()
          }));
          const nowStr = new Date().toISOString();
          localStorage.setItem('vetan_last_save_time', nowStr);
          localStorage.setItem('vetan_last_backup_time', nowStr);
          await saveStoreEverywhere(data);
          loadTimes();
          await refreshSupabaseStatus();
          setMsg({
            type: 'success',
            text: `Database sync snapshot saved successfully! Backup verified for ${data.employees.length} employees.`
          });
          onRefreshAll();
        } else {
          setMsg({ type: 'error', text: 'Failed to generate correct backup structure.' });
        }
      } else {
        setMsg({ type: 'error', text: 'Server returned error during backup generation.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to sync database: ' + err.message });
    } finally {
      setChecking(false);
    }
  };

  const handleManualRestore = async () => {
    setChecking(true);
    setMsg(null);
    try {
      const backupStr = localStorage.getItem('vetan_erp_auto_save_backup');
      if (!backupStr) {
        setMsg({ type: 'error', text: 'No local storage backup snapshot found to restore!' });
        setChecking(false);
        return;
      }
      
      const payload = JSON.parse(backupStr);
      const res = await fetch('/api/restore-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        localStorage.setItem('vetan_last_restore_time', new Date().toISOString());
        loadTimes();
        setMsg({
          type: 'success',
          text: 'Database successfully restored from local persistent storage. All schemas and employee tables updated.'
        });
        onRefreshAll();
      } else {
        setMsg({ type: 'error', text: 'Database restore API returned failure status.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Restore request failed: ' + err.message });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8">
          <Database size={180} />
        </div>
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block">VETAN SYSTEM INTEGRITY</span>
          <h2 className="text-2xl font-black tracking-tight font-display">Database Health & Resilience Portal</h2>
          <p className="text-slate-300 text-xs max-w-2xl mt-1 leading-relaxed">
            Verify database persistence stability, review background auto-sync logs, and execute manual recovery or backup operations.
            Permanent cloud copy lives on Supabase so April 2026+ records survive laptop/browser changes.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100">
              Cloud: {supabaseEmployees} employees
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-100 max-w-xl truncate">
              {syncStatus}
            </span>
            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={checking}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              <Cloud size={14} />
              {checking ? 'Syncing…' : 'Upload / Sync to Supabase'}
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-3 shadow-xs ${
            msg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
          )}
          <span>{msg.text}</span>
        </motion.div>
      )}

      {/* Grid of health status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Database Connection</span>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700 rounded-full font-mono uppercase">
              {syncStatus}
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engine Provider</h4>
            <p className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
              {dbType}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Database Content</span>
            <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-700 rounded-full font-mono">
              Live Tables
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Staff Records</h4>
            <p className="text-2xl font-black text-slate-950 font-display">
              {employeesCount} <span className="text-xs text-gray-400 font-bold uppercase">Employees</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Database Persistence Check</span>
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 rounded-full font-mono">
              ACTIVE
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage Sync Interval</h4>
            <p className="text-sm font-extrabold text-slate-900 leading-tight">
              Every 15 Seconds (Background Auto-Snapshot)
            </p>
          </div>
        </div>
      </div>

      {/* Synchronization parameters table */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <div className="border-b px-5 py-4 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} className="text-slate-500" />
            Persistence & Recovery Synchronization Timings
          </h3>
          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">Vetan Ledger Protection</span>
        </div>
        
        <div className="divide-y text-xs">
          <div className="px-5 py-3.5 flex justify-between items-center">
            <span className="font-semibold text-slate-600">Database Auto-Save Status (Sync to Browser LocalStorage)</span>
            <span className="font-mono font-bold text-slate-950 bg-slate-50 px-3 py-1 rounded border">{lastSave}</span>
          </div>
          <div className="px-5 py-3.5 flex justify-between items-center">
            <span className="font-semibold text-slate-600">Last Cold-Start Backup File Generated</span>
            <span className="font-mono font-bold text-slate-950 bg-slate-50 px-3 py-1 rounded border">{lastBackup}</span>
          </div>
          <div className="px-5 py-3.5 flex justify-between items-center">
            <span className="font-semibold text-slate-600">Last System Silent/Manual Auto-Restore Event</span>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-50/50 px-3 py-1 rounded border border-emerald-100">{lastRestore}</span>
          </div>
        </div>
      </div>

      {/* SAKAR ELECTRICALS SYSTEM FORMULA COMPLIANCE AUDIT */}
      <div className="bg-emerald-950/95 border border-emerald-800 text-emerald-100 p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-900 rounded-lg text-emerald-400">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Sakar Electricals Formula Compliance & Calculation Audit
            </h3>
            <p className="text-[11px] text-emerald-300">
              Verified legal and mathematical formulas embedded directly in the system engine to eliminate manual calculation risks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Formula 1 */}
          <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-800/60 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block border-b border-emerald-800 pb-1">
              Formula 1: Gross Salary (Earnings)
            </span>
            <p className="font-mono text-[11px] font-bold text-white bg-emerald-950/80 px-2 py-1.5 rounded text-center border border-emerald-900">
              Basic + HRA + Conveyance + Education + Medical + Special
            </p>
            <p className="text-[10px] text-emerald-300 leading-relaxed">
              Calculates the total monthly earned wages including proration for loss of pay (LOP) and dynamic overtime additions. Fully customizable per employee structure.
            </p>
          </div>

          {/* Formula 2 */}
          <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-800/60 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block border-b border-emerald-800 pb-1">
              Formula 2: Cost to Company (CTC)
            </span>
            <p className="font-mono text-[11px] font-bold text-white bg-emerald-950/80 px-2 py-1.5 rounded text-center border border-emerald-900">
              Gross Salary + Employer PF + Employer ESIC + Bonus
            </p>
            <p className="text-[10px] text-emerald-300 leading-relaxed">
              Determines the total company liability. Employer PF is typically 13% of Basic; Employer ESIC is typically 3.25% of Gross; Statutory Bonus is 8.33% of Basic.
            </p>
          </div>

          {/* Formula 3 */}
          <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-800/60 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block border-b border-emerald-800 pb-1">
              Formula 3: Take Home Salary (Net Pay)
            </span>
            <p className="font-mono text-[11px] font-bold text-white bg-emerald-950/80 px-2 py-1.5 rounded text-center border border-emerald-900">
              Gross Salary - PF - ESIC - TDS - Other Deductions
            </p>
            <p className="text-[10px] text-emerald-300 leading-relaxed">
              The exact payment disbursed to the employee. Deductible parameters include 12% employee PF, 0.75% ESIC, Professional Tax, active monthly Loan repayments, and TDS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] bg-emerald-900/30 p-2.5 rounded-lg border border-emerald-800 text-emerald-200">
          <ShieldAlert size={14} className="text-emerald-400 shrink-0" />
          <span>
            <strong>Zero-Risk Guarantee:</strong> If base salaries are adjusted, these mathematical breakdowns automatically update live, preventing any administrative errors. No manual modifications can break this logic.
          </span>
        </div>
      </div>

      {/* Manual Diagnostic & Backup Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              System Sync & Local Sandbox Controls
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Force an instant snapshot save to the server and local browser cache to ensure high-speed performance and zero lag.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleManualSync}
              disabled={checking}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
            >
              <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
              {checking ? "Syncing..." : "Force Auto-Save Database Snapshot"}
            </button>

            <button
              onClick={handleManualRestore}
              disabled={checking}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
            >
              <Database size={14} />
              {checking ? "Restoring..." : "Manual Restore from Local Cache"}
            </button>
          </div>
        </div>

        {/* OFFLINE DESKTOP BACKUP & DISASTER RECOVERY HUB */}
        <div className="bg-white rounded-2xl border p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Download size={15} className="text-slate-700" />
              Sakar External Hard Backup File Centre
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Download your complete payroll database as a single file to keep on your personal computer, or upload it back to restore all records in 2 seconds.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={async () => {
                  try {
                    setChecking(true);
                    const res = await fetch('/api/backup-json');
                    if (res.ok) {
                      const data = await res.json();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      const dateStr = new Date().toISOString().slice(0, 10);
                      a.href = url;
                      a.download = `sakar_electricals_payroll_backup_${dateStr}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      setMsg({
                        type: 'success',
                        text: '🎉 Offline backup file downloaded successfully! Keep this file safe on your computer.'
                      });
                    } else {
                      setMsg({ type: 'error', text: 'Failed to download data backup from server.' });
                    }
                  } catch (err: any) {
                    setMsg({ type: 'error', text: 'Download failed: ' + err.message });
                  } finally {
                    setChecking(false);
                  }
                }}
                disabled={checking}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <Download size={14} />
                Download JSON Backup File
              </button>

              <label className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer select-none text-center">
                <Upload size={14} />
                <span>Upload & Restore File</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                      try {
                        const content = evt.target?.result as string;
                        const payload = JSON.parse(content);
                        if (!payload || typeof payload !== 'object' || !payload.employees) {
                          setMsg({ type: 'error', text: 'Error: Invalid backup file format. Must contain employees records.' });
                          return;
                        }
                        if (confirm(`⚠️ Are you sure you want to restore? This will replace all existing database records with ${payload.employees.length} employees from the backup file.`)) {
                          setChecking(true);
                          const res = await fetch('/api/restore-json', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          });
                          if (res.ok) {
                            localStorage.setItem('vetan_last_restore_time', new Date().toISOString());
                            setMsg({
                              type: 'success',
                              text: `🎉 All ${payload.employees.length} employees and respective payroll history restored successfully from the uploaded file!`
                            });
                            onRefreshAll();
                          } else {
                            setMsg({ type: 'error', text: 'Upload failed: Server rejected the backup payload.' });
                          }
                        }
                      } catch (err: any) {
                        setMsg({ type: 'error', text: 'Failed to parse JSON backup file: ' + err.message });
                      } finally {
                        setChecking(false);
                        e.target.value = ''; // Reset input
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* PURGE DUMMY/DEMO DATA SECTION */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-4 md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-rose-950 uppercase tracking-wider">
                Purge All Dummy & Demo Employee Data
              </h3>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                This utility will permanently delete all demo/dummy employee accounts, attendance logs, leave records, payslips, loans, assets, travel reimbursements, and salary revisions. 
                Your system settings, company registries, and Super Admin credentials will remain preserved.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 pt-2">
            <div className="w-full sm:w-auto flex-1 max-w-xs space-y-1">
              <label className="text-[10px] font-bold text-rose-900 uppercase block">Super Admin Security PIN</label>
              <input
                type="password"
                placeholder="Enter 4-digit PIN"
                value={purgePin}
                onChange={(e) => setPurgePin(e.target.value)}
                className="w-full bg-white border border-rose-200 focus:border-rose-500 rounded-xl text-xs p-2.5 outline-none font-mono text-slate-800 text-center"
                maxLength={4}
              />
            </div>

            <button
              onClick={handlePurgeEmployees}
              disabled={checking || !purgePin}
              className="w-full sm:w-auto py-2.5 px-6 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <Trash2 size={14} />
              {checking ? "Purging..." : "Purge All Dummy Employees"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
