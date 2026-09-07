import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const bs = wb.Sheets["BS Summary"];
const pl = wb.Sheets["New PL"];

const cell = (ws: any, r: number, c: number) => (ws as any)[utils.encode_cell({ r, c })];
const show = (v: any) => {
  if (!v) return "";
  if (v.f) return `F{${String(v.f).replace(/\s+/g, " ").slice(0, 90)}}`;
  return String(v.v).slice(0, 30);
};

// BS Summary rows 1-3, cols A..S
console.log("### BS Summary rows 1-3 (A..S):");
for (let r = 0; r < 3; r++) {
  console.log(`-- row ${r + 1}:`);
  for (let c = 0; c < 19; c++) {
    const v = cell(bs, r, c);
    if (v) console.log(`  ${utils.encode_col(c)}${r + 1}: ${show(v)}`);
  }
}

// BS Summary sample rows: 4 (group), 8 (CC), 15, 29, 32, 33, 40 — full formulas D..O
console.log("\n### BS Summary sample rows (D..O full formulas):");
for (const r of [3, 7, 14, 28, 31, 32, 39]) {
  console.log(`-- row ${r + 1} [label: ${show(cell(bs, r, 2))}]:`);
  for (let c = 3; c <= 14; c++) {
    const v = cell(bs, r, c);
    if (v && (v.f || v.v !== undefined)) console.log(`  ${utils.encode_col(c)}${r + 1}: ${show(v)}`);
  }
}

// New PL: row 1 headers + EBITDA(51?), PBT(62), tax(63), PAT(64) formulas across C..AE
console.log("\n### New PL row 1 (C..AE):");
for (let c = 2; c <= 30; c++) {
  const v = cell(pl, 0, c);
  if (v) console.log(`  ${utils.encode_col(c)}1: ${show(v)}`);
}
console.log("\n### New PL key rows formulas (C..AE):");
for (const r of [50, 61, 62, 63]) {
  console.log(`-- row ${r + 1} [label: ${show(cell(pl, r, 1))}]:`);
  for (let c = 2; c <= 30; c++) {
    const v = cell(pl, r, c);
    if (v && v.f) console.log(`  ${utils.encode_col(c)}${r + 1}: F{${String(v.f).replace(/\s+/g, " ").slice(0, 70)}}`);
  }
}
