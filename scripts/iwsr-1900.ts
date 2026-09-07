import { read, utils } from "xlsx";
const p = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(p, { type: "file", cellDates: true });
const ws = wb.Sheets["IWSR-SKR"];
const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
// find first rows where col1 date is 1900-ish, print them with invoice date and amounts (tail cols)
let shown = 0;
for (let i = 1; i < rows.length && shown < 6; i++) {
  const r = rows[i] || [];
  const v1 = r[1];
  const is1900 = v1 instanceof Date && v1.getUTCFullYear() <= 1901;
  if (is1900) {
    console.log(`R${i + 1}: Month=${v1 instanceof Date ? v1.toISOString() : String(v1)}`);
    console.log("   ", r.slice(0, 20).map((c, ci) => `${ci}:${c instanceof Date ? c.toISOString().slice(0, 10) : String(c ?? "").slice(0, 16)}`).join(" | "));
    console.log("   tail:", r.slice(-8).map((c, ci) => `${ci}:${String(c ?? "")}`).join(" | "));
    shown++;
  }
}
// also: last 5 real rows to see period range
console.log("\nLast rows of sheet:");
for (let i = rows.length - 4; i < rows.length; i++) {
  const r = rows[i] || [];
  console.log(`R${i + 1}:`, r.slice(0, 14).map((c) => c instanceof Date ? c.toISOString().slice(0, 10) : String(c ?? "").slice(0, 12)).join(" | "));
}