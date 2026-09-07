import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsm";
const wb = read(filePath, { type: "file" });
const cell = (ws: any, r: number, c: number) => (ws as any)[utils.encode_cell({ r, c })];

for (const [nm, maxC, rows] of [
  ["IWSR-SKR", 30, 6],
  ["IWSR-SVN", 30, 6],
  ["CN-SKR", 26, 6],
  ["CN-SVN", 26, 6],
  ["FG Purchase", 16, 6],
] as [string, number, number][]) {
  const ws = wb.Sheets[nm];
  if (!ws) { console.log(`\n### ${nm}: MISSING`); continue; }
  console.log(`\n### ${nm} (ref: ${ws["!ref"]}) — header rows 1-3, first ${maxC} cols:`);
  for (let r = 0; r < rows; r++) {
    const parts: string[] = [`R${r + 1}`];
    for (let c = 0; c < maxC; c++) {
      const v = cell(ws, r, c);
      if (v) parts.push(`${utils.encode_col(c)}=${typeof v.v === "number" ? v.v : String(v.v).slice(0, 18)}`);
    }
    console.log(parts.join(" | ").slice(0, 400));
  }
}
