import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });

// Loan-SVN rows 49-100: year labels and principal/interest sums
const loan = wb.Sheets["Loan-SVN"];
console.log("### Loan-SVN rows 49-100 (A, B, E, F, I, J, M, N, Q, R, U, V):");
const yearTotals: Record<string, { prin: number; int: number }> = {};
for (let r = 48; r < 100; r++) {
  const get = (c: number) => (loan as any)[utils.encode_cell({ r, c })]?.v;
  const yr = get(0);
  const month = get(1);
  const prin = (get(4) || 0) + (get(8) || 0) + (get(12) || 0) + (get(16) || 0) + (get(20) || 0);
  const int = (get(5) || 0) + (get(9) || 0) + (get(13) || 0) + (get(17) || 0) + (get(21) || 0);
  if (yr || prin || int) {
    console.log(`R${r + 1}: yr=${yr} month=${month} prin=${prin.toFixed(0)} int=${int.toFixed(0)}`);
    const key = String(yr || "(cont)");
    yearTotals[key] = yearTotals[key] || { prin: 0, int: 0 };
    yearTotals[key].prin += prin;
    yearTotals[key].int += int;
  }
}
console.log("\nYear totals:", JSON.stringify(yearTotals, null, 1));

// New PL O and P columns rows 49-66 (formulas)
const pl = wb.Sheets["New PL"];
console.log("\n### New PL O/P columns rows 49-66:");
for (let r = 48; r < 66; r++) {
  for (const c of [14, 15]) {
    const cell = (pl as any)[utils.encode_cell({ r, c })];
    if (cell) console.log(`  ${utils.encode_col(c)}${r + 1}: f=${cell.f || "-"} v=${cell.v}`);
  }
}

// BS Summary D/F column formulas rows 10-14 (document the all-42 issue)
const bs = wb.Sheets["BS Summary"];
console.log("\n### BS Summary rows 10-14 formulas (D,E,F cols):");
for (let r = 9; r < 14; r++) {
  for (const c of [3, 4, 5]) {
    const cell = (bs as any)[utils.encode_cell({ r, c })];
    if (cell) console.log(`  ${utils.encode_col(c)}${r + 1}: f=${String(cell.f || "-").slice(0, 70)} v=${cell.v}`);
  }
}
