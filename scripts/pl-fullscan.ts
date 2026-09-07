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
    const n = rows.length;
    for (let i = 0; i < n; i++) {
      const r = rows[i] || [];
      const t0 = String(r[0] ?? "").trim();
      const t1 = String(r[1] ?? "").trim();
      const t2 = String(r[2] ?? "").trim();
      if (/svn/i.test(t0 + " " + t1 + " " + t2) && i < n - 1) {
        const next = rows[i + 1] || [];
        if (next.length > 3) console.log(`  [${sn}] R${i + 1} SVN-section: ${[t0, t1, t2, ...r.slice(3, 6).map(c => c == null ? "" : String(c))].join(" | ").slice(0, 160)}`);
      }
    }
  }
}