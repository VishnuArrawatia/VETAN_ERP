import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });

const show = (sn: string, cols: number, rows: number[]) => {
  const ws = wb.Sheets[sn];
  console.log(`\n### ${sn}:`);
  for (const r of rows) {
    const parts: string[] = [];
    for (let c = 0; c < cols; c++) {
      const cell = (ws as any)[utils.encode_cell({ r, c })];
      if (cell) {
        const f = cell.f ? `{${String(cell.f).slice(0, 50)}}` : "";
        parts.push(`${utils.encode_col(c)}${r + 1}=${String(cell.v).slice(0, 16)}${f}`);
      }
    }
    console.log(`Row ${r + 1}: ${parts.join(" | ")}`);
  }
};

show("DataTB-SKR", 46, [0, 1]);
show("DATATB-SVN", 30, [0, 1]);

// Master-TB-Sakar: check I1 (OB date) and V column formulas (Total)
const skr = wb.Sheets["Master-TB-Sakar"];
console.log("\n### Master-TB-Sakar row 1 A-V (all cells incl empty):");
const parts: string[] = [];
for (let c = 0; c < 22; c++) {
  const cell = (skr as any)[utils.encode_cell({ r: 0, c })];
  parts.push(`${utils.encode_col(c)}1=${cell ? String(cell.v) : "·"}`);
}
console.log(parts.join(" | "));

console.log("\n### Master-TB-Sakar V-column formulas (rows 3-6) + J3:");
for (const addr of ["V3", "V4", "J3", "N3", "I3"]) {
  const cell = (skr as any)[addr];
  if (cell) console.log(`  ${addr}: f=${cell.f ? String(cell.f).slice(0, 80) : "-"} v=${cell.v}`);
}

// SVN: G1/T1 confirmed. Check V/T column formula sample + row counts
const svn = wb.Sheets["Master-TB-SVN"];
console.log("\n### Master-TB-SVN sample formulas:");
for (const addr of ["T3", "L3", "G3"]) {
  const cell = (svn as any)[addr];
  if (cell) console.log(`  ${addr}: f=${cell.f ? String(cell.f).slice(0, 80) : "-"} v=${cell.v}`);
}
