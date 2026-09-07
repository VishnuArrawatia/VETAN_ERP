import { read, utils } from "xlsx";
const p = "F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm";
const wb = read(p, { type: "file" });
console.log("SHEETS:", wb.SheetNames.join(" | "));
// find PL-ish sheets
for (const sn of wb.SheetNames) {
  if (/pl|profit|p&l|pnl/i.test(sn)) {
    const ws = wb.Sheets[sn];
    const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
    console.log(`\n=== SHEET: ${sn} (${rows.length} rows) ===`);
    for (let i = 0; i < Math.min(rows.length, 60); i++) {
      const r = rows[i];
      if (!r || !r.length) continue;
      const cells = r.map(c => c == null ? "" : String(c)).slice(0, 12);
      console.log(`R${i + 1}: ${cells.join(" | ").slice(0, 220)}`);
    }
  }
}