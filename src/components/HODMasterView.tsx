import React, { useState, useEffect } from 'react';
import { 
  Award,
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Building, 
  Info,
  User,
  Power,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { HODMaster, Employee } from '../types';

interface HODMasterViewProps {
  activeOperator: any;
}

export default function HODMasterView({ activeOperator }: HODMasterViewProps) {
  const [hods, setHods] = useState<HODMaster[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHod, setEditingHod] = useState<HODMaster | null>(null);
  
  // Form fields
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [company, setCompany] = useState('SVN-1');
  const [active, setActive] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const availableCompanies = [
    { id: 'SVN-1', label: 'SVN Unit I' },
    { id: 'SVN-II', label: 'SVN Unit II' },
    { id: 'Sakar-I', label: 'Sakar Unit I' },
    { id: 'Sakar-III', label: 'Sakar Unit III' },
    { id: 'Flare-1', label: 'Flare' },
    { id: 'Zenivo-1', label: 'Zenivo' }
  ];

  const availableDepartments = [
    'HR & Admin',
    'Production',
    'Quality',
    'Maintenance',
    'Logistics',
    'Finance & Accounts',
    'Purchase',
    'IT & Systems',
    'Sales & Marketing',
    'Engineering'
  ];

  const fetchHods = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hods');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHods(data);
      }
    } catch (err) {
      console.error('Error fetching HODs:', err);
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
    fetchHods();
    fetchEmployees();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingHod(null);
    setId('');
    setName('');
    setDepartment('Production');
    setCompany('SVN-1');
    setActive(true);
    setSelectedEmployeeId('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (hod: HODMaster) => {
    setEditingHod(hod);
    setId(hod.id);
    setName(hod.name);
    setDepartment(hod.department);
    setCompany(hod.company);
    setActive(hod.active !== false);
    setSelectedEmployeeId('');
    setFormError('');
    setIsModalOpen(true);
  };

  // When selecting an employee, populate form fields automatically
  const handleSelectEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!empId) return;
    
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setId(emp.id); // Default HOD Code to Employee Code
      setName(emp.name);
      setDepartment(emp.department);
      setCompany(emp.company);
    }
  };

  const handleSaveHod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !department.trim() || !company) {
      setFormError('Please fill in Name, Department, and Corporate Unit');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload: HODMaster = {
        id: id.trim() || undefined as any, // If blank, backend generates a new HOD0XX code
        name: name.trim(),
        department,
        company,
        active
      };

      const res = await fetch('/api/hods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchHods();
      } else {
        setFormError(data.error || 'Failed to save HOD');
      }
    } catch (err: any) {
      setFormError('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHod = async (hodId: string) => {
    if (confirm('Are you sure you want to permanently delete this HOD Master profile?')) {
      try {
        const res = await fetch(`/api/hods/${hodId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchHods();
        } else {
          const errData = await res.json();
          alert(errData.error || 'Failed to delete HOD');
        }
      } catch (err: any) {
        alert('Network error: ' + err.message);
      }
    }
  };

  const handleToggleActive = async (hod: HODMaster) => {
    try {
      const updatedHod = {
        ...hod,
        active: !hod.active
      };
      const res = await fetch('/api/hods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedHod)
      });
      if (res.ok) {
        fetchHods();
      } else {
        alert('Failed to update status');
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    }
  };

  const filteredHods = hods.filter(h => {
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.id.toLowerCase().includes(q) ||
      h.department.toLowerCase().includes(q) ||
      h.company.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="text-indigo-600 animate-pulse" size={24} />
            HOD Master Directory
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage Heads of Department (HODs), assign their corresponding corporate units, track status, and link employee codes.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
        >
          <Plus size={15} />
          Create HOD Master
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search HODs by name, HOD code, department, or company unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-250 rounded-xl py-2 px-10 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-xs">Loading HOD profiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHods.map((hod) => (
            <div 
              key={hod.id} 
              className={`bg-white rounded-2xl border transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                hod.active === false ? 'border-red-100 bg-red-50/5' : 'border-gray-250/70'
              }`}
            >
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase mb-2 bg-indigo-100 text-indigo-700">
                      Head of Department
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{hod.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{hod.department} Department</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-150">
                      {hod.id}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                      hod.active === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {hod.active === false ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Building size={12} /> Unit/Company:
                    </span>
                    <strong className="text-slate-800 font-mono text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      {hod.company}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Info size={12} /> HOD Status:
                    </span>
                    <span className={`font-semibold ${hod.active === false ? 'text-red-600' : 'text-green-600'}`}>
                      {hod.active === false ? 'Disabled / Out of Duty' : 'Fully Authorized'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-gray-150 px-5 py-3 rounded-b-2xl flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(hod)}
                  className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
                    hod.active === false 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-red-600 hover:text-red-700'
                  }`}
                >
                  {hod.active === false ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                  {hod.active === false ? 'Activate' : 'Deactivate'}
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenEditModal(hod)}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 text-slate-500 hover:text-indigo-600 shadow-sm transition"
                    title="Edit HOD Details"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteHod(hod.id)}
                    className="p-1.5 bg-white border border-gray-200 hover:border-red-500 text-slate-500 hover:text-red-600 rounded-lg shadow-sm transition"
                    title="Delete HOD"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredHods.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-400">
              <Award size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-xs">No Head of Department records found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit HOD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm font-bold font-display">
                  {editingHod ? 'Modify HOD Master Profile' : 'Configure New HOD Master'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {editingHod ? 'Update department responsibility or details.' : 'Establish secure HOD records, link employee or write manually.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveHod} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-start gap-2">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {!editingHod && (
                <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <label className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                    ⚡ Auto-Fill From Existing Employee list
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => handleSelectEmployeeChange(e.target.value)}
                    className="w-full bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="">-- Choose employee to auto-populate --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.id}) - {e.designation} in {e.department}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400">
                    Choosing an employee automatically pre-populates Code, Name, Department and Corporate Unit.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">HOD Code / Employee Code</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="e.g. EMP002 (or leave blank to auto-generate)"
                    disabled={!!editingHod}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">HOD Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alok Sharma"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Department Responsibility</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Corporate Unit</label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    {availableCompanies.map(c => (
                      <option key={c.id} value={c.id}>{c.id} - {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <strong className="text-xs text-indigo-800 block">Active Status</strong>
                  <span className="text-[9px] text-indigo-600 block leading-tight">Inactive HODs cannot be selected as reporting heads in employee profiles.</span>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer shadow-md"
                >
                  {saving ? 'Saving...' : 'Save HOD Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
