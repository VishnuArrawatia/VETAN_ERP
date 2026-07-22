/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSpreadsheet, X, Upload, CheckCircle, AlertCircle, FileText, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  activeCompany: string;
}

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess, activeCompany }: ExcelImportModalProps) {
  const [csvText, setCsvText] = useState(
`Employee Code,Name,Designation,Department,Reporting Manager,Reporting HOD,Date of Joining,Date of Leaving,Base Salary,HRA,Con All,Child All,Medical All,Special All,Dearnes All,CTC,Bonus Payable,Phone,Birth Year,Qualification,Location,Vehicle Detail,Previous Company Name,Previous Company Location,Total Experience,Employee Category
"EMP001","Pranav Garg","Design Engineer","Engineering","Management","Amit Sharma","2024-04-01","",45000,18000,1600,200,1250,6750,4500,75000,3000,"9922334455",1994,"B.Tech (Electrical)","Sakar Corporate Tower, Alkapuri","GJ-06-HM-1234","L&T Heavy Engineering","Vadodara","4 Years","Staff"
"EMP002","Ritu Saxena","Operations Executive","Operations","Pranav Garg","Amit Sharma","2023-08-15","",25000,10000,1600,0,1250,3750,2500,45000,0,"9811223344",1991,"MBA in HR","SVN II Campus, Halol","GJ-17-CD-4321","TCS Limited","Gandhinagar","5 Years","Staff"
"WRK001","Ramesh Kumar","Helper","Production","Pranav Garg","Amit Sharma","2025-01-10","",18000,7200,0,0,0,1800,1800,28800,1500,"9876543210",1996,"10th Pass","Sakar-I Plant, Vapi","","None","","1 Year","Worker"`
  );

  const downloadTemplateCsv = () => {
    const csvContent = "Employee Code,Name,Designation,Department,Reporting Manager,Reporting HOD,Date of Joining,Date of Leaving,Base Salary,HRA,Con All,Child All,Medical All,Special All,Dearnes All,CTC,Bonus Payable,Phone,Birth Year,Qualification,Location,Vehicle Detail,Previous Company Name,Previous Company Location,Total Experience,Employee Category\n"
      + '"EMP001","Pranav Garg","Design Engineer","Engineering","Management","Amit Sharma","2024-04-01","",45000,18000,1600,200,1250,6750,4500,75000,3000,"9922334455",1994,"B.Tech (Electrical)","Sakar Corporate Tower, Alkapuri","GJ-06-HM-1234","L&T Heavy Engineering","Vadodara","4 Years","Staff"\n'
      + '"EMP002","Ritu Saxena","Operations Executive","Operations","Pranav Garg","Amit Sharma","2023-08-15","",25000,10000,1600,0,1250,3750,2500,45000,0,"9811223344",1991,"MBA in HR","SVN II Campus, Halol","GJ-17-CD-4321","TCS Limited","Gandhinagar","5 Years","Staff"\n'
      + '"WRK001","Ramesh Kumar","Helper","Production","Pranav Garg","Amit Sharma","2025-01-10","",18000,7200,0,0,0,1800,1800,28800,1500,"9876543210",1996,"10th Pass","Sakar-I Plant, Vapi","","None","","1 Year","Worker"';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sakar_Employee_Bulk_Import_Template_${activeCompany}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFileName(file.name);
    setErrorMsg('');
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    const reader = new FileReader();
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (data) {
            const arr = new Uint8Array(data as ArrayBuffer);
            const workbook = XLSX.read(arr, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            // Convert sheet to CSV text
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            setCsvText(csv);
          }
        } catch (err: any) {
          setErrorMsg('Error parsing Excel file: ' + err.message);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Error reading the selected Excel file');
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Treat as standard CSV or TXT text
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setCsvText(event.target.result);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Error reading the selected CSV/text file');
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setReport('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/excel/import/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, companyFilter: activeCompany })
      });
      const data = await res.json();
      if (data.success) {
        setReport(`Successfully registered and imported ${data.count} new employee profiles into Unit ${activeCompany}!`);
        onImportSuccess();
        setTimeout(() => {
          onClose();
          setReport('');
          setSelectedFileName('');
        }, 3000);
      } else {
        setErrorMsg(data.error || 'Syntax anomaly captured on parsing.');
      }
    } catch (err: any) {
      setErrorMsg('Exception triggers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="bg-slate-900 p-4.5 text-white flex justify-between items-center text-sm font-sans select-none">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400" size={16} />
                <span className="font-semibold font-display">Unit-wise Salary Master Excel/CSV Upload</span>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Direct Template Download Link */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">Download Official Excel Template Format</span>
                  <p className="text-[10px] text-gray-500">Includes advanced Columns: Date of Joining, HRA, Conveyance, Child All, Medical, Special, DA, CTC and Bonus.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplateCsv}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-lg tracking-wide transition shrink-0 select-none cursor-pointer flex items-center gap-1"
                >
                  📥 Download CSV Format
                </button>
              </div>

              {/* File Upload Drag & Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition select-none flex flex-col items-center justify-center gap-2 ${
                  dragActive ? 'border-emerald-600 bg-emerald-50/55' : 'border-gray-200 hover:border-emerald-500 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt,.xlsx,.xls"
                  className="hidden" 
                />
                <div className="p-2.5 bg-emerald-100 rounded-full text-emerald-700">
                  <Upload size={18} />
                </div>
                {selectedFileName ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                      <FileText size={14} className="text-emerald-600" />
                      {selectedFileName}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">Click or drag another Excel/CSV file to replace</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-700">Drag & Drop your Salary Master Excel or CSV here</p>
                    <p className="text-[10px] text-gray-400">or click to browse your computer (Excel .xlsx, .xls, .csv, or .txt)</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                <span>OR PASTE VALUES DIRECTLY FROM EXCEL/SPREADSHEET</span>
                <span className="flex items-center gap-0.5 text-emerald-600">
                  <Sparkles size={10} />
                  Excel Compatible
                </span>
              </div>

              <div className="space-y-1">
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  required
                  rows={5}
                  className="w-full text-[11px] font-mono p-3 border rounded-xl focus:outline-none focus:border-slate-800 resize-y"
                  placeholder="Name,Designation,Department,Base Salary,Phone..."
                />
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 leading-relaxed font-sans bg-gray-50 p-3 rounded-xl border select-none">
                <span className="font-bold text-emerald-800 block text-[10px] uppercase tracking-wide">💡 Supported Excel Columns Checklist:</span>
                <p className="text-[9px] text-emerald-700 font-semibold mb-2">Note: Monthly CTC is locked & auto-calculated dynamically by the system engine during import using standard formulas (manual CTC columns are ignored).</p>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 font-mono">
                  <div className="text-emerald-800 font-bold">• Employee Code (Mandatory Key)</div>
                  <div>• Name (Mandatory)</div>
                  <div>• Designation (Mandatory)</div>
                  <div>• Department (Mandatory)</div>
                  <div>• Employee Category (Staff or Worker)</div>
                  <div>• Date of Joining (YYYY-MM-DD)</div>
                  <div>• Date of Leaving (YYYY-MM-DD)</div>
                  <div>• Base Salary (Monthly)</div>
                  <div>• HRA (House Rent)</div>
                  <div>• Con All (Conveyance)</div>
                  <div>• Child All (Education)</div>
                  <div>• Medical All (Medical)</div>
                  <div>• Special All (Special)</div>
                  <div>• Dearnes All (Dearness / DA)</div>
                  <div>• Bonus Payable</div>
                  <div>• Phone / Birth Year</div>
                </div>
              </div>

              {report && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2 font-sans">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {report}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg flex items-center gap-2 font-mono">
                  <AlertCircle size={14} className="text-rose-500" />
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3.5 border-t pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border text-xs text-gray-500 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-semibold rounded-xl transition cursor-pointer shadow-sm"
                >
                  <Upload size={13} />
                  {loading ? 'Importing...' : `Import into Unit ${activeCompany}`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
