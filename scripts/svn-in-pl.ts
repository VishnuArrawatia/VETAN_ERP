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
    if (!/pl|summary|income/i.test(sn)) continue;
    const ws = wb.Sheets[sn];
    const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const hits: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || [];
      const t = r.map(c => String(c ?? "")).join(" ");
      if (/svn/i.test(t) && /pl|profit|sales|income|statement|revenue/i.test(t)) hits.push(`R${i + 1}: ${r.slice(0, 6).map(c => c == null ? "" : String(c)).join(" | ").slice(0, 140)}`);
    }
    console.log(`  [${sn}] SVN-PL hits:`, hits.length ? hits.slice(0, 4).join("\n      ") : "none");
  }
}