import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Download, 
  Upload, 
  History, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  UserCheck,
  Sparkles,
  Megaphone
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  user_name: string;
  timestamp: string;
}

interface AuditBackupsViewProps {
  activeMonth: string;
  activeCompany: string;
  activeHR: {
    id: string;
    name: string;
    role: string;
    avatar: string;
  };
}

export default function AuditBackupsView({ activeMonth, activeCompany, activeHR }: AuditBackupsViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [productionSecurityEnabled, setProductionSecurityEnabled] = useState(false);
  const [savingSecurityMode, setSavingSecurityMode] = useState(false);

  // Festival scrolling announcement banner states
  const [festivalMessage, setFestivalMessage] = useState('');
  const [festivalActive, setFestivalActive] = useState(false);
  const [festivalDuration, setFestivalDuration] = useState(15);
  const [savingFestivalSettings, setSavingFestivalSettings] = useState(false);

  // Custom secure action states (PIN modal)
  const [securePinModal, setSecurePinModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onSubmit: (pin: string) => Promise<void>;
  } | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');

  const fetchSecurityMode = async () => {
    try {
      const res = await fetch('/api/settings/security-mode');
      if (res.ok) {
        const data = await res.json();
        setProductionSecurityEnabled(data.productionSecurityEnabled);
      }
    } catch (err) {
      console.error('Error fetching security mode:', err);
    }
  };

  const fetchFestivalSettings = async () => {
    try {
      const res = await fetch('/api/festival-message');
      if (res.ok) {
        const data = await res.json();
        setFestivalMessage(data.message || '');
        setFestivalActive(!!data.isActive);
        setFestivalDuration(Math.max(15, data.displayDuration || 15));
      }
    } catch (err) {
      console.error('Error fetching festival message settings:', err);
    }
  };

  const handleSaveFestivalSettings = async () => {
    setSavingFestivalSettings(true);
    setActionStatus(null);
    try {
      const res = await fetch('/api/festival-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: festivalMessage,
          isActive: festivalActive,
          displayDuration: Math.max(15, Number(festivalDuration || 15))
        })
      });
      if (res.ok) {
        setActionStatus({
          type: 'success',
          message: '🎉 Festival message & screensaver settings saved successfully! All systems will sync this message.'
        });
        // Dispatch event to update local UI immediately if active
        window.dispatchEvent(new Event('festival-settings-updated'));
        fetchLogsAndLockStatus();
      } else {
        const data = await res.json();
        setActionStatus({
          type: 'error',
          message: data.error || 'Failed to update festival settings.'
        });
      }
    } catch (err: any) {
      setActionStatus({
        type: 'error',
        message: 'Error saving festival settings: ' + err.message
      });
    } finally {
      setSavingFestivalSettings(false);
    }
  };

  const handleToggleSecurityMode = async (enabled: boolean) => {
    if (activeHR.role !== 'SUPER_HR') {
      setActionStatus({
        type: 'error',
        message: 'Access Denied: Only Super Admin (SUPER_HR) can modify production security settings.'
      });
      return;
    }

    setSavingSecurityMode(true);
    try {
      const res = await fetch('/api/settings/security-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (res.ok) {
        const data = await res.json();
        setProductionSecurityEnabled(data.productionSecurityEnabled);
        setActionStatus({
          type: 'success',
          message: `Production security mode has been successfully ${enabled ? 'ENABLED (Passwords & PINs required)' : 'DISABLED (Testing Mode Active)'}.`
        });
        fetchLogsAndLockStatus();
      } else {
        setActionStatus({
          type: 'error',
          message: 'Failed to update production security settings.'
        });
      }
    } catch (err: any) {
      setActionStatus({
        type: 'error',
        message: 'Error saving security settings: ' + err.message
      });
    } finally {
      setSavingSecurityMode(false);
    }
  };

  const fetchLogsAndLockStatus = async () => {
    setLoadingLogs(true);
    try {
      // Fetch Audit logs
      const logsRes = await fetch('/api/audit-logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }

      // Check current activeMonth status (We can also call GET /api/payroll-runs)
      const runsRes = await fetch('/api/dashboard/summary?company=' + activeCompany);
      if (runsRes.ok) {
        // Runs would contain active runs. Let's check from list of payroll runs
        const runsData = await fetch('/api/payroll-runs?company=' + activeCompany);
        if (runsData.ok) {
          const runs = await runsData.json();
          const currentRun = runs.find((r: any) => r.month === activeMonth);
          setIsLocked(currentRun ? currentRun.status === 'CLOSED' : false);
        }
      }
    } catch (err) {
      console.error('Error fetching system parameters:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogsAndLockStatus();
    fetchSecurityMode();
    fetchFestivalSettings();
  }, [activeMonth, activeCompany]);

  // Handle Payroll Month Unlock (Only Super HR can execute)
  const handleUnlockPayroll = () => {
    if (activeHR.role !== 'SUPER_HR') {
      setActionStatus({
        type: 'error',
        message: 'Access Denied: Only Super Admin (SUPER_HR) can unlock the payroll system.'
      });
      return;
    }

    setPinValue('');
    setPinError('');
    setSecurePinModal({
      isOpen: true,
      title: 'Unlock Closed Payroll Ledger',
      description: `You are requesting to unlock the closed payroll month ledger ${activeMonth} for ${activeCompany}. This allows direct modifications to wages, overtime, and deductions.`,
      onSubmit: async (pin) => {
        const res = await fetch('/api/payroll-runs/unlock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-operator-name': activeHR.name,
            'x-operator-role': activeHR.role
          },
          body: JSON.stringify({
            month: activeMonth,
            company: activeCompany,
            pin
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setActionStatus({
            type: 'success',
            message: `Success! Payroll month ${activeMonth} has been unlocked. Modifications are now permitted.`
          });
          setIsLocked(false);
          fetchLogsAndLockStatus();
          setSecurePinModal(null);
        } else {
          setPinError(data.message || data.error || 'Failed to unlock payroll month.');
        }
      }
    });
  };

  // Trigger download of Payroll.db
  const handleBackupDownload = () => {
    window.location.href = '/api/backup';
    setActionStatus({
      type: 'success',
      message: 'System database download initiated successfully. Store "Payroll.db" in a secure directory.'
    });
  };

  // Handle restore file upload
  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPinValue('');
    setPinError('');
    setSecurePinModal({
      isOpen: true,
      title: 'Full System Database Restore',
      description: `WARNING: This is an extremely critical, irreversible operation. Restoring the database will completely overwrite all current employees, attendance sheets, loan ledgers, and payslip runs for all companies with the uploaded backup file.`,
      onSubmit: async (pin) => {
        setRestoring(true);
        setActionStatus(null);

        try {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const result = event.target?.result as string;
            if (!result) {
              setActionStatus({ type: 'error', message: 'Failed to read backup file.' });
              setRestoring(false);
              return;
            }

            const base64Content = result.split(',')[1];

            const res = await fetch('/api/restore', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-operator-name': activeHR.name
              },
              body: JSON.stringify({
                databaseBase64: base64Content,
                pin
              })
            });

            const data = await res.json();
            if (res.ok && data.success) {
              setActionStatus({
                type: 'success',
                message: 'Database has been fully restored. All registers updated. Reloading state.'
              });
              setSecurePinModal(null);
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              setPinError(data.message || data.error || 'Restore failed. Ensure the PIN is correct.');
              setRestoring(false);
            }
          };
          reader.readAsDataURL(file);
        } catch (err: any) {
          setPinError(err.message || 'Error processing database restore file.');
          setRestoring(false);
        }
      }
    });

    e.target.value = '';
  };

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      log.user_name.toLowerCase().includes(query) ||
      log.timestamp.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-15 translate-x-10 translate-y-10">
          <ShieldCheck size={200} />
        </div>
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">VETAN COMPLIANCE SYSTEMS</span>
          <h2 className="text-2xl font-black tracking-tight font-display">System Integrity, Payroll Locks & Backups</h2>
          <p className="text-slate-300 text-xs max-w-2xl mt-1 leading-relaxed">
            Manage strict payroll approvals, perform full system restore actions, and view immutable audit trails tracking all core transactions.
          </p>
        </div>
      </div>

      {actionStatus && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
            actionStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="mt-0.5 font-bold text-lg">
            {actionStatus.type === 'success' ? '✅' : '🚨'}
          </div>
          <div className="space-y-0.5">
            <h5 className="font-bold text-xs">{actionStatus.type === 'success' ? 'Task Completed Successfully' : 'Action Blocked / Error'}</h5>
            <p className="text-[11px] leading-relaxed opacity-90">{actionStatus.message}</p>
          </div>
        </motion.div>
      )}

      {/* Main Feature Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Payroll Locks & Database tools */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: Payroll Lock System */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">Payroll Lock System</h3>
                <p className="text-[10px] text-gray-400">Lock status for month: {activeMonth}</p>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLocked 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isLocked ? (
                  <>
                    <Lock size={10} />
                    <span>Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock size={10} />
                    <span>Draft Active</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-[11px] text-gray-600 space-y-2 leading-relaxed">
              <p>
                {isLocked 
                  ? "🔒 This month's payroll is locked. Recalculation, attendance alterations, loan deductions, and salary changes are disabled." 
                  : "🔓 Draft Mode. Salaries can be modified, and bulk attendance pasting is active. Locking occurs automatically upon approving payroll."
                }
              </p>
              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 border border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-slate-500" />
                  <span className="font-bold text-slate-800">Current Operator Profile:</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1 pl-5 text-[10px]">
                  <span className="text-gray-400">Name:</span>
                  <span className="font-mono font-bold text-gray-800">{activeHR.name}</span>
                  <span className="text-gray-400">Authorized Role:</span>
                  <span className={`font-bold font-mono ${activeHR.role === 'SUPER_HR' ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {activeHR.role}
                  </span>
                </div>
              </div>
            </div>

            {isLocked && (
              <div className="pt-2 border-t mt-4">
                {activeHR.role === 'SUPER_HR' ? (
                  <button
                    onClick={handleUnlockPayroll}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Unlock size={14} />
                    <span>Unlock Payroll Month</span>
                  </button>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex gap-2 items-start text-amber-900">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="font-bold text-[10px] block">Super Admin Permission Required</strong>
                      <p className="text-[10px] leading-relaxed opacity-90">
                        Only a Super HR admin can unlock a closed payroll month ledger. Please contact <strong>Vishnu Sakar (Super HR)</strong> to request unlock credentials.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Database Backup & Recovery */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">System Backup & Recovery</h3>
              <p className="text-[10px] text-gray-400">Secure state-level database operations</p>
            </div>

            <p className="text-[11px] text-gray-600 leading-relaxed">
              Export the live relational database to a raw <strong>Payroll.db</strong> file, or restore a previous file to recover employee directories and transaction registries instantly.
            </p>

            <div className="space-y-3 pt-2">
              {/* Backup Trigger */}
              <button
                onClick={handleBackupDownload}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <Download size={14} />
                <span>Download Payroll.db Backup</span>
              </button>

              {/* Restore Trigger */}
              <div className="relative">
                <input
                  type="file"
                  id="restore-database-input"
                  accept=".db"
                  onChange={handleFileRestore}
                  disabled={restoring}
                  className="hidden"
                />
                <label
                  htmlFor="restore-database-input"
                  className={`w-full py-2.5 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    restoring ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
                  }`}
                >
                  {restoring ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-emerald-600" />
                      <span>Restoring Database...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} className="text-slate-500" />
                      <span>Restore Payroll.db File</span>
                    </>
                  )}
                </label>
              </div>

              {/* Browser Auto-Save Backup Restore Option */}
              {(() => {
                const statsStr = localStorage.getItem('vetan_erp_auto_save_backup_stats');
                if (!statsStr) return null;
                try {
                  const stats = JSON.parse(statsStr);
                  return (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-left">
                      <div className="flex items-start gap-2 text-amber-900">
                        <span className="text-sm mt-0.5">⚡</span>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-[10px] text-amber-950 uppercase tracking-wider">Browser Session Backup Found</h4>
                          <p className="text-[10px] text-amber-800 leading-relaxed">
                            Humne pichli session ka active backup paya jisme <strong>{stats.employeesCount} Staff Members</strong> aur records saved hain (Saved: {new Date(stats.savedAt).toLocaleString('en-IN')}).
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const backupStr = localStorage.getItem('vetan_erp_auto_save_backup');
                          if (!backupStr) return;
                          setRestoring(true);
                          setActionStatus(null);
                          try {
                            const payload = JSON.parse(backupStr);
                            const res = await fetch('/api/restore-json', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload)
                            });
                            if (res.ok) {
                              setActionStatus({
                                type: 'success',
                                message: '🎉 Browser Session Backup successfully restored! All employees and salary records are recovered.'
                              });
                              setTimeout(() => {
                                window.location.reload();
                              }, 1500);
                            } else {
                              setActionStatus({
                                type: 'error',
                                message: 'Failed to restore browser session backup.'
                              });
                            }
                          } catch (err: any) {
                            setActionStatus({
                              type: 'error',
                              message: 'Restore error: ' + err.message
                            });
                          } finally {
                            setRestoring(false);
                          }
                        }}
                        disabled={restoring}
                        className="w-full py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer select-none"
                      >
                        {restoring ? 'Restoring...' : 'Restore Browser Backup Instantly'}
                      </button>
                    </div>
                  );
                } catch (e) {
                  return null;
                }
              })()}
            </div>
          </div>

          {/* Section 3: System Security Level & Enforcement */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4" id="system-security-card">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">System Security Settings</h3>
                <p className="text-[10px] text-gray-400">Manage production security enforcement</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                productionSecurityEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-[#B45309]'
              }`}>
                {productionSecurityEnabled ? 'Production' : 'Testing'}
              </span>
            </div>

            <p className="text-[11px] text-gray-600 leading-relaxed">
              Toggle safety rules to match developer or environment needs:
            </p>
            <ul className="text-[10px] text-gray-500 list-disc list-inside space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <li><strong>Password Required</strong> for all users logging in</li>
              <li><strong>PIN Verification Required</strong> for database operations</li>
              <li><strong>Audit Logs Trail</strong> active for all key sessions</li>
            </ul>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  disabled={savingSecurityMode}
                  checked={productionSecurityEnabled}
                  onChange={(e) => handleToggleSecurityMode(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <span className="text-xs font-bold text-slate-700 select-none group-hover:text-slate-900">
                  Enable Production Security
                </span>
              </label>
              {savingSecurityMode && (
                <p className="text-[9px] text-emerald-600 mt-1 animate-pulse">Updating system security level...</p>
              )}
            </div>
          </div>

          {/* Section 4: Festival & Announcement Marquee Banner Settings */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4" id="festival-settings-card">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display flex items-center gap-1.5">
                  <Megaphone size={14} className="text-amber-500 animate-bounce" />
                  Festival & Event Slide Banner
                </h3>
                <p className="text-[10px] text-gray-400">Set a giant sliding message for screensaver/idle states</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                festivalActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {festivalActive ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Announcement Message (Hinglish/English)
                </label>
                <textarea
                  value={festivalMessage}
                  onChange={(e) => setFestivalMessage(e.target.value)}
                  placeholder="e.g. Wishing all our HR Teams and Employees of Sakar I, III, SVN I, II a very Happy Independence Day! 🇮🇳✨"
                  rows={2}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Display Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={60}
                    value={festivalDuration}
                    onChange={(e) => setFestivalDuration(Math.max(15, Number(e.target.value)))}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                  <p className="text-[8px] text-rose-500 mt-0.5 font-bold">Minimum 15 seconds required</p>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2 select-none">
                    <input
                      type="checkbox"
                      checked={festivalActive}
                      onChange={(e) => setFestivalActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm accent-emerald-600"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Enable Banner
                    </span>
                  </label>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-normal bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                💡 **Mantra:** Banner active karne ke baad, jab bhi koi user (HR) 30 second tak page par inactive (idle) rahega, screen par bada slide message ghumne lagega. Kisi bhi click/mouse movement se vo automatic band ho jayega.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveFestivalSettings}
                  disabled={savingFestivalSettings}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingFestivalSettings ? 'Saving Settings...' : 'Save & Publish Message'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const event = new CustomEvent('festival-preview-trigger', {
                      detail: { message: festivalMessage, duration: Number(festivalDuration || 8) }
                    });
                    window.dispatchEvent(event);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  Live Test Slide
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Immutable Audit Logs Trail */}
        <div className="lg:col-span-7 bg-white border rounded-2xl p-5 shadow-xs flex flex-col h-[520px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 mb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <History size={16} className="text-emerald-700" />
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">System Integrity Audit Trail</h3>
              </div>
              <p className="text-[10px] text-gray-400">Immutable operations log with operator timestamps</p>
            </div>
            
            <button
              onClick={fetchLogsAndLockStatus}
              disabled={loadingLogs}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <RefreshCw size={11} className={loadingLogs ? 'animate-spin' : ''} />
              <span>Refresh Trail</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter audit trail by action, operator, details or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Log list table container */}
          <div className="flex-1 overflow-y-auto border rounded-xl bg-slate-50 relative">
            {loadingLogs && logs.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <RefreshCw size={24} className="animate-spin text-emerald-600" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-2">
                <span className="text-2xl">📋</span>
                <p className="text-xs font-bold text-gray-700">No matching audit events found</p>
                <p className="text-[10px] text-gray-400">Perform employee creations, wage calculations or restores to trigger entries.</p>
              </div>
            ) : (
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b text-[10px] uppercase sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Action</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {filteredLogs.map((log) => {
                    // format ISO timestamp to readable IST/local
                    let readableTime = log.timestamp;
                    try {
                      readableTime = new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      });
                    } catch (e) {}

                    // style action tags
                    let actionBadgeStyle = 'bg-slate-100 text-slate-800';
                    if (log.action.includes('Created')) actionBadgeStyle = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                    else if (log.action.includes('Edited') || log.action.includes('Changed')) actionBadgeStyle = 'bg-blue-50 text-blue-800 border border-blue-200';
                    else if (log.action.includes('Approved') || log.action.includes('Locked')) actionBadgeStyle = 'bg-rose-50 text-rose-800 border border-rose-200';
                    else if (log.action.includes('Unlocked')) actionBadgeStyle = 'bg-amber-50 text-amber-800 border border-amber-200';
                    else if (log.action.includes('Restored')) actionBadgeStyle = 'bg-purple-50 text-purple-800 border border-purple-200';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${actionBadgeStyle}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 max-w-xs">{log.details}</td>
                        <td className="p-3 font-mono font-bold text-gray-900 whitespace-nowrap">{log.user_name}</td>
                        <td className="p-3 text-right text-gray-400 font-mono whitespace-nowrap">{readableTime}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Secure Action PIN prompt modal */}
      {securePinModal && securePinModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 text-slate-900">
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{securePinModal.title}</h3>
                  <p className="text-xs text-slate-500">Super Admin Security Verification</p>
                </div>
              </div>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setPinError('');
                await securePinModal.onSubmit(pinValue);
              }} 
              className="p-6 space-y-4"
            >
              <p className="text-xs text-slate-600 leading-relaxed">
                {securePinModal.description}
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block text-left">Super Admin Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-digit PIN"
                  className="w-full text-center text-lg tracking-[0.5em] p-2.5 border rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                  required
                />
                <p className="text-[10px] text-gray-400 text-center">Contact Super Admin Vishnu Sakar for credentials</p>
              </div>

              {pinError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-semibold text-center">
                  {pinError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSecurePinModal(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition cursor-pointer select-none shadow-sm"
                >
                  Confirm & Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
