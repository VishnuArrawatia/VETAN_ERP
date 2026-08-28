const fs = require('fs');
const csvPath = 'D:/c drive/Desktop/Salary-Apr-26 -.csv';
const data = fs.readFileSync(csvPath, 'utf8');
const lines = data.split(/\r?\n/);
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
  
  if (parts.length > 40) {
    const empCode = parts[1]?.trim();
    const name = parts[2]?.trim();
    const unit = parts[4]?.trim();
    const basic = parseFloat((parts[10] || '0').replace(/[,"]/g, '').trim());
    const eduAllow = parseFloat((parts[11] || '0').replace(/[,"]/g, '').trim());
    const hra = parseFloat((parts[12] || '0').replace(/[,"]/g, '').trim());
    const medical = parseFloat((parts[13] || '0').replace(/[,"]/g, '').trim());
    const conveyance = parseFloat((parts[14] || '0').replace(/[,"]/g, '').trim());
    const special = parseFloat((parts[15] || '0').replace(/[,"]/g, '').trim());
    const gross = parseFloat((parts[16] || '0').replace(/[,"]/g, '').trim());
    const payDays = parseFloat((parts[42] || '0').replace(/[,"]/g, '').trim());
    const daysInMonth = parseFloat((parts[43] || '0').replace(/[,"]/g, '').trim());
    const netPay = parseFloat((parts[37] || '0').replace(/[,"]/g, '').trim());
    const totalDeductions = parseFloat((parts[36] || '0').replace(/[,"]/g, '').trim());
    const pfDeduction = parseFloat((parts[30] || '0').replace(/[,"]/g, '').trim());
    const esicDeduction = parseFloat((parts[31] || '0').replace(/[,"]/g, '').trim());
    const tds = parseFloat((parts[32] || '0').replace(/[,"]/g, '').trim());
    const salaryAdvance = parseFloat((parts[33] || '0').replace(/[,"]/g, '').trim());
    const loan = parseFloat((parts[34] || '0').replace(/[,"]/g, '').trim());
    const otherDeduction = parseFloat((parts[35] || '0').replace(/[,"]/g, '').trim());
    
    if (empCode && basic > 0) {
      employees.push({
        empCode: empCode.trim(),
        name: name?.trim(),
        unit,
        basic, eduAllow, hra, medical, conveyance, special, gross,
        payDays, daysInMonth, netPay, totalDeductions,
        pfDeduction, esicDeduction, tds, salaryAdvance, loan, otherDeduction
      });
    }
  }
}

// Map CSV unit names to ERP unit names
function mapUnit(unit) {
  if (!unit) return '';
  if (unit.includes('Unit-I') || unit.includes('Unit I') || unit === 'Unit-I') return 'Sakar-I';
  if (unit.includes('Unit III') || unit === 'Unit III' || unit.includes('Unit-III')) return 'Sakar-III';
  if (unit.includes('SVN-II')) return 'SVN-II';
  if (unit.includes('SVN-1') || unit.includes('SVN I')) return 'SVN-1';
  return unit;
}

console.log('=== APRIL CSV DATA ===');
console.log('Total employees in CSV:', employees.length);
console.log('\n--- By Unit ---');
const byUnit = {};
employees.forEach(e => {
  const u = mapUnit(e.unit);
  if (!byUnit[u]) byUnit[u] = [];
  byUnit[u].push(e);
});
Object.entries(byUnit).forEach(([unit, emps]) => {
  console.log(`${unit}: ${emps.length} employees`);
});

console.log('\n--- ALL EMPLOYEES ---');
employees.forEach(e => {
  console.log(`${e.empCode}\t${e.name}\t${mapUnit(e.unit)}\tBasic:${e.basic}\tPayDays:${e.payDays}\tDaysMonth:${e.daysInMonth}\tGross:${e.gross}\tNet:${e.netPay}\tPF_Ded:${e.pfDeduction}\tESIC_Ded:${e.esicDeduction}\tTDS:${e.tds}\tAdvance:${e.salaryAdvance}\tLoan:${e.loan}\tOther:${e.otherDeduction}`);
});

// Save as JSON for further processing
fs.writeFileSync('scripts/april-csv-data.json', JSON.stringify(employees.map(e => ({
  ...e, unit: mapUnit(e.unit)
})), null, 2));
console.log('\nSaved to scripts/april-csv-data.json');
