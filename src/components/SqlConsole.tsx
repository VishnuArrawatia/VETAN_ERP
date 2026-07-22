/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  Terminal, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  Clock 
} from 'lucide-react';
import { SQLResult } from '../types';

export default function SqlConsole() {
  const [query, setQuery] = useState("SELECT id, name, company, designation, base_salary, leave_balance_pl FROM employees;");
  const [result, setResult] = useState<SQLResult | null>(null);
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    {
      label: 'Get SVN-1 Staff',
      sql: "SELECT id, name, designation, base_salary FROM employees WHERE company = 'SVN-1';"
    },
    {
      label: 'Check High Wages',
      sql: "SELECT id, name, company, base_salary FROM employees WHERE base_salary > 30000 ORDER BY base_salary DESC;"
    },
    {
      label: 'Audit Attendance Logs',
      sql: "SELECT employee_id, month, working_days, lop_days FROM attendance WHERE lop_days > 0;"
    },
    {
      label: 'See Leaves Pending',
      sql: "SELECT id, employee_name, leave_type, days, status FROM leave_applications WHERE status = 'PENDING';"
    }
  ];

  const handleRunQuery = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/sql/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: query })
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({
        success: false,
        error: `Network Exception: ${e.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 font-display text-sm tracking-tight flex items-center gap-1.5">
            <Database size={16} className="text-emerald-500" />
            Live Relational SQL Query Console (Read-Only)
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">Direct raw queries against standard SQL tables to audit compliance and statutory registers instantly.</p>
        </div>
        <div className="flex gap-2">
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(q.sql)}
              className="px-2.5 py-1 text-[10px] border border-gray-100 hover:border-emerald-500 bg-gray-50/50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition rounded font-mono font-bold cursor-pointer"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compiler input frame */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SQL Entry */}
        <div className="lg:col-span-3 bg-slate-900 rounded-2xl p-4 shadow-sm flex flex-col space-y-4">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" />
              <span className="font-mono text-emerald-400 font-bold">query_compiler.sql</span>
            </div>
            <span>v1.0 (Relational SQLite Schema)</span>
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-32 bg-slate-950 font-mono text-xs text-emerald-300 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
            placeholder="SELECT * FROM table_name;"
          />

          <div className="flex justify-end">
            <button
              id="btn-run-query"
              onClick={handleRunQuery}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold rounded-xl transition cursor-pointer shadow-sm select-none"
            >
              <Play size={12} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Executing relational scan...' : 'Run Query File'}
            </button>
          </div>
        </div>

        {/* Database Quick Scheme */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h4 className="text-xs font-bold font-display text-gray-500 uppercase tracking-widest pb-1 border-b">Active Ledger Tables</h4>
          <div className="space-y-3 text-[11px] font-mono leading-relaxed">
            <div>
              <span className="font-bold text-gray-800">employees</span>
              <p className="text-gray-400 font-sans text-xs">id, name, company, designation, base_salary, status, leave_balance_pl/cl/sl</p>
            </div>
            <div>
              <span className="font-bold text-gray-800">attendance</span>
              <p className="text-gray-400 font-sans text-xs">id, employee_id, month, working_days, lop_days, overtime_hours</p>
            </div>
            <div>
              <span className="font-bold text-gray-800">leave_applications</span>
              <p className="text-gray-400 font-sans text-xs">id, employee_id, leave_type, days, reason, status</p>
            </div>
            <div>
              <span className="font-bold text-gray-800">ff_settlements</span>
              <p className="text-gray-400 font-sans text-xs">id, employee_id, last_working_day, net_settlement_pay, status</p>
            </div>
          </div>
        </div>

      </div>

      {/* Query Exec Outputs visual log */}
      {result && (
        <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-50 text-gray-400">
            <div className="flex items-center gap-1.5 font-bold">
              {result.success ? (
                <>
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-emerald-700">Database scan completed with success status</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-rose-500" />
                  <span className="text-rose-700">Scan failed to complete execution</span>
                </>
              )}
            </div>

            {result.queryTimeMs !== undefined && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Execution time: {result.queryTimeMs} ms
              </span>
            )}
          </div>

          {!result.success ? (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-mono">
              {result.error}
            </div>
          ) : result.columns && result.rows ? (
            <div className="space-y-3">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Output records ({result.rows.length} rows returned)</span>
              
              <div className="overflow-x-auto max-h-[350px] border border-gray-100 rounded-xl">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b select-none font-bold text-slate-700">
                      {result.columns.map((c, i) => (
                        <th key={i} className="p-3">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-800 bg-white">
                    {result.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50/50">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="p-3 text-[11px]">
                            {cell === 'NULL' ? (
                              <span className="text-gray-300 italic">NULL</span>
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {result.rows.length === 0 && (
                      <tr>
                        <td colSpan={result.columns.length} className="text-center py-8 text-gray-300 italic">
                          Empirical schema contains empty tuples matching where clause.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 text-slate-600 rounded-lg text-xs">
              Statement processed successfully. Affected rows count: {result.affectedRows || 0}.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
