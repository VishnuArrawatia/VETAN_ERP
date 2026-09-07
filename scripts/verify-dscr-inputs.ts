import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });

const L = (n: number) => (n / 100000).toFixed(2);

// New PL: SAKAR col P (YTD lakhs), SVN col AE (YTD lakhs); raw AD/R
const pl = wb.Sheets["New PL"];
const gv = (addr: string) => (pl as any)[addr]?.v;
console.log("### New PL YTD values (SAKAR P / SVN AE):");
for (const [label, row] of [
  ["EBITDA (51)", 50],
  ["EBIT (56)", 55],
  ["Finance Cost (59)", 58],
  ["Discounting (60)", 59],
  ["PBT (62)", 61],
] as const) {
  console.log(
    `  ${label}: SAKAR P=${gv(`P${row + 1}`)} | SVN AE=${gv(`AE${row + 1}`)}`
  );
}
console.log(
  "  AE62*82.5% =", (gv("AE62") as number) * 0.825,
  "(current I7 formula)"
);

// BS Summary loan rows 10-14
const bs = wb.Sheets["BS Summary"];
console.log("\n### BS Summary rows 10-14 (A..F label + SAKAR, K..N SVN):");
for (let r = 9; r < 14; r++) {
  const label = (bs as any)[utils.encode_cell({ r, c: 2 })]?.v;
  const d = (bs as any)[utils.encode_cell({ r, c: 3 })]?.v;
  const f = (bs as any)[utils.encode_cell({ r, c: 5 })]?.v;
  const k = (bs as any)[utils.encode_cell({ r, c: 10 })]?.v;
  const l = (bs as any)[utils.encode_cell({ r, c: 11 })]?.v;
  console.log(
    `  R${r + 1} ${label}: SAKAR D=${d} F=${f} | SVN K=${k} L=${l}`
  );
}

// Loan-SVN sheet dump
const loan = wb.Sheets["Loan-SVN"];
console.log("\n### Loan-SVN first 40 rows:");
const lj = utils.sheet_to_json(loan, { header: 1, defval: "" });
for (let i = 0; i < Math.min(40, lj.length); i++) {
  const row = lj[i].map((v: any) =>
    typeof v === "number" ? (v > 40000 && v < 50000 ? v : Math.round(v * 100) / 100) : String(v).slice(0, 25)
  );
  if (row.some((v: any) => v !== "")) console.log(`R${i + 1}:`, JSON.stringify(row.slice(0, 14)));
}
console.log("\n### Loan-SVN formulas:");
for (const addr of Object.keys(loan)) {
  if (addr.startsWith("!")) continue;
  const cell = (loan as any)[addr];
  if (cell.f) console.log(`  ${addr}: ${cell.f.slice(0, 90)}`);
}
