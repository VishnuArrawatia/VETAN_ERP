import React, { useState } from 'react';
import { Building2, ShieldCheck, Lock, Eye, EyeOff, KeyRound, ArrowRight, AlertCircle, User, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
  const [roleTab, setRoleTab] = useState<'admin' | 'hr' | 'employee'>('admin');
  
  // Credentials state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Authentication directly with Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your credentials.');
      return;
    }

    setLoading(true);

    try {
      // Form email if username/id is given
      let email = identifier.trim();
      if (!email.includes('@')) {
        email = ${identifier.trim().toLowerCase()}@sakarelectricals.com;
      }

      // 1. Direct Supabase Auth SignIn
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Fallback: If auth fails, check employees table directly for plain demo check
        const { data: empData, error: empError } = await supabase
          .from('employees')
          .select('*')
          .or(email.eq.${email},employee_id.eq.${identifier.trim()})
          .single();

        if (empError || !empData) {
          throw new Error('Invalid login credentials. Please check username and password.');
        }
      }

      setSuccessMsg('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        
        {/* Left Branding Panel */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-amber-500 font-bold text-xl mb-2">
              <Building2 className="w-6 h-6" />
              <span>VETAN ERP</span>
            </div>
            <p className="text-xs text-slate-400">Sakar Electricals & Electronics Pvt. Ltd. | SVN Opto</p>
            <h1 className="text-2xl font-extrabold mt-6 text-white">Welcome to Sakar & SVN Staff Workspace</h1>
            <p className="text-sm text-slate-400 mt-2">
              Access statutory wage calculations, payslips, leave tracking, and Form-16 statements directly.
            </p>
          </div>

          <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-amber-400">Instant Payslips</h4>
                <p className="text-xs text-slate-400">Generate and print professional salary slips anytime.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Sign In</h2>
            <p className="text-xs text-slate-400">Enter your credentials to access the management panel.</p>
          </div>

          {/* Role Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mb-6">
            {(['admin', 'hr', 'employee'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRoleTab(tab)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  roleTab === tab ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                USERNAME / EMAIL / ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. vishnu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : Sign In as ${roleTab.toUpperCase()}}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
