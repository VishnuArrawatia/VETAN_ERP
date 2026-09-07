import { read, utils } from "xlsx";
const files = [
  ["FY-2026-27", "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb"],
  ["FY-2025-26", "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2025-26/Revised Group-Summary as on 31.3.26.xlsb"],
  ["FY-2024-25", "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2024-25/New Group-Summary as on 31.03.25.xlsb"],
];
for (const [fy, p] of files) {
  const wb = read(p, { type: "file" });
  const rows = utils.sheet_to_json(wb.Sheets["New PL"], { header: 1 }) as any[][];
  const r1 = rows[0] || [];
  console.log(`${fy}: R1 company labels:`, r1.map((c, i) => (String(c ?? "").match(/sakar|svn/i) ? `${i}="${String(c).trim()}"` : "")).filter(Boolean).join("  "));
  // R8 = Operational Revenue (row index 7); sum both blocks
  const r8 = rows[7] || [];
  const sum = (a: number, b: number) => r8.slice(a, b).reduce((s: number, c: any) => s + (typeof c === "number" ? c : 0), 0);
  console.log(`   R8 block-A(cols2-13)=${(sum(2, 14) / 1e7).toFixed(2)} Cr | block-B(cols17-28)=${(sum(17, 29) / 1e7).toFixed(2)} Cr | row3-Sales A=${((rows[2] || []).slice(2, 14).reduce((s: number, c: any) => s + (typeof c === "number" ? c : 0), 0) / 1e7).toFixed(2)}`);
}