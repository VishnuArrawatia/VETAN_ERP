/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Unlock, 
  Download, 
  AlertCircle, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Search, 
  FileText, 
  Check,
  Edit2,
  RefreshCw,
  Info
} from 'lucide-react';
import { Employee, Attendance } from '../types';
import * as XLSX from 'xlsx';

interface AttendanceSheetProps {
  employees: Employee[];
  onFetchAttendance: (month: string) => Promise<Attendance[]>;
  onSaveAttendance: (records: Attendance[]) => Promise<boolean>;
  activeCompany: string;
  activeMonth: string;
}

type WorkflowStep = 'UPLOAD' | 'VALIDATION' | 'VERIFY' | 'LOCK';

interface ParsedRecord {
  Worker_Code: string;
  Employee_Name: string;
  Present: number;
  Absent: number;
  Weekly_Off: number;
  Paid_Holiday: number;
  Leave: number;
  LWP: number;
  OT_Hours: number;
  // Leave breakup columns
  Leave_PL: number;
  Leave_CL: number;
  Leave_SL: number;
  CompOff_Used: number;
  rowNum: number;
}

interface ValidationError {
  row: number;
  workerCode: string;
  employeeName: string;
  field: string;
  errorType: 'SUM_MISMATCH' | 'NEGATIVE_OT' | 'INVALID_CODE' | 'FORMAT_ERROR';
  message: string;
}

