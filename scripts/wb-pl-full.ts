import { read, utils } from "xlsx";
const p = "F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm";
const wb = read(p, { type: "file" });
for (const sn of ["New PL", "VM-SKR"]) {
  const ws = wb.Sheets[sn];
  if (!ws) { console.log(sn, "NOT FOUND"); continue; }
  const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
  console.log(`\n===== ${sn} (${rows.length} rows) =====`);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.length) continue;
    const cells = r.map(c => c == null ? "" : (typeof c === "number" ? c.toFixed(2) : String(c))).slice(0, 8);
    console.log(`R${i + 1}: ${cells.join(" | ").slice(0, 200)}`);
  }
}