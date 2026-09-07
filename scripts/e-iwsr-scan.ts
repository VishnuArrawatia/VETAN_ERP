import { read, utils } from "xlsx";

const E = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsm";
const F = "F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm";

function scan(path: string, tag: string) {
  const wb = read(path, { type: "file" });
  console.log(`\n===== ${tag}: ${path} =====`);
  console.log("sheets:", wb.SheetNames.join(", "));
  for (const sn of ["IWSR-SKR", "IWSR-SVN"]) {
    const ws = wb.Sheets[sn];
    if (!ws) { console.log(`${sn}: MISSING`); continue; }
    const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const months = new Map<string, number>();
    let blank = 0, other = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]; if (!r || !r.length) continue;
      const v = r[0];
      if (v == null || v === "") { blank++; continue; }
      if (typeof v === "number") {
        const d = new Date(Date.UTC(1899, 11, 30)); d.setUTCDate(d.getUTCDate() + v);
        const ym = d.toISOString().slice(0, 7);
        if (ym.startsWith("1900")) other++; else months.set(ym, (months.get(ym) || 0) + 1);
      } else {
        const s = String(v);
        const m = s.match(/(\d{4})-(\d{2})/);
        if (m) months.set(`${m[1]}-${m[2]}`, (months.get(`${m[1]}-${m[2]}`) || 0) + 1);
        else other++;
      }
    }
    console.log(`${sn}: total=${rows.length} rows | months:`, [...months.entries()].sort().map(([m, c]) => `${m}:${c}`).join(" "), `| 1900/other=${other} blank=${blank}`);
    // block-2 sample: rows where col0 is 1900-ish
    if (other > 0) {
      let shown = 0;
      for (let i = 1; i < rows.length && shown < 3; i++) {
        const r = rows[i]; if (!r || !r.length) continue;
        const v = r[0];
        if (typeof v === "number") {
          const d = new Date(Date.UTC(1899, 11, 30)); d.setUTCDate(d.getUTCDate() + v);
          if (d.toISOString().startsWith("1900")) {
            console.log(`  ${sn} R${i + 1} sample:`, JSON.stringify(r.slice(0, 14)).slice(0, 300));
            shown++;
          }
        }
      }
    }
  }
}

scan(E, "E-ORIGINAL");
scan(F, "F-COPY");
