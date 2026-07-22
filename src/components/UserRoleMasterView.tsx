import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Lock, 
  Unlock, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Plus, 
  Eye, 
  EyeOff, 
  Search, 
  ShieldAlert,
  Building,
  KeyRound,
  Info
} from 'lucide-react';
import { HRUser } from '../types';

interface UserRoleMasterViewProps {
  activeOperator: any;
}

export default function UserRoleMasterView({ activeOperator }: UserRoleMasterViewProps) {
  const [users, setUsers] = useState<HRUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<HRUser | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<'SUPER_HR' | 'COMPANY_HR' | 'MANAGEMENT' | 'ATTENDANCE_ONLY_HR' | 'AUDITOR' | 'ACCOUNTS_ADMIN' | 'HOD'>('COMPANY_HR');
  const [companyRights, setCompanyRights] = useState<string[]>([]);
  const [disabled, setDisabled] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // New sub tabs & revealed passwords state
  const [activeSubTab, setActiveSubTab] = useState<'admin' | 'employee' | 'permissions' | 'resets'>('admin');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Employee Portals ESS state
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  // Rights & Reset requests state
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [selectedPermissionRole, setSelectedPermissionRole] = useState<'SUPER_HR' | 'COMPANY_HR' | 'ACCOUNTS_ADMIN' | 'HOD' | 'AUDITOR'>('COMPANY_HR');
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [loadingResets, setLoadingResets] = useState(false);

  const fetchRolePermissions = async () => {
    try {
      const res = await fetch('/api/role-permissions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRolePermissions(data);
      }
    } catch (err) {
      console.error('Error fetching role permissions:', err);
    }
  };

  const fetchResetRequests = async () => {
    setLoadingResets(true);
    try {
      const res = await fetch('/api/admin/reset-requests');
      const data = await res.json();
      if (Array.isArray(data)) {
        setResetRequests(data);
      }
    } catch (err) {
      console.error('Error fetching reset requests:', err);
    } finally {
      setLoadingResets(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'employee') {
      fetchEmployees();
    } else if (activeSubTab === 'permissions') {
      fetchRolePermissions();
    } else if (activeSubTab === 'resets') {
      fetchResetRequests();
    }
  }, [activeSubTab]);

  const handleResetEmployeePassword = async (empId: string, customPass?: string) => {
    const passwordToSet = customPass || empId;
    try {
      const res = await fetch('/api/admin/reset-employee-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, newPassword: passwordToSet })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully set password for ${empId} to: "${passwordToSet}"`);
        fetchEmployees();
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    }
  };

  const handleSetCustomPassword = (empId: string) => {
    const pass = prompt(`Enter custom password for employee ${empId}:`);
    if (pass !== null) {
      const trimmed = pass.trim();
      if (trimmed.length < 4) {
        alert('Password must be at least 4 characters.');
        return;
      }
      handleResetEmployeePassword(empId, trimmed);
    }
  };

  const availableCompanies = [
    { id: 'SVN-1', label: 'SVN Unit I' },
    { id: 'SVN-II', label: 'SVN Unit II' },
    { id: 'Sakar-I', label: 'Sakar Unit I' },
    { id: 'Sakar-III', label: 'Sakar Unit III' },
    { id: 'Flare-1', label: 'Flare' },
    { id: 'Zenivo-1', label: 'Zenivo' }
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('password123'); // default password
    setTitle('');
    setRole('COMPANY_HR');
    setCompanyRights([]);
    setDisabled(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: HRUser) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password || '');
    setTitle(user.title || '');
    setRole(user.role);
    setCompanyRights(user.company_rights || []);
    setDisabled(!!user.disabled);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleCompanyRight = (companyId: string) => {
    if (companyRights.includes(companyId)) {
      setCompanyRights(companyRights.filter(id => id !== companyId));
    } else {
      setCompanyRights([...companyRights, companyId]);
    }
  };

  const handleSelectAllCompanies = () => {
    setCompanyRights(availableCompanies.map(c => c.id));
  };

  const handleClearAllCompanies = () => {
    setCompanyRights([]);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !role) {
      setFormError('Please fill in Name, Username, and Role');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload: Partial<HRUser> = {
        id: editingUser?.id,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password || 'password123',
        title: title.trim() || undefined,
        role,
        company_rights: companyRights,
        disabled
      };

      const res = await fetch('/api/hr/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        setFormError(data.error || 'Failed to save user');
      }
    } catch (err: any) {
      setFormError('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === 'USR001') {
      alert('You cannot delete the primary Company Management account.');
      return;
    }
    if (confirm('Are you sure you want to permanently delete this user account?')) {
      try {
        const res = await fetch(`/api/hr/users/${userId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchUsers();
        } else {
          const errData = await res.json();
          alert(errData.error || 'Failed to delete user');
        }
      } catch (err: any) {
        alert('Network error: ' + err.message);
      }
    }
  };

  const handleToggleDisable = async (user: HRUser) => {
    if (user.id === 'USR001') {
      alert('You cannot disable the primary Company Management account.');
      return;
    }
    try {
      const updatedUser = {
        ...user,
        disabled: !user.disabled
      };
      const res = await fetch('/api/hr/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Failed to update status');
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.title && u.title.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-emerald-600" size={24} />
            User Role Master
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage administrative user accounts, assign corporate units/companies, configure access roles, and toggle credentials.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
        >
          <UserPlus size={15} />
          Create New User
        </button>
      </div>

      {/* Sub tabs */}
      <div className="flex bg-gray-150/70 p-1 rounded-xl max-w-2xl border border-gray-200">
        <button
          onClick={() => setActiveSubTab('admin')}
          className={`px-4 py-2 text-center rounded-lg text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer select-none ${
            activeSubTab === 'admin'
              ? 'bg-white text-slate-900 shadow-sm border border-gray-200/50'
              : 'text-gray-500 hover:text-slate-900'
          }`}
        >
          <Users size={14} />
          Admin & HR Users
        </button>
        <button
          onClick={() => setActiveSubTab('employee')}
          className={`px-4 py-2 text-center rounded-lg text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer select-none ${
            activeSubTab === 'employee'
              ? 'bg-white text-slate-900 shadow-sm border border-gray-200/50'
              : 'text-gray-500 hover:text-slate-900'
          }`}
        >
          <KeyRound size={14} />
          Employee Portals (ESS)
        </button>
        {activeOperator?.role === 'SUPER_HR' && (
          <>
            <button
              onClick={() => setActiveSubTab('permissions')}
              className={`px-4 py-2 text-center rounded-lg text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer select-none ${
                activeSubTab === 'permissions'
                  ? 'bg-white text-slate-900 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-slate-900'
              }`}
            >
              <Shield size={14} />
              Menu Rights
            </button>
            <button
              onClick={() => setActiveSubTab('resets')}
              className={`px-4 py-2 text-center rounded-lg text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer select-none ${
                activeSubTab === 'resets'
                  ? 'bg-white text-slate-900 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-slate-900'
              }`}
            >
              <KeyRound size={14} />
              Reset Requests
            </button>
          </>
        )}
      </div>

      {activeSubTab === 'admin' ? (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users by name, username, title, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl py-2 px-10 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
              <p className="text-xs">Loading admin profiles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className={`bg-white rounded-2xl border transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                    user.disabled ? 'border-red-100 bg-red-50/5' : 'border-gray-250/70'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase mb-2 ${
                          user.role === 'SUPER_HR' 
                            ? 'bg-purple-100 text-purple-700' 
                            : user.role === 'MANAGEMENT'
                            ? 'bg-blue-100 text-blue-700'
                            : user.role === 'ATTENDANCE_ONLY_HR'
                            ? 'bg-amber-100 text-amber-700'
                            : user.role === 'AUDITOR'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {user.role === 'SUPER_HR' 
                            ? 'Company Management' 
                            : user.role === 'MANAGEMENT'
                            ? 'Management User'
                            : user.role === 'ATTENDANCE_ONLY_HR'
                            ? 'Attendance Officer'
                            : user.role === 'AUDITOR'
                            ? 'Auditor (Read Only)'
                            : 'HR Specialist'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">{user.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{user.title || 'Administrator'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-150">
                          {user.id}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          user.disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {user.disabled ? <Lock size={10} /> : <Unlock size={10} />}
                          {user.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3.5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Username:</span>
                        <strong className="text-slate-800 font-mono">{user.username}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Password:</span>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-800 font-mono">
                            {revealedPasswords[user.id] ? (user.password || 'Varrawatia') : '••••••••'}
                          </strong>
                          <button
                            type="button"
                            onClick={() => setRevealedPasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                            className="text-gray-400 hover:text-gray-600 transition p-0.5 cursor-pointer"
                            title="Toggle password view"
                          >
                            {revealedPasswords[user.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-400 block">Company Rights:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.company_rights && user.company_rights.length > 0 ? (
                            user.company_rights.map(cr => (
                              <span key={cr} className="bg-slate-100 text-slate-700 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                {cr}
                              </span>
                            ))
                          ) : (
                            <span className="text-red-500 italic text-[10px]">No assigned units</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-t border-gray-150 px-5 py-3 rounded-b-2xl flex items-center justify-between">
                    <button
                      onClick={() => handleToggleDisable(user)}
                      disabled={user.id === 'USR001'}
                      className={`text-xs font-bold flex items-center gap-1 cursor-pointer select-none ${
                        user.id === 'USR001'
                          ? 'text-gray-300 cursor-not-allowed'
                          : user.disabled 
                          ? 'text-emerald-600 hover:text-emerald-500' 
                          : 'text-red-600 hover:text-red-500'
                      }`}
                    >
                      {user.disabled ? <Unlock size={12} /> : <Lock size={12} />}
                      {user.disabled ? 'Enable User' : 'Disable User'}
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-1.5 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 text-slate-500 hover:text-emerald-600 shadow-sm transition"
                        title="Edit User Settings"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === 'USR001'}
                        className={`p-1.5 bg-white border rounded-lg shadow-sm transition ${
                          user.id === 'USR001' 
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed' 
                            : 'border-gray-200 hover:border-red-500 text-slate-500 hover:text-red-600'
                        }`}
                        title="Delete User"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="col-span-full bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-400">
                  <Users size={48} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-xs">No administrative users found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : activeSubTab === 'employee' ? (
        <>
          {/* Employee ESS View */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search employees by ID or Name..."
                value={employeeSearchQuery}
                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl py-2 px-10 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl px-4 py-2 flex items-center gap-2 text-[11px] text-emerald-800">
              <Info size={14} className="shrink-0 text-emerald-600" />
              <span>Employees first-time password is their <strong>Employee Code</strong> (lowercase or uppercase)</span>
            </div>
          </div>

          {loadingEmployees ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
              <p className="text-xs">Loading employee portals list...</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-600">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-extrabold border-b border-gray-200">
                      <th className="p-4">Employee Code</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Unit / Company</th>
                      <th className="p-4">Portal Password</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {employees
                      .filter(emp => {
                        const q = employeeSearchQuery.toLowerCase().trim();
                        return !q || emp.id.toLowerCase().includes(q) || emp.name.toLowerCase().includes(q);
                      })
                      .map(emp => {
                        const isDefaultPassword = !emp.password || emp.password.toLowerCase() === emp.id.toLowerCase();
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-4 font-mono font-bold text-slate-900">{emp.id}</td>
                            <td className="p-4 font-semibold text-slate-800">{emp.name}</td>
                            <td className="p-4 font-semibold text-slate-600">
                              <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200">
                                {emp.company}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 font-mono">
                                {isDefaultPassword ? (
                                  <span className="text-amber-600 bg-amber-50 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200/50">
                                    Default (Employee Code)
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span>{revealedPasswords[emp.id] ? emp.password : '••••••••'}</span>
                                    <button
                                      type="button"
                                      onClick={() => setRevealedPasswords(prev => ({ ...prev, [emp.id]: !prev[emp.id] }))}
                                      className="text-gray-400 hover:text-gray-600 transition p-0.5"
                                    >
                                      {revealedPasswords[emp.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {emp.needs_password_change || isDefaultPassword ? (
                                <span className="text-pink-600 bg-pink-50 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-pink-200/50">
                                  Force Change Pending
                                </span>
                              ) : (
                                <span className="text-green-600 bg-green-50 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-green-200/50">
                                  Set & Active
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleSetCustomPassword(emp.id)}
                                  className="px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer select-none transition"
                                >
                                  Change Password
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to reset password for ${emp.name} (${emp.id}) to default?`)) {
                                      handleResetEmployeePassword(emp.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200/50 cursor-pointer select-none transition"
                                >
                                  Reset to Default
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : activeSubTab === 'permissions' ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Menu-Level Rights Management</h3>
              <p className="text-xs text-slate-500 mt-1">Configure view, add, edit, delete, approve, and export rights for each role.</p>
            </div>
            <div className="space-y-1.5 w-full sm:w-64">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Select Role to Customize</label>
              <select
                value={selectedPermissionRole}
                onChange={(e) => setSelectedPermissionRole(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-sans"
              >
                <option value="COMPANY_HR">HR Specialist (COMPANY_HR)</option>
                <option value="ACCOUNTS_ADMIN">Accounts Admin (ACCOUNTS_ADMIN)</option>
                <option value="HOD">HOD (HOD)</option>
                <option value="AUDITOR">Auditor (AUDITOR)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-2xl">
            <table className="w-full border-collapse text-left text-xs text-slate-600">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-extrabold border-b border-gray-200">
                  <th className="p-4">Module Name</th>
                  <th className="p-4 text-center">View</th>
                  <th className="p-4 text-center">Add / Create</th>
                  <th className="p-4 text-center">Edit / Update</th>
                  <th className="p-4 text-center">Delete / Purge</th>
                  <th className="p-4 text-center">Approve</th>
                  <th className="p-4 text-center">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {['employees', 'attendance', 'leaves', 'gatepass', 'payroll', 'revisions', 'loans', 'reports', 'letters', 'companies', 'hods', 'org', 'ff', 'users', 'audit', 'vault'].map((menu) => {
                  const perm = rolePermissions.find(p => p.role === selectedPermissionRole && p.menu === menu) || {
                    can_view: selectedPermissionRole === 'AUDITOR' ? 1 : 0,
                    can_add: 0,
                    can_edit: 0,
                    can_delete: 0,
                    can_approve: 0,
                    can_export: selectedPermissionRole === 'AUDITOR' ? 1 : 0
                  };
                  
                  const handleTogglePermission = async (action: 'view' | 'add' | 'edit' | 'delete' | 'approve' | 'export') => {
                    const col = `can_${action}`;
                    const updatedPerms = [...rolePermissions];
                    const idx = updatedPerms.findIndex(p => p.role === selectedPermissionRole && p.menu === menu);
                    const newVal = perm[col] === 1 ? 0 : 1;
                    
                    const updatedObj = idx !== -1 ? { ...updatedPerms[idx], [col]: newVal } : {
                      role: selectedPermissionRole,
                      menu,
                      can_view: action === 'view' ? newVal : perm.can_view || 0,
                      can_add: action === 'add' ? newVal : perm.can_add || 0,
                      can_edit: action === 'edit' ? newVal : perm.can_edit || 0,
                      can_delete: action === 'delete' ? newVal : perm.can_delete || 0,
                      can_approve: action === 'approve' ? newVal : perm.can_approve || 0,
                      can_export: action === 'export' ? newVal : perm.can_export || 0
                    };

                    if (idx !== -1) {
                      updatedPerms[idx] = updatedObj;
                    } else {
                      updatedPerms.push(updatedObj);
                    }
                    
                    setRolePermissions(updatedPerms);
                    
                    try {
                      await fetch('/api/role-permissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify([updatedObj])
                      });
                    } catch (err) {
                      console.error('Error saving role permission:', err);
                    }
                  };

                  return (
                    <tr key={menu} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold capitalize text-slate-800 font-mono">{menu}</td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_view === 1}
                          onChange={() => handleTogglePermission('view')}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_add === 1}
                          onChange={() => handleTogglePermission('add')}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_edit === 1}
                          onChange={() => handleTogglePermission('edit')}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_delete === 1}
                          onChange={() => handleTogglePermission('delete')}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_approve === 1}
                          onChange={() => handleTogglePermission('approve')}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_export === 1}
                          onChange={() => handleTogglePermission('export')}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Forgot Password Reset Requests</h3>
            <p className="text-xs text-slate-500 mt-1">Review and approve password resets. Approved accounts are reset to default passwords (employee code / username) with mandatory first-login password change.</p>
          </div>

          {loadingResets ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
              <p className="text-xs">Loading reset requests...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-extrabold border-b border-gray-200">
                    <th className="p-4">Request ID</th>
                    <th className="p-4">User ID / Code</th>
                    <th className="p-4">User Name</th>
                    <th className="p-4">Account Type</th>
                    <th className="p-4">Requested At</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {resetRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono font-bold text-slate-900">{req.id}</td>
                      <td className="p-4 font-mono font-bold text-slate-800">{req.username}</td>
                      <td className="p-4 font-semibold text-slate-700">{req.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.role === 'Employee' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {req.role}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">{new Date(req.requested_at).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'PENDING' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                          req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                          'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={async () => {
                                if (confirm(`Approve password reset for ${req.name}? This resets their password to default.`)) {
                                  try {
                                    const res = await fetch('/api/admin/approve-reset', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ requestId: req.id })
                                    });
                                    if (res.ok) {
                                      alert('Password reset approved successfully.');
                                      fetchResetRequests();
                                    }
                                  } catch (err) {
                                    console.error('Error approving reset:', err);
                                  }
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Reject password reset for ${req.name}?`)) {
                                  try {
                                    const res = await fetch('/api/admin/reject-reset', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ requestId: req.id })
                                    });
                                    if (res.ok) {
                                      fetchResetRequests();
                                    }
                                  } catch (err) {
                                    console.error('Error rejecting reset:', err);
                                  }
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded border border-red-200 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {resetRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400 italic">No password reset requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm font-bold font-display">
                  {editingUser ? 'Modify User Profile' : 'Configure New User'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {editingUser ? 'Update administrative privileges and credentials.' : 'Establish secure dashboard credentials and scope.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-start gap-2">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vijendra Singh"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Username</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. vijendra"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Security credentials"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-3 pr-10 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Official Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. HR Officer (SVN Unit I)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">System Access Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    <option value="SUPER_HR">Company Management (SUPER_HR)</option>
                    <option value="MANAGEMENT">Management (MANAGEMENT)</option>
                    <option value="COMPANY_HR">HR Specialist (COMPANY_HR)</option>
                    <option value="ATTENDANCE_ONLY_HR">Attendance Officer (ATTENDANCE_ONLY_HR)</option>
                    <option value="AUDITOR">Auditor (AUDITOR - Read Only)</option>
                    <option value="ACCOUNTS_ADMIN">Accounts Admin (ACCOUNTS_ADMIN)</option>
                    <option value="HOD">HOD (HOD)</option>
                  </select>
                </div>
              </div>

              {/* Company / Unit rights assignment */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Company & Unit Access Scope
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCompanies}
                      className="text-[9px] font-bold text-emerald-600 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300 text-[9px]">•</span>
                    <button
                      type="button"
                      onClick={handleClearAllCompanies}
                      className="text-[9px] font-bold text-gray-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-150">
                  {availableCompanies.map(comp => {
                    const isChecked = companyRights.includes(comp.id);
                    return (
                      <label 
                        key={comp.id} 
                        className={`p-2 rounded-lg border transition cursor-pointer flex items-center gap-2 select-none ${
                          isChecked 
                            ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900 font-semibold' 
                            : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCompanyRight(comp.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                        />
                        <div className="text-[10px]">
                          <strong className="block">{comp.id}</strong>
                          <span className="text-[9px] block opacity-75">{comp.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[9px] text-gray-400 italic">
                  Note: Users with the Company Management or Management role will automatically bypass unit locks to view aggregated reporting.
                </p>
              </div>

              {editingUser && editingUser.id !== 'USR001' && (
                <label className="flex items-center gap-2 p-3 bg-red-50/30 border border-red-100 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disabled}
                    onChange={(e) => setDisabled(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <div>
                    <strong className="text-xs text-red-800 block">Deactivate User Account</strong>
                    <span className="text-[9px] text-red-600 block leading-tight">Disabled users cannot sign in or perform any admin operations.</span>
                  </div>
                </label>
              )}

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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer shadow-md"
                >
                  {saving ? 'Saving...' : 'Save User Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
