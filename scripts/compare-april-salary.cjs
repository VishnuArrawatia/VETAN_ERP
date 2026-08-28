const fs = require('fs');
const https = require('https');

// Parse CSV with proper handling of quoted fields
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current || row.length > 0) {
        row.push(current.trim());
        if (row.length > 5) rows.push(row);
        row = [];
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.length > 5) rows.push(row);
  }
  return rows;
}

// Read CSV
const csvText = fs.readFileSync('D:/c drive/Desktop/Salary-Apr-26 -.csv', 'utf8');
const rows = parseCSV(csvText);

console.log('CSV Rows:', rows.length);
console.log('');

// Find header row (contains "Employee code")
let headerIdx = -1;
for (let i = 0; i < Math.min(5, rows.length); i++) {
  if (rows[i].some(h => h && h.includes('Employee code'))) {
    headerIdx = i;
    break;
  }
}

if (headerIdx === -1) {
  console.log('Header row not found. First 3 rows:');
  rows.slice(0, 3).forEach((r, i) => console.log(`Row ${i}:`, r.slice(0, 10)));
  process.exit(1);
}

const headers = rows[headerIdx];
console.log('Header row index:', headerIdx);
console.log('Total columns:', headers.length);

// Find key column indices
const colMap = {};
headers.forEach((h, idx) => {
  const hl = h.toLowerCase().trim();
  if (hl.includes('employee code') || hl.includes('emp code')) colMap.code = idx;
  if (hl.includes('name of employee') || hl.includes('employee name')) colMap.name = idx;
  if (hl.includes('sal-basic')) colMap.basic = idx;
  if (hl.includes('sal-gross')) colMap.gross = idx;
  if (hl.includes('total deduction')) colMap.totalDed = idx;
  if (hl.includes('net payment') || hl.includes('net salary')) colMap.net = idx;
  if (hl.includes('pay days')) colMap.payDays = idx;
  if (hl.includes('pf contribution') && !hl.includes('employer')) colMap.pf = idx;
  if (hl.includes('esic') && !hl.includes('employer')) colMap.esic = idx;
});

console.log('Column Map:', colMap);
console.log('');

// Parse data rows
const csvData = [];
for (let i = headerIdx + 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length < 10) continue;
  
  const code = (row[colMap.code] || '').trim();
  const name = (row[colMap.name] || '').trim();
  
  if (!code || code.length < 5 || code.includes('Total') || code.includes('TOTAL')) continue;
  
  const basic = parseFloat((row[colMap.basic] || '0').replace(/,/g, '').replace(/"/g, '')) || 0;
  const gross = parseFloat((row[colMap.gross] || '0').replace(/,/g, '').replace(/"/g, '')) || 0;
  const totalDed = parseFloat((row[colMap.totalDed] || '0').replace(/,/g, '').replace(/"/g, '')) || 0;
  const net = parseFloat((row[colMap.net] || '0').replace(/,/g, '').replace(/"/g, '')) || 0;
  
  if (basic > 0 || gross > 0) {
    csvData.push({ code, name, basic, gross, totalDed, net });
  }
}

console.log('CSV Employees with salary data:', csvData.length);
console.log('');

// Fetch ERP data
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const erpSlips = await fetchJSON('https://vetan-svn.vercel.app/api/payslips/month/2026-04');
  console.log('ERP April Payslips:', erpSlips.length);
  console.log('');

  // Compare
  let matched = 0;
  let mismatched = 0;
  let notInERP = 0;
  let notInCSV = 0;
  
  const mismatches = [];
  const notFound = [];
  
  csvData.forEach(csv => {
    const erp = erpSlips.find(s => s.employee_id === csv.code);
    if (!erp) {
      notInERP++;
      notFound.push(csv);
      return;
    }
    
    const grossMatch = Math.abs((erp.gross_salary || 0) - csv.gross) < 100;
    const netMatch = Math.abs((erp.net_salary || 0) - csv.net) < 100;
    
    if (grossMatch && netMatch) {
      matched++;
    } else {
      mismatched++;
      mismatches.push({
        code: csv.code,
        name: csv.name,
        csvGross: csv.gross,
        erpGross: erp.gross_salary,
        csvNet: csv.net,
        erpNet: erp.net_salary
      });
    }
  });
  
  // Check ERP employees not in CSV
  erpSlips.forEach(erp => {
    if (!csvData.find(c => c.code === erp.employee_id)) {
      notInCSV++;
    }
  });
  
  console.log('=== COMPARISON RESULTS ===');
  console.log('CSV Employees:', csvData.length);
  console.log('ERP Payslips:', erpSlips.length);
  console.log('✅ Matched:', matched);
  console.log('❌ Mismatched:', mismatched);
  console.log('⚠️ In CSV but not in ERP:', notInERP);
  console.log('⚠️ In ERP but not in CSV:', notInCSV);
  
  if (mismatches.length > 0) {
    console.log('');
    console.log('=== MISMATCHED EMPLOYEES ===');
    mismatches.forEach(m => {
      console.log(`${m.code} | ${m.name} | CSV Gross: ${m.csvGross} vs ERP: ${m.erpGross} | CSV Net: ${m.csvNet} vs ERP: ${m.erpNet}`);
    });
  }
  
  if (notFound.length > 0) {
    console.log('');
    console.log('=== NOT IN ERP ===');
    notFound.forEach(n => {
      console.log(`${n.code} | ${n.name} | CSV Gross: ${n.gross} | CSV Net: ${n.net}`);
    });
  }
}

main().catch(console.error);
