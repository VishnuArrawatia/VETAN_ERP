import { read, utils } from "xlsx";
const files = [
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb",
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2025-26/Revised Group-Summary as on 31.3.26.xlsb",
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2024-25/New Group-Summary as on 31.03.25.xlsb",
];
for (const p of files) {
  console.log("\n###", p.split("/").pop());
  const wb = read(p, { type: "file" });
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    if (!ws) continue;
    const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || [];
      const rowTxt = r.map(c => String(c ?? "")).join(" ");
      // Total of Sales or Total Sales row (any company)
      if (/total of sales|operational revenue|total sales/i.test(rowTxt) && r.filter(c => typeof c === "number" && c > 1000).length >= 2) {
        console.log(`  [${sn}] R${i + 1}:`, r.slice(0, 10).map(c => c == null ? "" : (typeof c === "number" ? c.toFixed(0) : String(c))).join(" | ").slice(0, 200));
      }
    }
  }
}