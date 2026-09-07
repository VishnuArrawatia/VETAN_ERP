import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const svn = wb.Sheets["Master-TB-SVN"];
const dt = wb.Sheets["DATATB-SVN"];

const cell = (ws: any, r: number, c: number) => (ws as any)[utils.encode_cell({ r, c })];

// Row 1 headers G..V (cols 6..21)
console.log("### Master-TB-SVN row 1 (G..V):");
for (let c = 6; c <= 21; c++) {
  const h = cell(svn, 0, c);
  if (h) console.log(`  ${utils.encode_col(c)}1: v=${h.v} type=${h.t}${h.f ? " f=" + h.f : ""}`);
}

// Sample rows 3-8: B (grouping), G, L, T
console.log("\n### Sample rows (B=grouping | G | L | T):");
for (let r = 2; r < 8; r++) {
  const b = cell(svn, r, 1), g = cell(svn, r, 6), l = cell(svn, r, 11), t = cell(svn, r, 19);
  const f = (x: any) => (x === undefined ? "-" : typeof x.v === "number" ? x.v.toFixed(2) : String(x.v).slice(0, 20));
  console.log(`  R${r + 1}: [${f(b)}] G=${f(g)} L=${f(l)} T=${t && t.f ? "f=" + t.f : f(t)}`);
}

// DATATB-SVN headers + total column: what does the ERP dump look like
console.log("\n### DATATB-SVN row 1 (A..M):");
for (let c = 0; c <= 12; c++) {
  const h = cell(dt, 0, c);
  if (h) console.log(`  ${utils.encode_col(c)}1: ${typeof h.v === "number" ? h.v + " (" + h.t + ")" : String(h.v).slice(0, 30)}`);
}

// SVN TB row 2 (row-1 labels?) — check if TB_SKR/TB_SVN named ranges match on row 2 labels
console.log("\n### Master-TB-SVN row 2 (A..L):");
for (let c = 0; c <= 11; c++) {
  const h = cell(svn, 1, c);
  if (h) console.log(`  ${utils.encode_col(c)}2: ${String(h.v).slice(0, 28)}`);
}
