/**
 * Accounting Sheets — Monthly Salary Export for Finance Team
 * 
 * SHEETS AVAILABLE:
 * 1. Bank Transfer Sheet — For salary credit to employee accounts
 * 2. Head-wise Sheet — For accounting entries (Basic, HRA, PF, ESIC, etc.)
 * 3. Unit-wise Summary — For management reporting
 */

import React, { useState } from 'react';
import { 
  Download, FileSpreadsheet, Building2, Calculator, 
  CheckCircle, ArrowDownToLine 
} from 'lucide-react';

interface AccountingSheetsProps {
  activeMonth: string;
  activeCompany: string;
}

export default function AccountingSheets({ activeMonth, activeCompany }: AccountingSheetsProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const sheets = [
    {
      id: 'bank',
      name: 'Bank Transfer Sheet',
      description: 'Employee Name, Bank Account, IFSC, Net Salary — for salary credit',
      icon: <Building2 size={24} />,
      color: 'blue',
      endpoint: `/api/accounting/bank-sheet/${activeMonth}?company=${activeCompany}`,
      filename: `Bank_Sheet_${activeMonth}_${activeCompany}.csv`
    },
    {
      id: 'headwise',
      name: 'Head-wise Accounting Sheet',
      description: 'Basic, HRA, DA, PF, ESIC, Loan, Bonus — for ledger entries',
      icon: <Calculator size={24} />,
      color: 'emerald',
      endpoint: `/api/accounting/head-wise/${activeMonth}?company=${activeCompany}`,
      filename: `Head_Wise_${activeMonth}_${activeCompany}.csv`
    },
    {
      id: 'summary',
      name: 'Unit-wise Summary',
      description: 'SVN-I, SVN-II, Sakar-I, Sakar-III — total gross, deductions, net',
      icon: <FileSpreadsheet size={24} />,
      color: 'purple',
      endpoint: `/api/accounting/unit-summary/${activeMonth}`,
      filename: `Unit_Summary_${activeMonth}.json`
    }
  ];

  const handleDownload = async (sheet: typeof sheets[0]) => {
    setDownloading(sheet.id);
    try {
      const response = await fetch(sheet.endpoint);
      if (!response.ok) throw new Error('No data found');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sheet.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      alert('Error downloading: ' + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Accounting Sheets</h2>
            <p className="text-sm text-gray-500">
              Download salary sheets for {new Date(`${activeMonth}-02`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} — {activeCompany}
            </p>
          </div>
        </div>
      </div>

      {/* Sheet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sheets.map((sheet) => (
          <div 
            key={sheet.id}
            className={`bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg cursor-pointer ${colorClasses[sheet.color]}`}
            onClick={() => handleDownload(sheet)}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${colorClasses[sheet.color]}`}>
                {sheet.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{sheet.name}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{sheet.description}</p>
              </div>
            </div>
            
            <button
              disabled={downloading === sheet.id}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                downloading === sheet.id 
                  ? 'bg-gray-100 text-gray-400' 
                  : `${colorClasses[sheet.color]} font-bold`
              }`}
            >
              {downloading === sheet.id ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Downloading...
                </>
              ) : (
                <>
                  <ArrowDownToLine size={16} />
                  Download CSV
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-amber-900 mb-2">📋 Sheet Details:</h4>
        <ul className="text-xs text-amber-800 space-y-1">
          <li><strong>Bank Sheet:</strong> Employee Name, Bank Account, IFSC, Net Salary — for bank salary upload</li>
          <li><strong>Head-wise:</strong> Basic, HRA, DA, PF, ESIC, Loan, Bonus — for accounting ledger entries</li>
          <li><strong>Unit Summary:</strong> SVN-I, SVN-II, Sakar-I, Sakar-III — total gross, deductions, net</li>
        </ul>
      </div>
    </div>
  );
}
