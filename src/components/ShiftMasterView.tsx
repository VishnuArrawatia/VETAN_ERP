import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Calendar,
  Users,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Shift, Employee } from '../types';

interface ShiftMasterViewProps {
  activeOperator: any;
  onRefreshEmployees?: () => void;
}

export default function ShiftMasterView({ activeOperator, onRefreshEmployees }: ShiftMasterViewProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  
  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('06:30 PM');
  const [graceTime, setGraceTime] = useState(15);
  const [weeklyOff, setWeeklyOff] = useState('Sunday');
  
  // Assign Employee state
  const [selectedShiftCode, setSelectedShiftCode] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'None'
  ];

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shifts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setShifts(data);
      }
    } catch (err) {
      console.error('Error fetching shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchEmployees();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingShift(null);
    setCode('');
    setName('');
    setStartTime('09:00 AM');
    setEndTime('06:30 PM');
    setGraceTime(15);
    setWeeklyOff('Sunday');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setCode(shift.code);
    setName(shift.name);
    setStartTime(shift.start_time);
    setEndTime(shift.end_time);
    setGraceTime(shift.grace_time);
    setWeeklyOff(shift.weekly_off || 'Sunday');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !startTime.trim() || !endTime.trim()) {
      setFormError('Please fill in Shift Code, Name, Start Time, and End Time');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload: Shift = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        grace_time: Number(graceTime) || 0,
        weekly_off: weeklyOff
      };

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Operator-Role': activeOperator?.role || 'COMPANY_HR',
          'X-Operator-Name': activeOperator?.name || 'Admin'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchShifts();
      } else {
        setFormError(data.error || 'Failed to save shift');
      }
    } catch (err: any) {
      setFormError('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (shiftCode: string) => {
    if (confirm(`Are you sure you want to delete the shift timing "${shiftCode}"?`)) {
      try {
        const res = await fetch(`/api/shifts/${shiftCode}`, {
          method: 'DELETE',
          headers: {
            'X-Operator-Role': activeOperator?.role || 'COMPANY_HR',
            'X-Operator-Name': activeOperator?.name || 'Admin'
          }
        });
        if (res.ok) {
          fetchShifts();
        } else {
          const errData = await res.json();
          alert(errData.error || 'Failed to delete shift');
        }
      } catch (err: any) {
        alert('Network error: ' + err.message);
      }
    }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedShiftCode) {
      setAssignmentError('Please select both an employee and a shift timing.');
      return;
    }

    setAssigning(true);
    setAssignmentError('');
    setAssignmentSuccess('');

    try {
      const employee = employees.find(emp => emp.id === selectedEmployeeId);
      const shift = shifts.find(sh => sh.code === selectedShiftCode);
      if (!employee || !shift) {
        setAssignmentError('Invalid employee or shift selection.');
        setAssigning(false);
        return;
      }

      // Update employee timing to "Shift Name (Start - End)" format or raw timing string
      // Let's use the shift display timing as the standard Vetan timing string
      const timingString = `${shift.name} (${shift.start_time} to ${shift.end_time})`;

      const res = await fetch(`/api/employees/${selectedEmployeeId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Operator-Role': activeOperator?.role || 'COMPANY_HR',
          'X-Operator-Name': activeOperator?.name || 'Admin'
        },
        body: JSON.stringify({
          ...employee,
          shift_timing: timingString
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAssignmentSuccess(`Successfully assigned ${employee.name} to ${shift.name}!`);
        setSelectedEmployeeId('');
        fetchEmployees();
        if (onRefreshEmployees) {
          onRefreshEmployees();
        }
      } else {
        setAssignmentError(data.error || 'Failed to assign shift.');
      }
    } catch (err: any) {
      setAssignmentError('Network error: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const filteredShifts = shifts.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.start_time.toLowerCase().includes(q) ||
      s.end_time.toLowerCase().includes(q) ||
      (s.weekly_off || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="text-amber-600 animate-pulse" size={24} />
            Shift Master & Schedule Manager
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Create multi-timing company shifts (General, Production, Security, Night), configure grace periods, weekly offs, and map them to employees.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
        >
          <Plus size={15} />
          Create New Shift
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Shift Timings Directory */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search shifts by code, name, timings, or off-day..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl py-2 px-10 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-2"></div>
              <p className="text-xs">Loading shift records...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShifts.map((shift) => {
                // Count employees assigned to this shift timing
                const assignedCount = employees.filter(emp => {
                  const t = (emp.shift_timing || '').toLowerCase();
                  return t.includes(shift.code.toLowerCase()) || t.includes(shift.name.toLowerCase());
                }).length;

                return (
                  <div 
                    key={shift.code} 
                    className="bg-white rounded-2xl border border-gray-200 transition shadow-sm hover:shadow-md flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase mb-2 bg-amber-100 text-amber-800">
                            Schedule Profile
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">{shift.name}</h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-150">
                          {shift.code}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" /> Start Time:
                          </span>
                          <strong className="text-slate-800 font-semibold">{shift.start_time}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" /> End Time:
                          </span>
                          <strong className="text-slate-800 font-semibold">{shift.end_time}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <AlertCircle size={12} className="text-amber-500" /> Grace Time:
                          </span>
                          <strong className="text-slate-800 font-mono font-bold">{shift.grace_time} Mins</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400" /> Weekly Off:
                          </span>
                          <span className="font-bold text-emerald-700 px-1.5 py-0.5 bg-emerald-50 rounded text-[10px] uppercase">
                            {shift.weekly_off || 'Sunday'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <Users size={12} className="text-slate-400" /> Assigned Force:
                          </span>
                          <strong className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            {assignedCount} Employee{assignedCount === 1 ? '' : 's'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border-t border-gray-150 px-5 py-3 rounded-b-2xl flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleOpenEditModal(shift)}
                        className="p-1.5 bg-white border border-gray-200 rounded-lg hover:border-amber-500 text-slate-500 hover:text-amber-600 shadow-sm transition cursor-pointer"
                        title="Edit Shift Profile"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift.code)}
                        className="p-1.5 bg-white border border-gray-200 hover:border-red-500 text-slate-500 hover:text-red-600 rounded-lg shadow-sm transition cursor-pointer"
                        title="Delete Shift Timing"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredShifts.length === 0 && (
                <div className="col-span-full bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-400">
                  <Clock size={48} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-xs">No shift timing profiles found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Fast Shift Assignment Form */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="border-b pb-3.5">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users size={14} className="text-amber-600" />
                Assign Employee to Shift
              </h4>
              <p className="text-[10px] text-gray-500 mt-1">
                Select an active worker or staff member and associate them with a designated timing master.
              </p>
            </div>

            {assignmentSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 flex items-start gap-1.5 animate-pulse">
                <Check size={14} className="mt-0.5 shrink-0" />
                <span>{assignmentSuccess}</span>
              </div>
            )}

            {assignmentError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-start gap-1.5">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{assignmentError}</span>
              </div>
            )}

            <form onSubmit={handleAssignShift} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase">Select Employee</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-sans"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      [{emp.id}] {emp.name} ({emp.designation} - {emp.shift_timing || 'No assigned shift'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase">Target Work Shift timing</label>
                <select
                  required
                  value={selectedShiftCode}
                  onChange={(e) => setSelectedShiftCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-sans"
                >
                  <option value="">-- Choose Shift Master --</option>
                  {shifts.map(sh => (
                    <option key={sh.code} value={sh.code}>
                      {sh.name} - ({sh.start_time} to {sh.end_time})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={assigning}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md select-none flex items-center justify-center gap-1.5"
              >
                {assigning ? 'Updating shift schedule...' : 'Update Employee Shift'}
              </button>
            </form>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-2.5">
            <h5 className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest flex items-center gap-1">
              <Briefcase size={12} /> Work-Hour Regulations
            </h5>
            <ul className="text-[10px] text-amber-950 space-y-1.5 list-disc pl-4 leading-relaxed font-sans">
              <li><strong>Grace Time</strong> provides margin before attendance marks employee as <em>Late In</em>.</li>
              <li>Calculations for overtime, leave, or late penalties evaluate according to active assigned timing.</li>
              <li>You can also override shift timings individually inside the Employee edit profile menu.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Add / Edit Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm font-bold font-display">
                  {editingShift ? 'Modify Shift Timing Profile' : 'Configure New Corporate Shift'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {editingShift ? 'Update active operational bounds of shift.' : 'Create standard organization shift rules.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-650 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Shift Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SH-GEN, SH-PROD-A"
                    disabled={!!editingShift}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-amber-500 font-mono disabled:opacity-60 uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Shift Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. General Office Shift"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Start Time (Punch-In)</label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">End Time (Punch-Out)</label>
                  <input
                    type="text"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 06:30 PM"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Grace Period (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={graceTime}
                    onChange={(e) => setGraceTime(Number(e.target.value))}
                    placeholder="e.g. 15"
                    min={0}
                    max={120}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Weekly Off day</label>
                  <select
                    value={weeklyOff}
                    onChange={(e) => setWeeklyOff(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-sans"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-150 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer shadow-md"
                >
                  {saving ? 'Saving...' : 'Save Shift Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
