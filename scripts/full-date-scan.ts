import { read, utils } from "xlsx";
const p = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(p, { type: "file", cellDates: true });
function ymOf(v: any): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 7);
  const s = String(v ?? "").trim();
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}`;
  const n = Number(s);
  if (isFinite(n) && n > 40000 && n < 62000) { const d = new Date(Date.UTC(1899, 11, 30)); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 7); }
  return null;
}
for (const sn of ["IWSR-SKR", "IWSR-SVN", "CN-SKR", "CN-SVN", "FG Purchase"]) {
  const ws = wb.Sheets[sn];
  if (!ws) continue;
  const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
  const byY: Record<string, number> = {};
  const byCol: Record<number, Record<string, number>> = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    for (let c = 0; c < r.length; c++) {
      const ym = ymOf(r[c]);
      if (ym && (ym.startsWith("2026-0") || ym.startsWith("2026-07") || ym.startsWith("2026-08") || ym.startsWith("2025-1") || ym.startsWith("2026-0"))) {
        byY[ym] = (byY[ym] || 0) + 1;
        byCol[c] = byCol[c] || {}; byCol[c][ym] = (byCol[c][ym] || 0) + 1;
      }
    }
  }
  console.log(`\n${sn}: rows=${rows.length}`);
  console.log("  months found:", JSON.stringify(Object.fromEntries(Object.entries(byY).sort())));
  console.log("  by column:", Object.entries(byCol).map(([c, m]) => `col${c}:${JSON.stringify(m)}`).join("  ").slice(0, 300));
}