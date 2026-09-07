import { read, utils } from "xlsx";
const files = [
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2024-25/New Group-Summary as on 31.03.25.xlsb",
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2025-26/Revised Group-Summary as on 31.3.26.xlsb",
];
for (const p of files) {
  console.log("\n########", p.split("/").pop(), "########");
  try {
    const wb = read(p, { type: "file" });
    console.log("SHEETS:", wb.SheetNames.join(" | "));
    for (const sn of wb.SheetNames) {
      if (!/pl|profit|pnl|summary/i.test(sn)) continue;
      const ws = wb.Sheets[sn];
      const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
      console.log(`\n--- ${sn} (${rows.length} rows) ---`);
      for (let i = 0; i < Math.min(rows.length, 16); i++) {
        const r = rows[i];
        if (!r || !r.length) continue;
        const cells = r.map(c => c == null ? "" : (typeof c === "number" ? c.toFixed(0) : String(c))).slice(0, 14);
        console.log(`R${i + 1}: ${cells.join(" | ").slice(0, 220)}`);
      }
    }
  } catch (e) { console.log("ERROR:", String(e).slice(0, 120)); }
}