const fs = require('fs');

// Read CSV data
const csvData = JSON.parse(fs.readFileSync('scripts/april-csv-data.json', 'utf8'));

// Read ERP data
const erpData = JSON.parse(fs.readFileSync('scripts/erp-employees.json', 'utf8'));

console.log('=== SALARY MATCH REPORT — APRIL 2026 ===\n');
console.log('CSV Employees:', csvData.length);
console.log('ERP Employees:', erpData.length);

// Create ERP lookup by ID
const erpLookup = {};
erpData.forEach(e => {
  erpLookup[e.id] = e;
});

// Create CSV lookup by code
const csvLookup = {};
csvData.forEach(e => {
  csvLookup[e.empCode] = e;
});

let matchCount = 0;
let mismatchCount = 0;
let missingInERP = [];
let missingInCSV = [];
let mismatches = [];

console.log('\n--- MATCHING BY EMPLOYEE CODE ---\n');

csvData.forEach(csv => {
  const erp = erpLookup[csv.empCode];
  if (!erp) {
    missingInERP.push(csv);
    return;
  }
  
  const basicMatch = csv.basic === erp.base_salary;
  const hraMatch = csv.hra === erp.hra;
  const eduMatch = csv.eduAllow === (erp.edu_allowance || 0);
  const medicalMatch = csv.medical === (erp.medical_allowance || 0);
  const conveyanceMatch = csv.conveyance === (erp.conveyance_allowance || 0);
  const specialMatch = csv.special === (erp.special_allowance || 0);
  
  if (basicMatch && hraMatch && eduMatch && medicalMatch && conveyanceMatch && specialMatch) {
    matchCount++;
    console.log(`✅ ${csv.empCode}\t${csv.name}\tBasic:${csv.basic}\tHRA:${csv.hra}\tAll OK`);
  } else {
    mismatchCount++;
    mismatches.push({
      empCode: csv.empCode,
      name: csv.name,
      csvBasic: csv.basic,
      erpBasic: erp.base_salary,
      csvHRA: csv.hra,
      erpHRA: erp.hra,
      csvEdu: csv.eduAllow,
      erpEdu: erp.edu_allowance,
      csvMedical: csv.medical,
      erpMedical: erp.medical_allowance,
      csvConveyance: csv.conveyance,
      erpConveyance: erp.conveyance_allowance,
      csvSpecial: csv.special,
      erpSpecial: erp.special_allowance
    });
    console.log(`❌ ${csv.empCode}\t${csv.name}`);
    if (!basicMatch) console.log(`   Basic: CSV=${csv.basic} ERP=${erp.base_salary}`);
    if (!hraMatch) console.log(`   HRA: CSV=${csv.hra} ERP=${erp.hra}`);
    if (!eduMatch) console.log(`   Edu: CSV=${csv.eduAllow} ERP=${erp.edu_allowance || 0}`);
    if (!medicalMatch) console.log(`   Medical: CSV=${csv.medical} ERP=${erp.medical_allowance || 0}`);
    if (!conveyanceMatch) console.log(`   Conveyance: CSV=${csv.conveyance} ERP=${erp.conveyance_allowance || 0}`);
    if (!specialMatch) console.log(`   Special: CSV=${csv.special} ERP=${erp.special_allowance || 0}`);
  }
});

// Check for ERP employees not in CSV
erpData.forEach(erp => {
  if (!csvLookup[erp.id]) {
    missingInCSV.push(erp);
  }
});

console.log('\n--- SUMMARY ---');
console.log('✅ Matched:', matchCount);
console.log('❌ Mismatched:', mismatchCount);
console.log('⚠️ In CSV but not ERP:', missingInERP.length);
console.log('⚠️ In ERP but not CSV:', missingInCSV.length);

if (missingInERP.length > 0) {
  console.log('\n--- IN CSV BUT NOT IN ERP ---');
  missingInERP.forEach(e => {
    console.log(`${e.empCode}\t${e.name}\tUnit:${e.unit}`);
  });
}

if (missingInCSV.length > 0) {
  console.log('\n--- IN ERP BUT NOT IN CSV ---');
  missingInCSV.forEach(e => {
    console.log(`${e.id}\t${e.name}\tUnit:${e.company}`);
  });
}

// Save mismatch report
fs.writeFileSync('scripts/salary-mismatch-report.json', JSON.stringify({
  matched: matchCount,
  mismatched: mismatchCount,
  missingInERP: missingInERP.length,
  missingInCSV: missingInCSV.length,
  mismatches,
  missingInERPList: missingInERP,
  missingInCSVList: missingInCSV
}, null, 2));

console.log('\nReport saved to scripts/salary-mismatch-report.json');
