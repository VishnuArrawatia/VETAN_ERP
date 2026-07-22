import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Building2, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  FolderTree,
  Mail,
  Phone,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Employee } from '../types';

interface OrganizationStructureProps {
  employees: Employee[];
  activeCompany: string;
}

export default function OrganizationStructure({ employees, activeCompany }: OrganizationStructureProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'Engineering': true,
    'Operations': true,
    'HR & Admin': true,
    'Finance': true,
    'Sales': true,
    'Support': true
  });

  // Filter employees for the active company
  const companyEmployees = useMemo(() => {
    return employees.filter(emp => emp.company === activeCompany && emp.status === 'ACTIVE');
  }, [employees, activeCompany]);

  // Compute departments present in this company
  const departments = useMemo(() => {
    const set = new Set<string>();
    companyEmployees.forEach(emp => {
      if (emp.department) set.add(emp.department);
    });
    return Array.from(set);
  }, [companyEmployees]);

  // Hierarchical Parsing:
  // For each department, we determine the Department Head (HOD) dynamically.
  // Rule: Someone with a designation containing 'Director', 'Manager', 'Lead', 'Head', 'VP', or 'Chief' is preferred.
  // If there are multiple, choose the one with the highest base_salary.
  // If there are none, choose the person with the highest base_salary in that department.
  // The remaining employees in the department are designated as reporting team members.
  const deptHierarchies = useMemo(() => {
    const hierarchies: Record<string, { hod: Employee | null; team: Employee[] }> = {};

    departments.forEach(dept => {
      const deptStaff = companyEmployees.filter(emp => emp.department === dept);
      if (deptStaff.length === 0) {
        hierarchies[dept] = { hod: null, team: [] };
        return;
      }

      // Find candidates with leadership terms
      const leadCandidates = deptStaff.filter(emp => {
        const des = emp.designation.toLowerCase();
        return (
          des.includes('director') ||
          des.includes('manager') ||
          des.includes('lead') ||
          des.includes('head') ||
          des.includes('vp') ||
          des.includes('chief') ||
          des.includes('president') ||
          des.includes('specialist')
        );
      });

      let hod: Employee;
      if (leadCandidates.length > 0) {
        // Sort lead candidates by salary descending
        leadCandidates.sort((a, b) => b.base_salary - a.base_salary);
        hod = leadCandidates[0];
      } else {
        // Sort all department staff by salary descending
        const sortedStaff = [...deptStaff].sort((a, b) => b.base_salary - a.base_salary);
        hod = sortedStaff[0];
      }

      // Team are those who are not the HOD
      const team = deptStaff.filter(emp => emp.id !== hod.id);

      hierarchies[dept] = { hod, team };
    });

    return hierarchies;
  }, [companyEmployees, departments]);

  // Toggle node expansion
  const toggleNode = (dept: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [dept]: !prev[dept]
    }));
  };

  // Expand all / Collapse all
  const expandAll = () => {
    const next: Record<string, boolean> = {};
    departments.forEach(d => {
      next[d] = true;
    });
    setExpandedNodes(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    departments.forEach(d => {
      next[d] = false;
    });
    setExpandedNodes(next);
  };

  // Stats computation
  const stats = useMemo(() => {
    const totalStaff = companyEmployees.length;
    const totalPayroll = companyEmployees.reduce((sum, emp) => sum + emp.base_salary, 0);
    const avgSalary = totalStaff > 0 ? Math.round(totalPayroll / totalStaff) : 0;
    
    // Find the highest paid employee
    let topPaid: Employee | null = null;
    if (companyEmployees.length > 0) {
      topPaid = [...companyEmployees].sort((a, b) => b.base_salary - a.base_salary)[0];
    }

    return {
      totalStaff,
      totalPayroll,
      avgSalary,
      topPaid
    };
  }, [companyEmployees]);

  // Filtered department lists based on search term
  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments;
    
    // Find departments that either match the name or contain employees matching the search term
    return departments.filter(dept => {
      if (dept.toLowerCase().includes(searchTerm.toLowerCase())) return true;
      
      const hierarchy = deptHierarchies[dept];
      const matchesHod = hierarchy.hod?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         hierarchy.hod?.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = hierarchy.team.some(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return matchesHod || matchesTeam;
    });
  }, [departments, deptHierarchies, searchTerm]);

  return (
    <div className="space-y-6">
      
      {/* Upper banner section */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700">
              <FolderTree size={18} />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Hierarchy Blueprint</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              {activeCompany} Organizational Chart
            </h3>
            <p className="text-xs text-gray-500">
              Interactive structural matrix mapping of departments, dynamic functional reporting supervisors (HODs), and field staff directory.
            </p>
          </div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border transition cursor-pointer select-none"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border transition cursor-pointer select-none"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Corporate Headcount</span>
            <p className="text-2xl font-extrabold text-slate-900 font-display">{stats.totalStaff} Members</p>
            <span className="text-[10px] text-emerald-600 block font-semibold">Active processing profiles</span>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Monthly Wage Commitment</span>
            <p className="text-xl font-extrabold text-slate-900 font-mono">₹{stats.totalPayroll.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-gray-450 block">Base salary sum</span>
          </div>
          <div className="p-3.5 bg-slate-50 text-slate-600 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Average Employee Wage</span>
            <p className="text-xl font-extrabold text-slate-900 font-mono">₹{stats.avgSalary.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-emerald-600 block font-semibold">Per month average</span>
          </div>
          <div className="p-3.5 bg-emerald-50/50 text-emerald-700 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center justify-between">
          <div className="space-y-1 w-2/3">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Group Commander</span>
            <p className="text-xs font-bold text-slate-900 truncate mt-1">{stats.topPaid ? stats.topPaid.name : 'N/A'}</p>
            <span className="text-[9px] text-emerald-700 font-mono block truncate font-bold uppercase tracking-wide">
              {stats.topPaid ? stats.topPaid.designation : ''}
            </span>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <UserCheck size={20} />
          </div>
        </div>

      </div>

      {/* Main tree block and interactive controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Search, filters, and list of departments */}
        <div className="space-y-5 lg:col-span-1">
          
          <div className="bg-white p-5 rounded-2xl border shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Search Hierarchy</h4>
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, role, department..."
                className="w-full pl-9 pr-4 py-2 text-xs border rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Department Segments</span>
              <div className="divide-y text-xs">
                {departments.map(dept => {
                  const staffCount = companyEmployees.filter(e => e.department === dept).length;
                  const deptPayroll = companyEmployees.filter(e => e.department === dept).reduce((s, e) => s + e.base_salary, 0);
                  const isExpanded = expandedNodes[dept];

                  return (
                    <div 
                      key={dept} 
                      onClick={() => toggleNode(dept)}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isExpanded ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                        <span className="font-semibold text-slate-800">{dept}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full font-mono">
                          {staffCount}
                        </span>
                        {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white border shadow-md space-y-3.5 select-none">
            <span className="text-[9px] bg-emerald-600 text-white font-mono font-bold px-2 py-0.5 rounded w-fit block tracking-widest uppercase">
              Corporate Directives
            </span>
            <h5 className="font-bold text-sm text-slate-50">Department Head Structure</h5>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              HOD assignments are dynamically generated based on statutory authority profiles and compensation metrics. Higher designations such as Director, Manager, Lead, and VP are given processing authority.
            </p>
            <div className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
              <span>Auto-scale updates: Active</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>

        </div>

        {/* Right column: Interactive Visual Hierarchy Tree */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border shadow-xs space-y-6 min-h-[500px]">
            
            {/* Root Node: Corporate Unit */}
            <div className="flex flex-col items-center select-none">
              <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl border border-slate-700 flex items-center gap-3 shadow-md max-w-sm w-full">
                <div className="p-2.5 bg-slate-800 text-emerald-400 rounded-xl border border-slate-700 shrink-0">
                  <Building2 size={18} />
                </div>
                <div className="truncate">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold font-mono">Active Corporate Root</span>
                  <h4 className="font-extrabold text-sm text-slate-100 truncate">{activeCompany} Unit</h4>
                  <p className="text-[10px] text-slate-400 font-sans">{stats.totalStaff} Active Personnel • ₹{stats.totalPayroll.toLocaleString('en-IN')}/mo</p>
                </div>
              </div>

              {/* Connecting line down */}
              <div className="w-0.5 h-6 bg-slate-200" />
            </div>

            {/* Tree branches */}
            <div className="space-y-6">
              {filteredDepartments.map((dept, deptIdx) => {
                const hierarchy = deptHierarchies[dept];
                const isExpanded = expandedNodes[dept];
                const staffCount = hierarchy.team.length + (hierarchy.hod ? 1 : 0);
                const deptTotalPay = (hierarchy.hod ? hierarchy.hod.base_salary : 0) + hierarchy.team.reduce((sum, e) => sum + e.base_salary, 0);

                if (!hierarchy.hod) return null;

                return (
                  <div key={dept} className="relative pl-6 md:pl-12 border-l-2 border-slate-100">
                    
                    {/* Horizontal connector from parent line to HOD */}
                    <div className="absolute left-0 top-6 w-6 md:w-12 h-0.5 bg-slate-200" />
                    
                    {/* Department Header Badge */}
                    <div className="mb-3 flex items-center gap-2 select-none">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase tracking-wider font-mono">
                        {dept} Department
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ({staffCount} Staff • ₹{deptTotalPay.toLocaleString('en-IN')}/mo)
                      </span>
                    </div>

                    {/* HOD Card Node */}
                    <div className="flex items-start gap-4">
                      
                      {/* Left icon marker line */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-emerald-600 shadow-xs shrink-0 select-none">
                          <Briefcase size={16} className="text-emerald-700" />
                        </div>
                        {isExpanded && hierarchy.team.length > 0 && (
                          <div className="absolute left-5 top-10 w-0.5 h-6 bg-slate-200" />
                        )}
                      </div>

                      <div className="bg-emerald-50/20 hover:bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/80 flex-1 max-w-lg transition flex justify-between items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-sm text-slate-800">{hierarchy.hod.name}</h5>
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded font-mono uppercase tracking-wide">
                              HOD
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">{hierarchy.hod.designation}</p>
                          <span className="text-[10px] text-gray-400 font-mono font-medium block mt-1">ID: {hierarchy.hod.id} • Base Wage: ₹{hierarchy.hod.base_salary.toLocaleString('en-IN')}/mo</span>
                        </div>

                        {hierarchy.team.length > 0 && (
                          <button
                            onClick={() => toggleNode(dept)}
                            className="p-1 bg-white hover:bg-emerald-100 rounded-xl border border-emerald-100 text-emerald-800 transition cursor-pointer select-none"
                            title={isExpanded ? "Collapse reporting staff" : "Expand reporting staff"}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reporting Team Members Nodes */}
                    <AnimatePresence>
                      {isExpanded && hierarchy.team.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pl-6 md:pl-10 border-l-2 border-dashed border-slate-200 space-y-3 overflow-hidden"
                        >
                          {hierarchy.team.map((emp, empIdx) => (
                            <div key={emp.id} className="relative flex items-start gap-3">
                              
                              {/* Connector horizontal thread */}
                              <div className="absolute -left-6 md:-left-10 top-5 w-6 md:w-10 h-0.5 bg-slate-200" />

                              <div className="w-8 h-8 rounded-xl bg-slate-50 border flex items-center justify-center shrink-0 select-none">
                                <Users size={12} className="text-slate-500" />
                              </div>

                              <div className="bg-white hover:bg-slate-50/60 p-3 rounded-xl border flex-1 max-w-md transition flex items-center justify-between gap-3 shadow-xs">
                                <div>
                                  <h6 className="font-bold text-xs text-slate-800">{emp.name}</h6>
                                  <p className="text-[11px] text-slate-500">{emp.designation}</p>
                                  <div className="flex gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                                    <span>ID: {emp.id}</span>
                                    <span>•</span>
                                    <span>Wage: ₹{emp.base_salary.toLocaleString('en-IN')}</span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0 select-none">
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded uppercase">
                                    Staff
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })}

              {filteredDepartments.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-gray-150 rounded-2xl text-gray-400 text-xs">
                  No organization hierarchy nodes match your search query. Try another term.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
