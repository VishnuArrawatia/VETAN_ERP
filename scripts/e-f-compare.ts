import { read, utils } from "xlsx";
const files = [
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb",
  "F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm",
];
function ex(v: any): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}
for (const p of files) {
  console.log("\n########", p.split("/").pop(), "########");
  const wb = read(p, { type: "file", cellDates: true });
  for (const sn of ["IWSR-SKR", "IWSR-SVN"]) {
    const ws = wb.Sheets[sn];
    if (!ws) { console.log(sn, "NOT FOUND"); continue; }
    const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
    // find column containing date-ish values
    const hdr = rows[0] || [];
    let dateI = hdr.findIndex(h => /date/i.test(ex(h)));
    // also try a data-row heuristic: find a column with dd/mm/yyyy or serial
    const byM: Record<string, number> = {};
    const cellEx = (v: any) => {
      if (v instanceof Date) return v.toISOString().slice(0, 7);
      const s = ex(v).trim();
      const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) return `${m[3]}-${m[2].padStart(2, "0")}`;
      const n = Number(s);
      if (isFinite(n) && n > 40000 && n < 60000) {
        const d = new Date(Date.UTC(1899, 11, 30)); d.setUTCDate(d.getUTCDate() + n);
        return d.toISOString().slice(0, 7);
      }
      return null;
    };
    for (let i = 1; i < Math.min(rows.length, 500); i++) {
      const r = rows[i] || [];
      for (let c = 0; c < Math.min(r.length, 20); c++) {
        const ym = cellEx(r[c]);
        if (ym && ym.startsWith("202")) { if (dateI < 0) dateI = c; break; }
      }
      if (dateI >= 0) break;
    }
    if (dateI >= 0) {
      for (let i = 1; i < rows.length; i++) {
        const ym = cellEx(rows[i]?.[dateI]);
        if (ym && ym.startsWith("202")) byM[ym] = (byM[ym] || 0) + 1;
      }
    }
    console.log(`${sn}: rows=${rows.length} dateCol=${dateI} months=${JSON.stringify(byM)}`);
  }
  // New PL totals of sales row (R8)
  const ws = wb.Sheets["New PL"];
  if (ws) {
    const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const r8 = rows[7] || [];
    console.log("New PL R8 (Total of Sales):", r8.map((c: any) => c == null ? "" : (typeof c === "number" ? c.toFixed(0) : ex(c))).slice(0, 8).join(" | "));
  }
}