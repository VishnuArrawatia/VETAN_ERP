import { read, utils } from "xlsx";
const p = "F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm";
const wb = read(p, { type: "file", cellDates: true });
for (const sn of ["IWSR-SKR", "IWSR-SVN", "CN-SKR", "CN-SVN"]) {
  const ws = wb.Sheets[sn];
  if (!ws) { console.log(sn, "NOT FOUND"); continue; }
  const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
  console.log(`\n=== ${sn}: ${rows.length} rows ===`);
  console.log("R1:", (rows[0] || []).map(c => String(c ?? "")).slice(0, 8).join(" | "));
  // find date column by scanning header
  const hdr = rows[0] || [];
  const dateI = hdr.findIndex(h => /date/i.test(String(h ?? "")));
  console.log("date col idx:", dateI);
  if (dateI >= 0) {
    const byMonth: Record<string, number> = {};
    for (let i = 1; i < rows.length; i++) {
      const v = rows[i]?.[dateI];
      if (v == null) continue;
      let mo = "";
      if (v instanceof Date) mo = v.toISOString().slice(0, 7);
      else { const s = String(v); const m = s.match(/(\d{4})-(\d{2})/); mo = m ? `${m[1]}-${m[2]}` : s.slice(0, 7); }
      if (mo) byMonth[mo] = (byMonth[mo] || 0) + 1;
    }
    console.log("month -> rows:", JSON.stringify(byMonth));
  }
}