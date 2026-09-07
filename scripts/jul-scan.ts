import { read, utils } from "xlsx";
const files = [
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.07.26.xlsb",
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Financial-Summary as on 31-July-2026 .xlsb",
];
for (const p of files) {
  console.log("\n###", p.split("/").pop());
  try {
    const wb = read(p, { type: "file" });
    console.log("SHEETS:", wb.SheetNames.join(" | "));
    for (const sn of wb.SheetNames) {
      if (!/pl|income|summary|profit/i.test(sn)) continue;
      const ws = wb.Sheets[sn];
      const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const r = rows[i] || [];
        const t = r.map(c => c == null ? "" : (typeof c === "number" ? c.toFixed(0) : String(c))).slice(0, 10).join(" | ");
        if (/svn|sakar|pl|statement|sales/i.test(t)) console.log(`  [${sn}] R${i + 1}: ${t.slice(0, 200)}`);
      }
    }
  } catch (e) { console.log("ERR", String(e).slice(0, 100)); }
}