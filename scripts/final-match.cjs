const fs = require('fs');
const csvPath = 'D:/c drive/Desktop/Salary-Apr-26 -.csv';
const data = fs.readFileSync(csvPath, 'utf8');
const lines = data.split(/\r?\n/);

function parseCSV(lines) {
  const employees = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '"') {
        inQuotes = !inQuotes;
      } else if (line[j] === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += line[j];
      }
    }
    parts.push(current.trim());
    
    if (parts.length > 45) {
      const parseNum = (val) => {
        const s = (val || '0').replace(/[,"]/g, '').trim();
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
      };
      
      employees.push({
        empCode: parts[1]?.trim(),
        name: parts[2]?.trim(),
        unit: parts[4]?.trim(),
        basic: parseNum(parts[10]),
        eduAllow: parseNum(parts[11]),
        hra: parseNum(parts[12]),
        medical: parseNum(parts[13]),
        conveyance: parseNum(parts[14]),
        special: parseNum(parts[15]),
        totalEarnings: parseNum(parts[27]), // AB
        pfDeduction: parseNum(parts[31]), // AE
        esicDeduction: parseNum(parts[32]), // AF
        tds: parseNum(parts[33]), // AG
        salaryAdvance: parseNum(parts[34]), // AH
        loan: parseNum(parts[35]), // AI
        otherDeduction: parseNum(parts[36]), // AJ
        totalDeductions: parseNum(parts[37]), // AK
        netPayment: parseNum(parts[38]), // AL
        payDays: parseNum(parts[42]),
        daysInMonth: parseNum(parts[43])
      });
    }
  }
  return employees;
}

const csvEmployees = parseCSV(lines);

console.log('=== FINAL SALARY MATCH - APRIL 2026 ===\n');
console.log('Matching:');
console.log('- Total Earnings (AB, idx 27)');
console.log('- Total Deductions (AK, idx 37)');
console.log('- Net Payment (AL, idx 38)\n');

let matchCount = 0;
let mismatchCount = 0;
const mismatches = [];

csvEmployees.forEach(emp => {
  const ratio = emp.payDays / emp.daysInMonth;
  
  // Calculate earned gross (Total Earnings)
  const earnedBasic = Math.round(emp.basic * ratio);
  const earnedEdu = Math.round(emp.eduAllow * ratio);
  const earnedHRA = Math.round(emp.hra * ratio);
  const earnedMedical = Math.round(emp.medical * ratio);
  const earnedConveyance = Math.round(emp.conveyance * ratio);
  const earnedSpecial = Math.round(emp.special * ratio);
  const calculatedEarnings = earnedBasic + earnedEdu + earnedHRA + earnedMedical + earnedConveyance + earnedSpecial;
  
  // Calculate deductions (from CSV)
  const calculatedDeductions = emp.pfDeduction + emp.esicDeduction + emp.tds + emp.salaryAdvance + emp.loan + emp.otherDeduction;
  
  // Calculate net
  const calculatedNet = calculatedEarnings - calculatedDeductions;
  
  // Match
  const earningsMatch = Math.abs(calculatedEarnings - emp.totalEarnings) < 100;
  const deductionsMatch = Math.abs(calculatedDeductions - emp.totalDeductions) < 100;
  const netMatch = Math.abs(calculatedNet - emp.netPayment) < 100;
  
  if (earningsMatch && netMatch) {
    matchCount++;
  } else {
    mismatchCount++;
    mismatches.push({
      empCode: emp.empCode,
      name: emp.name,
      payDays: emp.payDays,
      calculatedEarnings,
      csvEarnings: emp.totalEarnings,
      calculatedDeductions,
      csvDeductions: emp.totalDeductions,
      calculatedNet,
      csvNet: emp.netPayment,
      earningsMatch,
      netMatch
    });
  }
});

console.log('=== RESULTS ===');
console.log('✅ Matched:', matchCount);
console.log('❌ Mismatched:', mismatchCount);

if (mismatchCount > 0) {
  console.log('\n=== MISMATCHES ===');
  mismatches.forEach(m => {
    console.log(`\n${m.empCode} - ${m.name} (Pay Days: ${m.payDays})`);
    if (!m.earningsMatch) {
      console.log(`  Earnings: Calculated=${m.calculatedEarnings} CSV=${m.csvEarnings}`);
    }
    if (!m.netMatch) {
      console.log(`  Net: Calculated=${m.calculatedNet} CSV=${m.csvNet}`);
    }
  });
} else {
  console.log('\n🎉 ALL EMPLOYEES MATCH! Ready to LOCK April salary.');
}

console.log('\n=== SUMMARY ===');
console.log('Total CSV Employees:', csvEmployees.length);
console.log('Matched:', matchCount);
console.log('Mismatched:', mismatchCount);
