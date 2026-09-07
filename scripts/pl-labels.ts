import { read, utils } from "xlsx";
const p = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(p, { type: "file" });
const rows = utils.sheet_to_json(wb.Sheets["New PL"], { header: 1 }) as any[][];
console.log("R1 full:", rows[0].map((c, i) => `${i}:${String(c ?? "").slice(0, 16)}`).join(" | "));
console.log("R2 full:", rows[1].map((c, i) => `${i}:${c == null ? "" : String(c).slice(0, 10)}`).join(" | "));
// check around col 15-17 for company names
for (const ri of [0, 1, 2]) {
  const r = rows[ri] || [];
  console.log(`\nR${ri + 1} cols 14-20:`, r.slice(14, 21).map((c, ci) => `${ci + 14}:${String(c ?? "")}`).join(" | "));
}