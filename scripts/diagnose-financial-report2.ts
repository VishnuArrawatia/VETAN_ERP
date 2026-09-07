import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const names: any[] = ((wb as any).Workbook || {}).Names || [];

const serialToDate = (n: number) => {
  const d = new Date(Date.UTC(1899, 11, 30) as any);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// 1. Names with #REF! or external refs
console.log("### BROKEN / EXTERNAL NAMES:");
for (const n of names) {
  const ref = String(n.Ref || "");
  if (ref.includes("#REF!") || ref.includes("[") || ref.startsWith("SH33")) {
    console.log(`  - ${n.Name} => ${ref.slice(0, 110)}`);
  }
}
console.log("");

// 2. New PL full width rows 1-2 (all month columns)
console.log('### "New PL" rows 1-2, ALL columns (month headers):');
const pl = wb.Sheets["New PL"];
for (const r of [1, 2]) {
  const vals: string[] = [];
  for (let c = 0; c < 39; c++) {
    const cell = pl[utils.encode_cell({ r, c })] as any;
    if (!cell) continue;
    let v = cell.v;
    if (typeof v === "number" && v > 40000 && v < 50000) v = `${v} (${serialToDate(v)})`;
    vals.push(`${utils.encode_col(c)}: ${String(v).slice(0, 28)}`);
  }
  console.log(`Row ${r + 1}: ${vals.join(" | ")}`);
}
console.log("");

// 3. Aug-26 column (F=index 5) of New PL - verify all zeros
console.log('### "New PL" Aug-26 col F values (rows 3-64):');
let augNonZero = 0;
for (let r = 2; r < 64; r++) {
  const cell = pl[utils.encode_cell({ r, c: 5 })] as any;
  if (cell && typeof cell.v === "number" && Math.abs(cell.v) > 0.01) {
    augNonZero++;
    const label = (pl[utils.encode_cell({ r, c: 1 })] as any)?.v;
    console.log(`  R${r + 1} ${label}: ${cell.v}`);
  }
}
if (!augNonZero) console.log("  (all zeros/empty - August data NOT loaded)");
console.log("");

// 4. BS Summary headers with dates
console.log('### "BS Summary" rows 1-3 all columns:');
const bs = wb.Sheets["BS Summary"];
for (const r of [0, 1, 2]) {
  const vals: string[] = [];
  for (let c = 0; c < 31; c++) {
    const cell = bs[utils.encode_cell({ r, c })] as any;
    if (!cell) continue;
    let v = cell.v;
    if (typeof v === "number" && v > 40000 && v < 50000) v = `${v} (${serialToDate(v)})`;
    vals.push(`${utils.encode_col(c)}: ${String(v).slice(0, 30)}`);
  }
  console.log(`Row ${r + 1}: ${vals.join(" | ")}`);
}
console.log("");

// 5. DSCR sheet full dump
console.log('### "DSCR" sheet full:');
const dscr = wb.Sheets["DSCR"];
const dJson = utils.sheet_to_json(dscr, { header: 1, defval: "" });
dJson.forEach((row, i) => {
  const cells = row.map((v: any) => {
    let s = String(v);
    if (s.length > 40) s = s.slice(0, 40) + "...";
    return s;
  });
  if (cells.some((v: string) => v !== "")) console.log(`R${i + 5}: ${JSON.stringify(cells)}`);
});
console.log("");

// 6. Formulas in DSCR raw (to see #REF!)
console.log('### "DSCR" formulas raw:');
for (const addr of Object.keys(dscr)) {
  if (addr.startsWith("!")) continue;
  const cell = (dscr as any)[addr];
  if (cell.f) console.log(`  ${addr}: f="${cell.f}"  v=${cell.v}`);
}
