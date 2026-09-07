import { read, utils } from "xlsx";
const p = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(p, { type: "file", cellDates: true });
for (const sn of ["IWSR-SKR", "IWSR-SVN"]) {
  const ws = wb.Sheets[sn];
  const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
  console.log(`\n==== ${sn} rows=${rows.length} ====`);
  console.log("HDR:", rows[0].slice(0, 20).map((c, i) => `${i}:${String(c ?? "").slice(0, 18)}`).join(" | "));
  // Look at row 2 & 3 fully to see month position
  for (const ri of [1, 2, 3]) {
    const r = rows[ri] || [];
    console.log(`R${ri + 1}:`, r.slice(0, 16).map((c, i) => `${i}:${c instanceof Date ? c.toISOString().slice(0, 10) : String(c ?? "").slice(0, 14)}`).join(" | "));
  }
  // distribution of first 4 columns values to find month
  const c0: Record<string, number> = {}, c1: Record<string, number> = {}, c2: Record<string, number> = {}, c3: Record<string, number> = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const pick = (c: number) => { const v = r[c]; return v instanceof Date ? "DATE:" + v.toISOString().slice(0, 7) : String(v ?? "∅").slice(0, 10); };
    c0[pick(0)] = (c0[pick(0)] || 0) + 1;
    c1[pick(1)] = (c1[pick(1)] || 0) + 1;
    c2[pick(2)] = (c2[pick(2)] || 0) + 1;
    c3[pick(3)] = (c3[pick(3)] || 0) + 1;
  }
  console.log("col0 top:", Object.entries(c0).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}×${v}`).join("  "));
  console.log("col1 top:", Object.entries(c1).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${v}`).join("  "));
  console.log("col2 top:", Object.entries(c2).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}×${v}`).join("  "));
  console.log("col3 top:", Object.entries(c3).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${v}`).join("  "));
}