import { read, utils } from "xlsx";
const files = [
  ["FY-2026-27", "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb"],
  ["FY-2025-26", "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2025-26/Revised Group-Summary as on 31.3.26.xlsb"],
  ["FY-2024-25", "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2024-25/New Group-Summary as on 31.03.25.xlsb"],
];
for (const [fy, p] of files) {
  console.log("\n###", fy, "—", p.split("/").pop());
  const wb = read(p, { type: "file" });
  const rows = utils.sheet_to_json(wb.Sheets["New PL"], { header: 1 }) as any[][];
  // row 1 (R2 dates) and row 8 (Total of Sales) + row 3 sales
  for (const ri of [1, 2, 7]) {
    const r = rows[ri] || [];
    const cells = r.map((c, ci) => `${ci}:${c == null ? "·" : typeof c === "number" ? Math.round(c) : String(c).slice(0, 10)}`).join("  ");
    console.log(`  R${ri + 1} (${r.length} cols): ${cells.slice(0, 400)}`);
  }
}