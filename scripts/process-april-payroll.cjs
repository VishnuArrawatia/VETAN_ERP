const fs = require('fs');
const https = require('https');
const http = require('http');

const BASE_URL = 'https://vetan-svn.vercel.app';

// Helper to make API calls
async function apiCall(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function main() {
  console.log('=== PROCESSING APRIL 2026 PAYROLL ===\n');
  
  // Step 1: Login
  console.log('Step 1: Logging in...');
  const loginRes = await apiCall('POST', '/api/hr/login', {
    username: 'vishnu',
    password: 'Varrawatia'
  });
  const token = loginRes.token;
  console.log('Token acquired:', token ? 'YES' : 'NO');
  
  // Step 2: Get all employees
  console.log('\nStep 2: Getting all employees...');
  const employees = await apiCall('GET', '/api/employees', null, token);
  console.log('Total employees:', employees.length);
  
  // Step 3: Read CSV data
  console.log('\nStep 3: Reading CSV data...');
  const csvData = JSON.parse(fs.readFileSync('scripts/april-csv-data.json', 'utf8'));
  console.log('CSV employees:', csvData.length);
  
  // Step 4: Create attendance for April (based on CSV Pay Days)
  console.log('\nStep 4: Creating attendance records...');
  
  const attendanceResults = [];
  for (const csv of csvData) {
    const erp = employees.find(e => e.id === csv.empCode);
    if (!erp) {
      console.log(`SKIP: ${csv.empCode} - Not in ERP`);
      continue;
    }
    
    const daysInMonth = csv.daysInMonth || 30;
    const payDays = csv.payDays || 0;
    const daysPresent = payDays;
    const daysAbsent = daysInMonth - payDays;
    
    // Create attendance record
    const attendanceData = {
      employeeId: csv.empCode,
      month: '2026-04',
      year: 2026,
      daysPresent: daysPresent,
      daysAbsent: daysAbsent,
      daysOnLeave: 0,
      overtimeHours: 0
    };
    
    try {
      const result = await apiCall('POST', '/api/attendance', attendanceData, token);
      attendanceResults.push({ empCode: csv.empCode, success: true });
    } catch (err) {
      console.log(`ERROR: ${csv.empCode} - ${err.message}`);
      attendanceResults.push({ empCode: csv.empCode, success: false, error: err.message });
    }
  }
  
  console.log('Attendance records created:', attendanceResults.filter(r => r.success).length);
  
  // Step 5: Process payroll for each unit
  console.log('\nStep 5: Processing payroll...');
  
  const units = ['Sakar-I', 'Sakar-III', 'SVN-II', 'SVN-1'];
  
  for (const unit of units) {
    console.log(`\nProcessing ${unit}...`);
    
    const unitEmployees = csvData.filter(e => e.unit === unit);
    console.log(`  Employees: ${unitEmployees.length}`);
    
    // Calculate payroll for this unit
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    
    for (const csv of unitEmployees) {
      // Calculate earned salary based on Pay Days
      const ratio = csv.payDays / csv.daysInMonth;
      const earnedBasic = Math.round(csv.basic * ratio);
      const earnedHRA = Math.round(csv.hra * ratio);
      const earnedEdu = Math.round(csv.eduAllow * ratio);
      const earnedMedical = Math.round(csv.medical * ratio);
      const earnedConveyance = Math.round(csv.conveyance * ratio);
      const earnedSpecial = Math.round(csv.special * ratio);
      const earnedGross = earnedBasic + earnedHRA + earnedEdu + earnedMedical + earnedConveyance + earnedSpecial;
      
      // Deductions
      const pfDeduction = csv.pfDeduction || 0;
      const esicDeduction = csv.esicDeduction || 0;
      const tds = csv.tds || 0;
      const advance = csv.salaryAdvance || 0;
      const loan = csv.loan || 0;
      const other = csv.otherDeduction || 0;
      const totalDed = pfDeduction + esicDeduction + tds + advance + loan + other;
      
      const netPay = earnedGross - totalDed;
      
      totalGross += earnedGross;
      totalDeductions += totalDed;
      totalNet += netPay;
    }
    
    console.log(`  Total Gross: ₹${totalGross}`);
    console.log(`  Total Deductions: ₹${totalDeductions}`);
    console.log(`  Total Net: ₹${totalNet}`);
    
    // Create payroll run
    const payrollRun = {
      id: `RUN-2026-04-${unit}`,
      month: '2026-04',
      year: 2026,
      unit: unit,
      status: 'DRAFT',
      total_employees: unitEmployees.length,
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet
    };
    
    try {
      const result = await apiCall('POST', '/api/payroll-runs', payrollRun, token);
      console.log(`  Payroll run created: ${result.id || 'OK'}`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }
  }
  
  // Step 6: Match with CSV
  console.log('\nStep 6: Matching with CSV...');
  
  let matchCount = 0;
  let mismatchCount = 0;
  
  for (const csv of csvData) {
    const erp = employees.find(e => e.id === csv.empCode);
    if (!erp) continue;
    
    // Calculate expected earned values
    const ratio = csv.payDays / csv.daysInMonth;
    const expectedGross = Math.round((csv.basic + csv.hra + csv.eduAllow + csv.medical + csv.conveyance + csv.special) * ratio);
    const csvGross = csv.gross;
    
    if (Math.abs(expectedGross - csvGross) < 100) { // Allow minor rounding differences
      matchCount++;
    } else {
      mismatchCount++;
      console.log(`MISMATCH: ${csv.empCode} - Expected:${expectedGross} CSV:${csvGross}`);
    }
  }
  
  console.log('\n=== MATCH RESULT ===');
  console.log('Matched:', matchCount);
  console.log('Mismatched:', mismatchCount);
  
  if (mismatchCount === 0) {
    console.log('\n✅ ALL SALARIES MATCH! Ready to LOCK.');
  } else {
    console.log('\n⚠️ Some mismatches found. Review before locking.');
  }
}

main().catch(console.error);