export default function AttendanceSheet({ 
  employees, 
  onFetchAttendance, 
  onSaveAttendance, 
  activeCompany, 
  activeMonth 
}: AttendanceSheetProps) {
  
  // State
  const [currentMonth, setCurrentMonth] = useState(activeMonth || '2026-05');
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('UPLOAD');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Upload and parsing states
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedAddEmployeeId, setSelectedAddEmployeeId] = useState('');
  
  // Database committed state for the active month
  const [dbAttendance, setDbAttendance] = useState<Attendance[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Find total days in month
  const getDaysInMonth = (ym: string) => {
    const year = parseInt(ym.split('-')[0]);
    const month = parseInt(ym.split('-')[1]);
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentMonth);

  // Load existing committed attendance
  const loadExistingAttendance = async (month: string) => {
    setLoading(true);
    try {
      const records = await onFetchAttendance(month);
      setDbAttendance(records);
      
      // Determine lock state from records or standard database markers
      const locked = records.length > 0 && records.every(r => r.is_locked);
      setIsLocked(locked);
      
      // CRITICAL FIX: Show ALL employees for the unit — even those without attendance records.
      // Employees without records get 'NOT MARKED' status (present=0, absent=0, etc.)
      // This prevents the old bug where auto-creating 'Present' records polluted the database.
      const empRecordMap = new Map<string, any>();
      for (const r of records) {
        empRecordMap.set(r.employee_id, r);
      }
      
      const mapped: ParsedRecord[] = employees.map((emp, index) => {
        const r = empRecordMap.get(emp.id);
        if (r) {
          // Employee HAS attendance record — use actual data
          return {
            Worker_Code: r.employee_id,
            Employee_Name: emp.name || 'Unknown',
            Present: r.present ?? (r.working_days - (r.leave ?? 0)),
            Absent: r.absent ?? 0,
            Weekly_Off: r.weekly_off ?? 4,
            Paid_Holiday: r.paid_holiday ?? 0,
            Leave: r.leave ?? 0,
            LWP: r.lwp ?? r.lop_days,
            OT_Hours: r.ot_hours ?? r.overtime_hours,
            Leave_PL: r.leave_pl ?? 0,
            Leave_CL: r.leave_cl ?? 0,
            Leave_SL: r.leave_sl ?? 0,
            CompOff_Used: r.compoff_used ?? 0,
            rowNum: index + 1
          };
        } else {
          // Employee has NO attendance record — show as NOT MARKED (all zeros)
          return {
            Worker_Code: emp.id,
            Employee_Name: emp.name || 'Unknown',
            Present: 0,
            Absent: 0,
            Weekly_Off: 0,
            Paid_Holiday: 0,
            Leave: 0,
            LWP: 0,
            OT_Hours: 0,
            Leave_PL: 0,
            Leave_CL: 0,
            Leave_SL: 0,
            CompOff_Used: 0,
            rowNum: index + 1
          };
        }
      });
      setParsedRecords(mapped);
      setCurrentStep(locked ? 'LOCK' : 'VERIFY');
    } catch (e) {
      console.error('Error loading attendance:', e);
      setErrorMsg('Failed to fetch existing attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeMonth) {
      setCurrentMonth(activeMonth);
    }
  }, [activeMonth]);

  useEffect(() => {
    loadExistingAttendance(currentMonth);
  }, [currentMonth, activeCompany]);

  // Handle Month Navigation
  const handleMonthShift = (direction: 'PREV' | 'NEXT') => {
    const parse = currentMonth.split('-');
    let year = parseInt(parse[0]);
    let month = parseInt(parse[1]);

    if (direction === 'PREV') {
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }
    } else {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
    setCurrentMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  // Generate Template
  const handleDownloadTemplate = () => {
    const targetEmployees = employees.filter(emp => 
      emp.status === 'ACTIVE' && 
      (activeCompany === 'ALL' || activeCompany === 'GROUP' || activeCompany === 'COMBINED' || emp.company === activeCompany)
    );

    const headers = [
      'Emp.Code',
      'Name',
      'Present',
      'Absent',
      'W/O',
      'Paid Holy',
      'Leave',
      'LWP',
      'Leave_Utilised (PL)',
      'Leave_Utilised (CL)',
      'Leave_Utilised (SL)',
      'C-Off_Utilised'
    ];

    // Standard working calendar defaults for standard month: 26 present, 4 weekly off, 1 paid holiday
    const defaultPresent = Math.max(0, daysInMonth - 4 - 1);
    const defaultWeeklyOff = 4;
    const defaultPaidHoliday = 1;

    const csvRows = [headers.join(',')];

    for (const emp of targetEmployees) {
      const row = [
        emp.id,
        `"${emp.name.replace(/"/g, '""')}"`,
        defaultPresent,
        0,
        defaultWeeklyOff,
        defaultPaidHoliday,
        0,
        0,
        0,  // PL
        0,  // CL
        0,  // SL
        0   // C-Off
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const companyLabel = activeCompany ? activeCompany.replace(/\s+/g, '_') : 'Company';
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Attendance_${companyLabel}_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manual Attendance Entry handlers
  const handleInitializeManualEntry = () => {
    if (isLocked) {
      setErrorMsg('Attendance ledger is currently locked. Please unlock first to enter manually.');
      return;
    }
    
    // Get target employees
    const targetEmployees = employees.filter(emp => 
      emp.status === 'ACTIVE' && 
      (activeCompany === 'ALL' || activeCompany === 'GROUP' || activeCompany === 'COMBINED' || emp.company === activeCompany)
    );

    if (targetEmployees.length === 0) {
      setErrorMsg(`No active employees found for company ${activeCompany}.`);
      return;
    }

    // Default values
    const defaultPresent = Math.max(0, daysInMonth - 4 - 1);
    const defaultWeeklyOff = 4;
    const defaultPaidHoliday = 1;

    const mapped: ParsedRecord[] = targetEmployees.map((emp, index) => ({
      Worker_Code: emp.id,
      Employee_Name: emp.name,
      Present: defaultPresent,
      Absent: 0,
      Weekly_Off: defaultWeeklyOff,
      Paid_Holiday: defaultPaidHoliday,
      Leave: 0,
      LWP: 0,
      OT_Hours: 0,
      Leave_PL: 0,
      Leave_CL: 0,
      Leave_SL: 0,
      CompOff_Used: 0,
      rowNum: index + 1
    }));

    setParsedRecords(mapped);
    setValidationErrors([]);
    setUploadedFileName('Manual Entry');
    setCurrentStep('VERIFY');
  };

  const handleAddSingleEmployee = (empId: string) => {
    if (!empId) return;
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const defaultPresent = Math.max(0, daysInMonth - 4 - 1);
    const defaultWeeklyOff = 4;
    const defaultPaidHoliday = 1;

    const newRecord: ParsedRecord = {
      Worker_Code: emp.id,
      Employee_Name: emp.name,
      Present: defaultPresent,
      Absent: 0,
      Weekly_Off: defaultWeeklyOff,
      Paid_Holiday: defaultPaidHoliday,
      Leave: 0,
      LWP: 0,
      OT_Hours: 0,
      Leave_PL: 0,
      Leave_CL: 0,
      Leave_SL: 0,
      CompOff_Used: 0,
      rowNum: parsedRecords.length + 1
    };

    const nextRecords = [...parsedRecords, newRecord];
    setParsedRecords(nextRecords);
    setSelectedAddEmployeeId('');
    revalidateRecords(nextRecords);
  };

  const handleDeleteRow = (code: string) => {
    const next = parsedRecords.filter(r => r.Worker_Code !== code).map((r, i) => ({
      ...r,
      rowNum: i + 1
    }));
    setParsedRecords(next);
    revalidateRecords(next);
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Core File Parsing & Conversion
  const processFile = (file: File) => {
    if (isLocked) {
      setErrorMsg('Attendance ledger is currently locked. Please unlock first to upload new summaries.');
      return;
    }
    
    setUploadedFileName(file.name);
    setErrorMsg('');
    const reader = new FileReader();

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'csv') {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseCSVText(text);
      };
      reader.readAsText(file);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      reader.onload = (e) => {
        try {
          const bstr = e.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          parseSheetArray(jsonData as any[]);
        } catch (err: any) {
          setErrorMsg('Failed to parse Excel file: ' + err.message);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setErrorMsg('Invalid file format. Please upload a standard CSV or Excel (.xlsx/.xls) file.');
    }
  };

  // Parse Raw CSV text
  const parseCSVText = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) {
      setErrorMsg('The uploaded file is empty.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
    const rawRows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Regex to split CSV lines while ignoring commas inside quotes
      const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const cleanRow = matches.map(val => val.replace(/^["']|["']$/g, '').trim());
      
      const rowObj: any = {};
      headers.forEach((header, index) => {
        rowObj[header] = cleanRow[index] || '';
      });
      rawRows.push(rowObj);
    }

    convertAndValidateRawRows(rawRows);
  };

  // Parse Excel raw 2D array
  const parseSheetArray = (rows: any[][]) => {
    if (rows.length === 0) {
      setErrorMsg('The Excel sheet is empty.');
      return;
    }

    const headers = rows[0].map(h => String(h).trim());
    const rawRows: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || row.every(val => val === null || val === '')) continue;
      
      const rowObj: any = {};
      headers.forEach((header, index) => {
        rowObj[header] = row[index] !== undefined ? row[index] : '';
      });
      rawRows.push(rowObj);
    }

    convertAndValidateRawRows(rawRows);
  };

  // Normalize column names and validate records
  const convertAndValidateRawRows = (rawRows: any[]) => {
    const standardized: ParsedRecord[] = [];
    const errors: ValidationError[] = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // Offset for header row (1-indexed)
      
      // Map keys to find matches despite minor capitalizations or whitespace differences
      const findVal = (possibleKeys: string[], defaultVal: any) => {
        for (const pk of possibleKeys) {
          const match = Object.keys(row).find(k => k.trim().toLowerCase() === pk.toLowerCase());
          if (match !== undefined && row[match] !== '') return row[match];
        }
        return defaultVal;
      };

      const code = String(findVal(['Worker_Code', 'Worker Code', 'Employee_ID', 'Employee ID', 'Code', 'Emp.Code', 'Emp Code'], '')).trim();
      const name = String(findVal(['Employee_Name', 'Employee Name', 'Name', 'Name of Employee'], '')).trim();
      
      const present = parseFloat(findVal(['Present', 'P', 'PRESENT'], '0')) || 0;
      const absent = parseFloat(findVal(['Absent', 'A', 'ABSENT'], '0')) || 0;
      const weeklyOff = parseFloat(findVal(['Weekly_Off', 'Weekly Off', 'WO', 'W/O', 'Week Off', 'WEEK Off'], '0')) || 0;
      const paidHoliday = parseFloat(findVal(['Paid_Holiday', 'Paid Holiday', 'PH', 'Paid Holy', 'Paid Holy Days'], '0')) || 0;
      const leave = parseFloat(findVal(['Leave', 'L', 'Leave Total'], '0')) || 0;
      const lwp = parseFloat(findVal(['LWP', 'LOP'], '0')) || 0;
      const otHours = parseFloat(findVal(['OT_Hours', 'OT Hours', 'Overtime', 'OT'], '0')) || 0;
      
      // Leave breakup columns (PL, CL, SL, CompOff) — preserve decimals
      const leavePL = parseFloat(findVal(['Leave_Utilised (PL)', 'PL', 'USE PL', 'Use PL', 'leave_utilised_pl'], '0')) || 0;
      const leaveCL = parseFloat(findVal(['Leave_Utilised (CL)', 'CL', 'leave_utilised_cl'], '0')) || 0;
      const leaveSL = parseFloat(findVal(['Leave_Utilised (SL)', 'SL', 'leave_utilised_sl'], '0')) || 0;
      const compOffUsed = parseFloat(findVal(['C-Off_Utilised', 'C-Off', 'CompOff', 'CO', 'C OFF', 'Use C-O', 'c-off_utilised'], '0')) || 0;

      if (!code) {
        errors.push({
          row: rowNum,
          workerCode: 'N/A',
          employeeName: name || 'N/A',
          field: 'Worker_Code',
          errorType: 'FORMAT_ERROR',
          message: 'Employee Code is missing or blank.'
        });
        return;
      }

      // Check if Employee Code exists in employee master
      const matchedEmployee = employees.find(e => e.id.toLowerCase() === code.toLowerCase());
      
      if (!matchedEmployee) {
        errors.push({
          row: rowNum,
          workerCode: code,
          employeeName: name,
          field: 'Worker_Code',
          errorType: 'INVALID_CODE',
          message: `Employee Code '${code}' does not exist in the Employee Master.`
        });
      }

      // OT cannot be negative
      if (otHours < 0) {
        errors.push({
          row: rowNum,
          workerCode: code,
          employeeName: name || matchedEmployee?.name || 'N/A',
          field: 'OT_Hours',
          errorType: 'NEGATIVE_OT',
          message: `Overtime Hours (${otHours}) cannot be negative.`
        });
      }

      // Sum Validation Rule: Present + Absent + Weekly_Off + Paid_Holiday + Leave + LWP === Total Month Calendar Days
      // Use tolerance for decimal floating-point comparison
      const sum = present + absent + weeklyOff + paidHoliday + leave + lwp;
      if (Math.abs(sum - daysInMonth) > 0.01) {
        errors.push({
          row: rowNum,
          workerCode: code,
          employeeName: name || matchedEmployee?.name || 'N/A',
          field: 'Summary_Sum',
          errorType: 'SUM_MISMATCH',
          message: `Days sum mismatch. Present(${present}) + Absent(${absent}) + WeeklyOff(${weeklyOff}) + PaidHoliday(${paidHoliday}) + Leave(${leave}) + LWP(${lwp}) = ${sum} days. Expected exactly ${daysInMonth} days.`
        });
      }

      standardized.push({
        Worker_Code: code,
        Employee_Name: matchedEmployee?.name || name || 'Unknown',
        Present: present,
        Absent: absent,
        Weekly_Off: weeklyOff,
        Paid_Holiday: paidHoliday,
        Leave: leave,
        LWP: lwp,
        OT_Hours: otHours,
        Leave_PL: leavePL,
        Leave_CL: leaveCL,
        Leave_SL: leaveSL,
        CompOff_Used: compOffUsed,
        rowNum
      });
    });

    setParsedRecords(standardized);
    setValidationErrors(errors);
    setCurrentStep('VALIDATION');
  };

  // Inline value updates during HR Verification step
  const handleVerifyGridChange = (code: string, field: keyof ParsedRecord, valueStr: string) => {
    let value = parseFloat(valueStr) || 0;
    if (value < 0) value = 0;

    const updated = parsedRecords.map(rec => {
      if (rec.Worker_Code === code) {
        const next = { ...rec, [field]: value };
        return next;
      }
      return rec;
    });

    setParsedRecords(updated);
    
    // Re-run validation on the updated list
    revalidateRecords(updated);
  };

  const revalidateRecords = (records: ParsedRecord[]) => {
    const errors: ValidationError[] = [];

    records.forEach(rec => {
      const matchedEmployee = employees.find(e => e.id.toLowerCase() === rec.Worker_Code.toLowerCase());
      
      if (!matchedEmployee) {
        errors.push({
          row: rec.rowNum,
          workerCode: rec.Worker_Code,
          employeeName: rec.Employee_Name,
          field: 'Worker_Code',
          errorType: 'INVALID_CODE',
          message: `Employee Code '${rec.Worker_Code}' does not exist in Employee Master.`
        });
      }

      if (rec.OT_Hours < 0) {
        errors.push({
          row: rec.rowNum,
          workerCode: rec.Worker_Code,
          employeeName: rec.Employee_Name,
          field: 'OT_Hours',
          errorType: 'NEGATIVE_OT',
          message: `Overtime Hours (${rec.OT_Hours}) cannot be negative.`
        });
      }

      const sum = rec.Present + rec.Absent + rec.Weekly_Off + rec.Paid_Holiday + rec.Leave + rec.LWP;
      if (Math.abs(sum - daysInMonth) > 0.01) {
        errors.push({
          row: rec.rowNum,
          workerCode: rec.Worker_Code,
          employeeName: rec.Employee_Name,
          field: 'Summary_Sum',
          errorType: 'SUM_MISMATCH',
          message: `Days sum mismatch: Total sum is ${sum} days, expected exactly ${daysInMonth} days.`
        });
      }
    });

    setValidationErrors(errors);
  };

  // Save attendance WITHOUT locking — HR can edit later
  const handleSaveOnly = async () => {
    if (validationErrors.length > 0) {
      setErrorMsg('Cannot save attendance — please fix all validation errors first.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSuccess(false);
    try {
      const mappedPayload: Attendance[] = parsedRecords.map(rec => ({
        id: `ATT-${rec.Worker_Code}-${currentMonth}`,
        employee_id: rec.Worker_Code,
        month: currentMonth,
        total_days: daysInMonth,
        working_days: rec.Present + rec.Weekly_Off + rec.Paid_Holiday + rec.Leave,
        lop_days: rec.Absent + rec.LWP,
        overtime_hours: rec.OT_Hours,
        present: rec.Present,
        absent: rec.Absent,
        weekly_off: rec.Weekly_Off,
        paid_holiday: rec.Paid_Holiday,
        leave: rec.Leave,
        lwp: rec.LWP,
        ot_hours: rec.OT_Hours,
        leave_pl: rec.Leave_PL,
        leave_cl: rec.Leave_CL,
        leave_sl: rec.Leave_SL,
        compoff_used: rec.CompOff_Used,
        is_locked: false
      }));
      const res = await onSaveAttendance(mappedPayload);
      // Save leave utilization
      const leaveEntries = parsedRecords
        .filter(rec => (rec.Leave_PL + rec.Leave_CL + rec.Leave_SL + rec.CompOff_Used) > 0)
        .map(rec => ({
          employee_id: rec.Worker_Code,
          pl_days: rec.Leave_PL,
          cl_days: rec.Leave_CL,
          sl_days: rec.Leave_SL,
          compoff_days: rec.CompOff_Used
        }));
      if (leaveEntries.length > 0) {
        try {
          await fetch('/api/leave-utilization-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month: currentMonth, company: activeCompany, entries: leaveEntries })
          });
        } catch (e) { console.error('Leave utilization save error:', e); }
      }
      if (res) {
        setSuccess(true);
        loadExistingAttendance(currentMonth);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrorMsg('Failed to save attendance. Check if payroll is locked.');
      }
    } catch (err: any) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save the verification grid to server
  const handleCommitAttendance = async () => {      if (validationErrors.length > 0) {
      setErrorMsg('Cannot save attendance — please fix all validation errors first. Check the red highlighted rows below.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      // Convert our parsed format to standard Attendance model properties
      const mappedPayload: Attendance[] = parsedRecords.map(rec => ({
        id: `ATT-${rec.Worker_Code}-${currentMonth}`,
        employee_id: rec.Worker_Code,
        month: currentMonth,
        total_days: daysInMonth,
        working_days: rec.Present + rec.Weekly_Off + rec.Paid_Holiday + rec.Leave,
        lop_days: rec.Absent + rec.LWP,
        overtime_hours: rec.OT_Hours,
        
        // Save the detailed monthly breakdown
        present: rec.Present,
        absent: rec.Absent,
        weekly_off: rec.Weekly_Off,
        paid_holiday: rec.Paid_Holiday,
        leave: rec.Leave,
        lwp: rec.LWP,
        ot_hours: rec.OT_Hours,
        // Leave breakup
        leave_pl: rec.Leave_PL,
        leave_cl: rec.Leave_CL,
        leave_sl: rec.Leave_SL,
        compoff_used: rec.CompOff_Used,
        is_locked: isLocked
      }));

      const res = await onSaveAttendance(mappedPayload);
      
      // Also save leave utilization (I-L columns) to Leave Register
      const leaveEntries = parsedRecords
        .filter(rec => (rec.Leave_PL + rec.Leave_CL + rec.Leave_SL + rec.CompOff_Used) > 0)
        .map(rec => ({
          employee_id: rec.Worker_Code,
          pl_days: rec.Leave_PL,
          cl_days: rec.Leave_CL,
          sl_days: rec.Leave_SL,
          compoff_days: rec.CompOff_Used
        }));
      
      if (leaveEntries.length > 0) {
        try {
          await fetch('/api/leave-utilization-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              month: currentMonth,
              company: activeCompany,
              entries: leaveEntries
            })
          });
        } catch (e) {
          console.error('Leave utilization save error:', e);
        }
      }
      
      if (res) {
        setSuccess(true);
        loadExistingAttendance(currentMonth);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrorMsg(`❌ Cannot save attendance for ${new Date(currentMonth + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}. Possible reasons:\n\n1. Payroll is already LOCKED for this month — contact Super Admin to unlock\n2. Attendance was already FREEZED — you cannot edit after salary is processed\n3. Server error — try again or contact support`);
      }
    } catch (err: any) {
      setErrorMsg('Network error occurred: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Lock Attendance
  const handleLockToggle = async (lockValue: boolean) => {
    setSaving(true);
    try {
      const updatedPayload: Attendance[] = parsedRecords.map(rec => ({
        id: `ATT-${rec.Worker_Code}-${currentMonth}`,
        employee_id: rec.Worker_Code,
        month: currentMonth,
        total_days: daysInMonth,
        working_days: rec.Present + rec.Weekly_Off + rec.Paid_Holiday + rec.Leave,
        lop_days: rec.Absent + rec.LWP,
        overtime_hours: rec.OT_Hours,
        
        present: rec.Present,
        absent: rec.Absent,
        weekly_off: rec.Weekly_Off,
        paid_holiday: rec.Paid_Holiday,
        leave: rec.Leave,
        lwp: rec.LWP,
        ot_hours: rec.OT_Hours,
        is_locked: lockValue
      }));

      const res = await onSaveAttendance(updatedPayload);
      if (res) {
        setIsLocked(lockValue);
        setSuccess(true);
        loadExistingAttendance(currentMonth);
        
        // Log Audit securely
        await fetch('/api/audit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: lockValue ? 'Attendance Locked' : 'Attendance Unlocked',
            details: `${lockValue ? 'Locked' : 'Unlocked'} monthly attendance input summary ledger for ${currentMonth} (${activeCompany}). Total records: ${updatedPayload.length}.`
          })
        }).catch(() => {});

        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrorMsg(lockValue 
          ? `❌ Could not lock attendance for ${new Date(currentMonth + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}. Payroll may already be LOCKED — unlock payroll first.` 
          : '❌ Could not unlock attendance. Payroll is LOCKED for this month — unlock payroll first from Payroll Processor.');
      }
    } catch (err: any) {
      setErrorMsg('Error changing lock status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setUploadedFileName('');
    setParsedRecords([]);
    setValidationErrors([]);
    setCurrentStep('UPLOAD');
    setErrorMsg('');
  };

  // Filter verification list
  const filteredRecords = parsedRecords.filter(rec => 
    rec.Worker_Code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.Employee_Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Month & Company Selector Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Monthly Payroll Input Ledger</span>
            <div className="flex items-center gap-2 mt-0.5">
              <button 
                onClick={() => handleMonthShift('PREV')} 
                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-sm font-bold text-gray-800 flex items-center gap-1.5">
                {new Date(`${currentMonth}-02`).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
                {isLocked && (
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-bold rounded flex items-center gap-0.5">
                    <Lock size={8} /> LOCKED
                  </span>
                )}
                {!isLocked && parsedRecords.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-400 text-white text-[8px] font-bold rounded">
                    UNLOCKED
                  </span>
                )}
              </span>
              <button 
                onClick={() => handleMonthShift('NEXT')} 
                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
              
              <span className="ml-3 px-2 py-0.5 bg-gray-100 text-gray-600 font-mono text-[10px] rounded font-bold">
                {daysInMonth} Calendar Days
              </span>
            </div>
          </div>
        </div>

        {/* Workflow steps visualization */}
        <div className="flex items-center gap-1.5 md:gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
          {[
            { step: 'UPLOAD', label: '1. Upload' },
            { step: 'VALIDATION', label: '2. Validate' },
            { step: 'VERIFY', label: '3. Verify' },
            { step: 'LOCK', label: '4. Lock' }
          ].map((item, index) => {
            const stepsOrder: WorkflowStep[] = ['UPLOAD', 'VALIDATION', 'VERIFY', 'LOCK'];
            const currentIdx = stepsOrder.indexOf(currentStep);
            const itemIdx = stepsOrder.indexOf(item.step as WorkflowStep);
            
            let badgeStyle = 'text-gray-400 font-medium';
            if (item.step === currentStep) {
              badgeStyle = 'bg-emerald-600 text-white font-bold shadow-xs';
            } else if (itemIdx < currentIdx) {
              badgeStyle = 'text-emerald-700 font-semibold bg-emerald-50';
            }

            return (
              <React.Fragment key={item.step}>
                {index > 0 && <ChevronRight size={12} className="text-gray-300" />}
                <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-lg transition-all duration-200 ${badgeStyle}`}>
                  {item.label}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Lock Status Banner — Unit-wise GREEN LOCK */}
      {isLocked && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl"
        >
          <div className="flex items-center gap-5">
            {/* Big Green Lock Icon */}
            <div className="bg-white/20 p-4 rounded-2xl">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" fill="white"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="#22c55e"/>
                <path d="M12 17.5v2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">
                ✅ Attendance LOCKED for {activeCompany === 'GROUP' ? 'ALL UNITS' : activeCompany}!
              </h3>
              <p className="text-emerald-100 mt-1">
                {new Date(`${currentMonth}-02`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} — {parsedRecords.length} employees frozen for salary processing
              </p>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-lg">
                  📊 {parsedRecords.length} Records
                </span>
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-lg">
                  📝 Leave: {parsedRecords.filter(r => r.Leave_PL + r.Leave_CL + r.Leave_SL + r.CompOff_Used > 0).length} Updated
                </span>
                <span className="px-3 py-1 bg-white text-emerald-700 text-xs font-bold rounded-lg">
                  🔒 {activeCompany} LOCKED
                </span>
              </div>
            </div>
            <button
              onClick={() => handleLockToggle(false)}
              className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition cursor-pointer border border-white/30"
            >
              <Unlock size={16} className="inline mr-2" />
              Unlock
            </button>
          </div>
        </motion.div>
      )}

      {/* Success/Error Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-r from-emerald-500 to-green-500 p-6 rounded-2xl shadow-xl"
          >
            <div className="flex items-center gap-4">
              {/* Green Lock Icon */}
              <div className="bg-white/20 p-3 rounded-2xl">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" fill="white"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1.5" fill="#22c55e"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  ✅ Attendance {isLocked ? 'LOCKED' : 'SAVED'} for {activeCompany === 'GROUP' ? 'ALL UNITS' : activeCompany}!
                </h3>
                <p className="text-emerald-100 text-sm mt-1">
                  {new Date(`${currentMonth}-02`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} — {parsedRecords.length} employees {isLocked ? 'frozen for salary processing' : 'saved'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <span className="px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-lg">📊 {parsedRecords.length} Records</span>
              <span className="px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-lg">📝 Leave: {parsedRecords.filter(r => r.Leave_PL + r.Leave_CL + r.Leave_SL + r.CompOff_Used > 0).length}</span>
              <span className="px-3 py-1.5 bg-white text-emerald-700 text-xs font-bold rounded-lg">🔒 {activeCompany}</span>
            </div>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-center gap-2"
          >
            <AlertCircle size={15} className="text-rose-600" />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Tab Panels based on WorkflowStep */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* STEP 1: UPLOAD AREA */}
        {currentStep === 'UPLOAD' && (
          <div className="p-8 space-y-6">
            <div className="max-w-xl mx-auto text-center space-y-2">
              <h3 className="text-base font-bold text-gray-800 font-sans">Upload Monthly Attendance Summary</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Provide monthly consolidated attendance records. This tool validates the entries against Employee Master files and calendar boundaries before committing.
              </p>
            </div>

            {/* Drag & Drop Area */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`max-w-xl mx-auto border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3.5 transition duration-150 cursor-pointer ${
                dragActive ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200 hover:border-emerald-400 bg-gray-50/30'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
                <UploadCloud size={28} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-gray-700">Drag & drop your CSV or Excel file here</p>
                <p className="text-[10px] text-gray-400">Supports standard Microsoft Excel (.xlsx, .xls) & CSV sheets</p>
              </div>
              <button 
                type="button"
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-xl transition shadow-xs"
              >
                Select File manually
              </button>
            </div>

            {/* Template Downloader section */}
            <div className="max-w-xl mx-auto border border-gray-100 rounded-2xl p-5 bg-gray-50/50 flex items-center justify-between gap-4">
              <div className="flex gap-3">
                <div className="p-2.5 bg-emerald-100/50 text-emerald-700 rounded-xl flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Need the Standard Upload Template?</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                    Generate a clean CSV file preloaded with the employee codes and names of all active staff members in <strong>{activeCompany}</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                <Download size={13} />
                Get Template
              </button>
            </div>

            {/* Manual Entry Option section */}
            <div className="max-w-xl mx-auto border border-emerald-100 rounded-2xl p-5 bg-emerald-50/20 flex items-center justify-between gap-4">
              <div className="flex gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl flex-shrink-0">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Manually Fill Attendance (Bina upload kiye bharein)</h4>
                  <p className="text-[10px] text-emerald-800 leading-relaxed mt-0.5">
                    Spreadsheet grid mein directly employee records bharna shuru karein. System active employees ke code automatically pre-load kar dega.
                  </p>
                </div>
              </div>
              <button
                onClick={handleInitializeManualEntry}
                disabled={isLocked}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                <Edit2 size={13} />
                Manual Entry Shuru Karein
              </button>
            </div>

            {/* Guidance panel */}
            <div className="max-w-xl mx-auto text-left border border-amber-100 bg-amber-50/30 rounded-2xl p-4 flex gap-3">
              <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-amber-900">Format Instructions & Guidelines:</h5>
                <ul className="list-disc list-inside text-[10px] text-amber-800 space-y-1 leading-relaxed">
                  <li>Supported columns: <span className="font-mono font-semibold">Emp.Code</span>, <span className="font-mono font-semibold">Name</span>, <span className="font-mono font-semibold">Present</span>, <span className="font-mono font-semibold">Absent</span>, <span className="font-mono font-semibold">W/O</span>, <span className="font-mono font-semibold">Paid Holy</span>, <span className="font-mono font-semibold">Leave</span>, <span className="font-mono font-semibold">LWP</span>, <span className="font-mono font-semibold">Leave_Utilised (PL)</span>, <span className="font-mono font-semibold">Leave_Utilised (CL)</span>, <span className="font-mono font-semibold">Leave_Utilised (SL)</span>, <span className="font-mono font-semibold">C-Off_Utilised</span>.</li>
                  <li>Present + Absent + W/O + Paid Holy + Leave + LWP must sum to precisely {daysInMonth} days (for {new Date(`${currentMonth}-02`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}).</li>
                  <li>Leave breakup (PL, CL, SL, C-Off) is optional — used for Leave Card tracking.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: VALIDATION ENGINE RESULTS */}
        {currentStep === 'VALIDATION' && (
          <div className="p-6 space-y-6">
            
            {/* Validation Dashboard Overview */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border bg-gray-50/50">
              <div className="flex items-center gap-3">
                {validationErrors.length === 0 ? (
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                    <CheckCircle size={22} />
                  </div>
                ) : (
                  <div className="p-3 bg-rose-100 text-rose-700 rounded-full animate-bounce">
                    <AlertTriangle size={22} />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Validation Status: {uploadedFileName}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {validationErrors.length === 0 
                      ? `All ${parsedRecords.length} records parsed and passed 100% of the statutory validation rules!`
                      : `Found ${validationErrors.length} errors in your uploaded sheets. Proceeding is locked until corrected.`
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-600 rounded-xl transition cursor-pointer"
                >
                  Discard File
                </button>
                {validationErrors.length === 0 ? (
                  <button
                    onClick={() => setCurrentStep('VERIFY')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Proceed to Verify
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Move to grid anyway and let them fix it in the interactive editor
                      setCurrentStep('VERIFY');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Fix in Verification Grid
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Error Log Report */}
            {validationErrors.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-800 block">Detailed Error Report ({validationErrors.length} issues)</span>
                  <span className="text-[10px] text-gray-400 font-mono">Check rows and adjust them inside the spreadsheet or re-upload.</span>
                </div>

                <div className="border border-rose-100 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-rose-50/50 border-b border-rose-100">
                        <th className="p-3 text-[10px] font-bold text-rose-900 uppercase tracking-wider w-16 text-center">Row</th>
                        <th className="p-3 text-[10px] font-bold text-rose-900 uppercase tracking-wider w-28">Employee Code</th>
                        <th className="p-3 text-[10px] font-bold text-rose-900 uppercase tracking-wider w-40">Employee Name</th>
                        <th className="p-3 text-[10px] font-bold text-rose-900 uppercase tracking-wider">Error Details</th>
                        <th className="p-3 text-[10px] font-bold text-rose-900 uppercase tracking-wider w-32 text-right">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50 bg-white">
                      {validationErrors.map((err, i) => (
                        <tr key={i} className="hover:bg-rose-50/10">
                          <td className="p-3 text-center font-mono text-xs font-bold text-rose-700">{err.row}</td>
                          <td className="p-3 font-mono text-xs text-rose-900 font-semibold">{err.workerCode}</td>
                          <td className="p-3 text-xs text-gray-700 font-medium">{err.employeeName}</td>
                          <td className="p-3 text-xs text-rose-800 font-medium leading-relaxed">{err.message}</td>
                          <td className="p-3 text-right">
                            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                              {err.errorType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Verification summary cards if no errors */}
            {validationErrors.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 border border-gray-100 rounded-2xl bg-white space-y-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Total records parsed</span>
                  <span className="text-2xl font-bold text-gray-800 font-mono">{parsedRecords.length}</span>
                </div>
                <div className="p-5 border border-gray-100 rounded-2xl bg-white space-y-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Valid Employees Checked</span>
                  <span className="text-2xl font-bold text-emerald-600 font-mono">{parsedRecords.length}</span>
                </div>
                <div className="p-5 border border-gray-100 rounded-2xl bg-white space-y-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">System integrity status</span>
                  <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-2">
                    <CheckCircle size={15} /> 100% Verified
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: HR VERIFICATION GRID */}
        {currentStep === 'VERIFY' && (
          <div className="p-6 space-y-6">
            
            {/* Header, Search & Filter row */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employee name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50 placeholder-gray-400"
                  />
                </div>

                {/* Manual Row Addition Dropdown */}
                {!isLocked && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedAddEmployeeId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedAddEmployeeId(val);
                        if (val) {
                          handleAddSingleEmployee(val);
                        }
                      }}
                      className="py-2 px-3.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50 cursor-pointer font-semibold"
                    >
                      <option value="">+ Add Employee Row Manually</option>
                      {employees
                        .filter(emp => 
                          emp.status === 'ACTIVE' && 
                          (activeCompany === 'ALL' || activeCompany === 'GROUP' || activeCompany === 'COMBINED' || emp.company === activeCompany) &&
                          !parsedRecords.some(r => r.Worker_Code === emp.id)
                        )
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>
                            [{emp.id}] {emp.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                )}
              </div>

              {validationErrors.length > 0 && (
                <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-lg flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle size={12} className="text-amber-600" />
                  {validationErrors.length} unresolved errors remain. Edits here will revalidate in real-time.
                </div>
              )}

              {isLocked && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <Lock size={12} className="text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-800">Attendance Locked</span>
                  <button
                    onClick={() => handleLockToggle(false)}
                    disabled={saving}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    <Unlock size={10} className="inline mr-1" />Unlock
                  </button>
                </div>
              )}

              <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-end flex-wrap">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Discard & Re-upload
                </button>
                <button
                  onClick={handleSaveOnly}
                  disabled={saving || validationErrors.length > 0}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer ${
                    validationErrors.length > 0 
                      ? 'bg-gray-300 cursor-not-allowed opacity-50'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Save size={13} />
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
                <button
                  onClick={handleCommitAttendance}
                  disabled={saving || validationErrors.length > 0}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer ${
                    validationErrors.length > 0 
                      ? 'bg-gray-300 cursor-not-allowed opacity-50'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Save size={13} />
                  {saving ? 'Saving...' : 'Commit & Lock'}
                </button>
              </div>
            </div>

            {/* Interactive Spreadsheet Grid */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 border-b border-gray-100 select-none">
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-16 text-center bg-gray-50">Row</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-28 bg-gray-50">Employee Code</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-44 bg-gray-50">Employee Name</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-20">Present</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-20">Absent</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-16">W/O</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-16">PH</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-16">Leave</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-14">LWP</th>
                    <th className="p-3 text-[10px] font-bold text-emerald-600 uppercase tracking-wider text-center w-14 bg-emerald-50">PL</th>
                    <th className="p-3 text-[10px] font-bold text-emerald-600 uppercase tracking-wider text-center w-14 bg-emerald-50">CL</th>
                    <th className="p-3 text-[10px] font-bold text-emerald-600 uppercase tracking-wider text-center w-14 bg-emerald-50">SL</th>
                    <th className="p-3 text-[10px] font-bold text-emerald-600 uppercase tracking-wider text-center w-14 bg-emerald-50">C-Off</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-16">OT</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-28">Sum Days</th>
                    <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedRecords.map((rec) => {
                    const sum = rec.Present + rec.Absent + rec.Weekly_Off + rec.Paid_Holiday + rec.Leave + rec.LWP;
                    const isValidRow = sum === daysInMonth && rec.OT_Hours >= 0;

                    return (
                      <tr key={rec.Worker_Code} className={`hover:bg-gray-50/40 transition duration-100 ${!isValidRow ? 'bg-rose-50/25' : ''}`}>
                        <td className="p-3 text-center font-mono text-xs font-semibold text-gray-400">{rec.rowNum}</td>
                        <td className="p-3">
                          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded">{rec.Worker_Code}</span>
                        </td>
                        <td className="p-3 text-xs font-semibold text-gray-900">{rec.Employee_Name}</td>
                        
                        {/* Interactive cell inputs */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            value={rec.Present}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'Present', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            value={rec.Absent}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'Absent', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            value={rec.Weekly_Off}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'Weekly_Off', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            value={rec.Paid_Holiday}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'Paid_Holiday', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            value={rec.Leave}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'Leave', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            value={rec.LWP}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'LWP', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50"
                          />
                        </td>
                        {/* Leave Breakup: PL */}
                        <td className="p-2 bg-emerald-50/30">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            step="0.5"
                            value={rec.Leave_PL}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'Leave_PL', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white/80"
                          />
                        </td>
                        {/* CL */}
                        <td className="p-2 bg-emerald-50/30">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            step="0.5"
                            value={rec.Leave_CL}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'Leave_CL', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white/80"
                          />
                        </td>
                        {/* SL */}
                        <td className="p-2 bg-emerald-50/30">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            step="0.5"
                            value={rec.Leave_SL}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'Leave_SL', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white/80"
                          />
                        </td>
                        {/* CompOff Used */}
                        <td className="p-2 bg-emerald-50/30">
                          <input
                            type="number"
                            min="0"
                            max={daysInMonth}
                            step="0.5"
                            value={rec.CompOff_Used}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'CompOff_Used', e.target.value)}
                            disabled={isLocked}
                            className="w-14 text-center py-1 font-mono text-xs font-bold border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white/80"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={rec.OT_Hours}
                            onChange={(e) => handleVerifyGridChange(rec.Worker_Code, 'OT_Hours', e.target.value)}
                            disabled={isLocked}
                            className="w-16 text-center py-1 font-mono text-xs font-bold border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50"
                          />
                        </td>

                        <td className="p-3 text-center">
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${isValidRow ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'}`}>
                            {sum} / {daysInMonth}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(rec.Worker_Code)}
                            disabled={isLocked}
                            className="text-gray-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
                            title="Delete Row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center py-2.5">
                <span className="text-[11px] text-gray-400">
                  Showing {Math.min(filteredRecords.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredRecords.length, currentPage * itemsPerPage)} of {filteredRecords.length} employees
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-500 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-3 py-1 font-mono text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-500 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: ATTENDANCE LOCK STATUS */}
        {currentStep === 'LOCK' && (
          <div className="p-8 space-y-6">
            <div className="max-w-md mx-auto text-center space-y-4 py-6">
              <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-xs">
                <Lock size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-800">Attendance Summary Locked</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Consolidated monthly attendance inputs for {new Date(`${currentMonth}-02`).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })} have been successfully validated, approved by HR, and locked.
                </p>
              </div>

              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 text-left text-[11px] text-gray-500 space-y-1">
                <p>• <strong>Total Verified Employees:</strong> {parsedRecords.length}</p>
                <p>• <strong>Compliance Checks:</strong> 100% Green (PF/ESIC ratios set)</p>
                <p>• <strong>Status:</strong> Safe and ready to initiate salary payout calculation</p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleLockToggle(false)}
                  className="w-full py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-800 rounded-xl transition cursor-pointer"
                >
                  Unlock Ledger to edit
                </button>
                <p className="text-[9px] text-gray-400">Note: Recalculating payroll for a locked month is disallowed unless unlocked.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
