import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface Props {
  employees: any[];
  activeCompany: string;
  onSuccess: () => void;
}

interface ParsedRow {
  employee_code: string;
  employee_name: string;
  current_special: number;
  new_special: number;
  effective_month: string;
  error?: string;
}

export default function BulkSalaryRevisionUpload({ employees, activeCompany, onSuccess }: Props) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['Employee_Code', 'New_Special_Allowance', 'Effective_Month'];
    const sampleRows = employees.slice(0, 3).map(e => {
      const current = e.special_allowance || 0;
      return [e.id, current + 2000, '2026-05'].join(',');
    });
    const csv = [headers.join(','), ...sampleRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Salary_Revision_Template_${activeCompany}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse uploaded CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setResult({ success: 0, failed: 0, errors: ['CSV file is empty or has no data rows'] });
        return;
      }

      // Parse header
      const header = lines[0].toLowerCase().replace(/"/g, '').split(',').map(h => h.trim());
      const codeIdx = header.findIndex(h => h.includes('employee_code') || h.includes('code'));
      const specialIdx = header.findIndex(h => h.includes('special'));
      const monthIdx = header.findIndex(h => h.includes('effective') || h.includes('month'));

      if (codeIdx === -1 || specialIdx === -1 || monthIdx === -1) {
        setResult({ success: 0, failed: 0, errors: ['CSV must have columns: Employee_Code, New_Special_Allowance, Effective_Month'] });
        return;
      }

      const rows: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
        const code = cols[codeIdx];
        const newSpecial = parseInt(cols[specialIdx]);
        const month = cols[monthIdx];

        const emp = employees.find(e => e.id === code);
        if (!emp) {
          rows.push({ employee_code: code, employee_name: 'NOT FOUND', current_special: 0, new_special: newSpecial, effective_month: month, error: `Employee ${code} not found in system` });
        } else if (isNaN(newSpecial) || newSpecial < 0) {
          rows.push({ employee_code: code, employee_name: emp.name, current_special: emp.special_allowance || 0, new_special: 0, effective_month: month, error: 'Invalid Special Allowance amount' });
        } else if (!/^\d{4}-\d{2}$/.test(month)) {
          rows.push({ employee_code: code, employee_name: emp.name, current_special: emp.special_allowance || 0, new_special: newSpecial, effective_month: month, error: 'Invalid month format (use YYYY-MM)' });
        } else {
          rows.push({ employee_code: code, employee_name: emp.name, current_special: emp.special_allowance || 0, new_special: newSpecial, effective_month: month });
        }
      }
      setParsedRows(rows);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Apply bulk revisions
  const applyRevisions = async () => {
    const validRows = parsedRows.filter(r => !r.error);
    if (validRows.length === 0) return;

    setUploading(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of validRows) {
      try {
        const payload = {
          employee_code: row.employee_code,
          new_salary: row.new_special,
          effective_date: `${row.effective_month}-01`,
          reason: 'Special Allowance Revision',
          approved_by: 'Group HR Director',
          revision_type: 'SPECIAL_ALLOWANCE',
          new_special_allowance: row.new_special
        };
        const res = await fetch('/api/salary-revisions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) success++;
        else {
          const data = await res.json();
          failed++;
          errors.push(`${row.employee_code}: ${data.error}`);
        }
      } catch (e: any) {
        failed++;
        errors.push(`${row.employee_code}: ${e.message}`);
      }
    }

    setResult({ success, failed, errors });
    if (success > 0) {
      setParsedRows([]);
      onSuccess();
    }
    setUploading(false);
  };

  const validCount = parsedRows.filter(r => !r.error).length;
  const errorCount = parsedRows.filter(r => r.error).length;

  return (
    <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-indigo-50/30 to-white space-y-4">
      <div className="flex items-center gap-2">
        <Upload size={16} className="text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-800">Bulk Salary Revision (CSV Upload)</h3>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Upload a CSV file to update <strong>Special Allowance</strong> for multiple employees at once.
        Only Special Allowance will change — Basic, HRA, Edu, Medical, Conveyance remain the same.
      </p>

      {/* Template download */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <Download size={12} /> Download CSV Template
        </button>
        <label className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer">
          <FileText size={12} /> Upload Filled CSV
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* CSV Format hint */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-600">
        <strong>CSV Format:</strong>
        <code className="block mt-1 font-mono bg-white p-2 rounded border border-slate-100">
          Employee_Code,New_Special_Allowance,Effective_Month<br />
          SK1ST0001,15000,2026-05<br />
          SK1ST0006,10000,2026-07
        </code>
      </div>

      {/* Preview table */}
      {parsedRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-600">
              Preview: {validCount} valid, {errorCount} errors
            </h4>
            <button
              onClick={applyRevisions}
              disabled={uploading || validCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <TrendingUp size={12} />
              {uploading ? 'Applying...' : `Apply ${validCount} Revisions`}
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-80 overflow-y-auto">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="p-2 font-bold text-slate-500">#</th>
                  <th className="p-2 font-bold text-slate-500">Code</th>
                  <th className="p-2 font-bold text-slate-500">Name</th>
                  <th className="p-2 font-bold text-slate-500 text-right">Current Special</th>
                  <th className="p-2 font-bold text-slate-500 text-right">New Special</th>
                  <th className="p-2 font-bold text-slate-500 text-right">Change</th>
                  <th className="p-2 font-bold text-slate-500">Month</th>
                  <th className="p-2 font-bold text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => (
                  <tr key={i} className={row.error ? 'bg-red-50' : 'bg-white hover:bg-green-50'}>
                    <td className="p-2 text-slate-400">{i + 1}</td>
                    <td className="p-2 font-mono font-bold text-slate-800">{row.employee_code}</td>
                    <td className="p-2 text-slate-700">{row.employee_name}</td>
                    <td className="p-2 text-right font-mono">₹{row.current_special.toLocaleString('en-IN')}</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-700">₹{row.new_special.toLocaleString('en-IN')}</td>
                    <td className={`p-2 text-right font-mono font-bold ${row.new_special > row.current_special ? 'text-emerald-600' : row.new_special < row.current_special ? 'text-rose-600' : 'text-slate-400'}`}>
                      {row.new_special > row.current_special ? '+' : ''}{(row.new_special - row.current_special).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 font-mono text-slate-600">{row.effective_month}</td>
                    <td className="p-2">
                      {row.error ? (
                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle size={10} /> {row.error}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle size={10} /> Ready
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`p-3 rounded-xl text-xs font-bold ${result.failed > 0 ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
          ✅ {result.success} revisions applied successfully
          {result.failed > 0 && <> | ❌ {result.failed} failed</>}
          {result.errors.length > 0 && (
            <ul className="mt-2 text-[10px] font-normal list-disc list-inside">
              {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
