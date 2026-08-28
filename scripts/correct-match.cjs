const fs = require('fs');
const csvPath = 'D:/c drive/Desktop/Salary-Apr-26 -.csv';
const data = fs.readFileSync(csvPath, 'utf8');
const lines = data.split(/\r?\n/);

console.log('=== CORRECT SALARY MATCHING ===\n');
console.log('Matching with:');
console.log('- Column AB (index 27) = Total Earnings (Paid Gross)');
console.log('- Column AM (index 38) = Net Payment After Deduction\n');

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
      
      const empCode = parts[1]?.trim();
      const name = parts[2]?.trim();
      const unit = parts[4]?.trim();
      const basic = parseNum(parts[10]);
      const eduAllow = parseNum(parts[11]);
      const hra = parseNum(parts[12]);
      const medical = parseNum(parts[13]);
      const conveyance = parseNum(parts[14]);
      const special = parseNum(parts[15]);
      const masterGross = parseNum(parts[16]);
      const pfContrib = parseNum(parts[17]);
      const totalEarnings = parseNum(parts[27]); // Column AB
      const pfDeduction = parseNum(parts[30]);
      const esicDeduction = parseNum(parts[31]);
      const tds = parseNum(parts[32]);
      const salaryAdvance = parseNum(parts[33]);
      const loan = parseNum(parts[34]);
      const otherDeduction = parseNum(parts[35]);
      const totalDeductions = parseNum(parts[36]);
      const netPayment = parseNum(parts[38]); // Column AM
      const payDays = parseNum(parts[42]);
      const daysInMonth = parseNum(parts[43]);
      
      if (empCode && basic > 0) {
        employees.push({
          empCode, name, unit, basic, eduAllow, hra, medical, conveyance, special,
          masterGross, pfContrib, totalEarnings, pfDeduction, esicDeduction,
          tds, salaryAdvance, loan, otherDeduction, totalDeductions, netPayment,
          payDays, daysInMonth
        });
      }
    }
  }
  return employees;
}

const csvEmployees = parseCSV(lines);

// Calculate and match
console.log('=== MATCHING TOTAL EARNINGS (AB) ===\n');

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
  
  // Match with CSV Total Earnings (AB)
  const earningsMatch = Math.abs(calculatedEarnings - emp.totalEarnings) < 100;
  
  // Calculate deductions
  const calculatedDeductions = emp.pfDeduction + emp.esicDeduction + emp.tds + emp.salaryAdvance + emp.loan + emp.otherDeduction;
  const deductionsMatch = Math.abs(calculatedDeductions - emp.totalDeductions) < 100;
  
  // Calculate net
  const calculatedNet = calculatedEarnings - calculatedDeductions;
  const netMatch = Math.abs(calculatedNet - emp.netPayment) < 100;
  
  if (earningsMatch && netMatch) {
    matchCount++;
  } else {
    mismatchCount++;
    mismatches.push({
      empCode: emp.empCode,
      name: emp.name,
      calculatedEarnings,
      csvEarnings: emp.totalEarnings,
      calculatedDeductions,
      csvDeductions: emp.totalDeductions,
      calculatedNet,
      csvNet: emp.netPayment,
      payDays: emp.payDays
    });
  }
});

console.log('=== RESULTS ===');
console.log('✅ Matched:', matchCount);
console.log('❌ Mismatched:', mismatchCount);
console.log('');

if (mismatchCount > 0) {
  console.log('=== MISMATCHES ===');
  mismatches.forEach(m => {
    console.log(`\n${m.empCode} - ${m.name} (Pay Days: ${m.payDays})`);
    console.log(`  Earnings: Calculated=${m.calculatedEarnings} CSV=${m.csvEarnings}`);
    console.log(`  Deductions: Calculated=${m.calculatedDeductions} CSV=${m.csvDeductions}`);
    console.log(`  Net: Calculated=${m.calculatedNet} CSV=${m.csvNet}`);
  });
}

console.log('\n=== SUMMARY ===');
console.log('Total CSV Employees:', csvEmployees.length);
console.log('Matched:', matchCount);
console.log('Mismatched:', mismatchCount);
