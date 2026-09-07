import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });

// 1. Full BS_ / TB_ / Grp_ named ranges
const names: any[] = ((wb as any).Workbook || {}).Names || [];
console.log("### FULL BS_/TB_/Grp_ NAMED RANGES:");
for (const n of names) {
  const nm = String(n.Name || "");
  if (/^(BS_|TB_|Grp|SKR_|SVN_|Actual|BOE|Cheque|Creditors|Day_|Days_)/i.test(nm)) {
    console.log(`\n[${nm}]`);
    console.log(String(n.Ref || "").replace(/\s+/g, " ").slice(0, 500));
  }
}

// 2. BS Summary: every formula cell, full text
const bs = wb.Sheets["BS Summary"];
console.log("\n\n### BS SUMMARY - ALL FORMULA CELLS (full text):");
for (const addr of Object.keys(bs)) {
  if (addr.startsWith("!")) continue;
  const cell = (bs as any)[addr];
  if (cell.f) {
    console.log(`${addr}: f=${String(cell.f).replace(/\s+/g, " ")}`);
    if (cell.v !== undefined && cell.v !== cell.f) console.log(`   v=${cell.v}`);
  }
}

// 3. Master-TB-Sakar & SVN row 1-2 full headers + one sample data row
for (const sn of ["Master-TB-Sakar", "Master-TB-SVN"]) {
  const ws = wb.Sheets[sn];
  console.log(`\n\n### ${sn} rows 1-2 (cols A-Z, full):`);
  for (const r of [0, 1]) {
    const parts: string[] = [];
    for (let c = 0; c < 26; c++) {
      const cell = (ws as any)[utils.encode_cell({ r, c })];
      if (cell) parts.push(`${utils.encode_col(c)}${r + 1}: f=${cell.f ? String(cell.f).replace(/\s+/g, " ").slice(0, 120) : "-"} v=${cell.v}`);
    }
    console.log(parts.join("\n") + "\n---");
  }
  // Sample: Share Capital / grouping rows — find row where G or C contains "Capital"
  console.log(`### ${sn} first 6 data rows (A-H):`);
  for (let r = 2; r < 8; r++) {
    const row: string[] = [];
    for (let c = 0; c < 8; c++) {
      const cell = (ws as any)[utils.encode_cell({ r, c })];
      row.push(cell ? String(cell.v).slice(0, 24) : "");
    }
    console.log(`R${r + 1}: ${JSON.stringify(row)}`);
  }
}
