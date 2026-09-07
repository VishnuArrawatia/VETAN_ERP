import { read, utils } from "xlsx";
const P = "F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm";
const wb = read(P, { type: "file" });
const ws = wb.Sheets["IWSR-SKR"];
const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
console.log("total rows:", rows.length);
console.log("HEADER R1:", JSON.stringify(rows[0]).slice(0, 500));
console.log("HEADER R2:", JSON.stringify(rows[1] || []).slice(0, 500));

// non-empty cell count per row, find block boundaries (long gaps of near-empty)
const fill = (r: any[]) => (r || []).filter((c) => c != null && String(c).trim() !== "").length;
let prev = -1;
for (let i = 0; i < rows.length; i++) {
  const f = fill(rows[i]);
  if (f > 0 && prev === -1) { console.log(`first data row: ${i + 1} (fill=${f})`); prev = i; }
}
// rows 3570-3610 full dump
for (let i = 3570; i < 3612 && i < rows.length; i++) {
  const r = rows[i];
  if (!r || fill(r) === 0) continue;
  console.log(`R${i + 1} (fill=${fill(r)}):`, JSON.stringify(r).slice(0, 420));
}
