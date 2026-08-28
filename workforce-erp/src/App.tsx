import { useState } from 'react';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarHeart, Banknote, Settings as SettingsIcon,
  Factory, Building2, LogOut
} from 'lucide-react';
import { StoreProvider, useStore } from './lib/store';
import { MONTHS } from './lib/months';
import Dashboard from './components/Dashboard';
import Workers from './components/Workers';
import Attendance from './components/Attendance';
import Leave from './components/Leave';
import Payroll from './components/Payroll';
import Settings from './components/Settings';

type View = 'dashboard' | 'workers' | 'attendance' | 'leave' | 'payroll' | 'settings';

const NAV: { id: View; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'workers', label: 'Workers', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'leave', label: 'Leave Ledger', icon: CalendarHeart },
  { id: 'payroll', label: 'Payroll', icon: Banknote },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

function Shell() {
  const [view, setView] = useState<View>('dashboard');
  const [monthKey, setMonthKey] = useState<string>('2026-07');
  const { state, set, reset } = useStore();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-300 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-800">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">W</div>
          <div>
            <div className="text-white font-bold leading-tight">Workforce ERP</div>
            <div className="text-[11px] text-slate-400">HR Portal</div>
          </div>
        </div>
        <div className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Main</div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const active = view === n.id;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Icon size={17} />
                {n.label}
                {n.id === 'workers' && (
                  <span className="ml-auto text-[11px] font-bold bg-slate-700/60 text-slate-300 rounded-full px-1.5 py-0.5">
                    {state.workers.filter((w) => w.active).length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={14} className="text-slate-500" />
            <span className="text-xs text-slate-400">
              {state.units.length} Units · {state.companies.length} Companies
            </span>
          </div>
          <button
            onClick={() => {
              if (confirm('Reset all data to the original seed?')) reset();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={13} /> Reset Demo Data
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm">
            <Factory size={16} className="text-indigo-600" />
            <span className="font-semibold text-slate-700">Workforce Management</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 capitalize">{view}</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {MONTHS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">HR</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {view === 'dashboard' && <Dashboard monthKey={monthKey} />}
          {view === 'workers' && <Workers />}
          {view === 'attendance' && <Attendance monthKey={monthKey} />}
          {view === 'leave' && <Leave />}
          {view === 'payroll' && <Payroll monthKey={monthKey} />}
          {view === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}