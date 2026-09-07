import { read, utils } from "xlsx";
const p = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(p, { type: "file", cellDates: true });
const ws = wb.Sheets["IWSR-SKR"];
const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
// where do valid months end and 1900 start
let lastValid = -1, first1900 = -1;
for (let i = 1; i < rows.length; i++) {
  const v = rows[i]?.[1];
  const good = v instanceof Date && v.getUTCFullYear() >= 2025;
  if (good) lastValid = i;
  else if (first1900 < 0 && v instanceof Date) first1900 = i;
}
console.log("last valid month row idx:", lastValid, "| first 1900 row idx:", first1900);
// print rows 3575..3595 wide (cols 0..24)
for (let i = 3573; i <= 3592; i++) {
  const r = rows[i] || [];
  console.log(`R${i + 1}:`, r.slice(0, 24).map((c, ci) => `${ci}:${c instanceof Date ? c.toISOString().slice(0, 10) : String(c ?? "").slice(0, 10)}`).join(" "));
}