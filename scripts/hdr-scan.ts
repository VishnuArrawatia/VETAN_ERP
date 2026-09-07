import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsm";
const wb = read(filePath, { type: "file" });

for (const nm of ["IWSR-SKR", "IWSR-SVN"]) {
  const ws = wb.Sheets[nm];
  if (!ws) { console.log(`### ${nm}: MISSING`); continue; }
  const rows = utils.sheet_to_json(ws, { header: 1, range: "A1:AI2" });
  console.log(`### ${nm} (row1 headers):`);
  (rows[0] || []).forEach((h: any, i: number) => {
    if (h) console.log(`  ${utils.encode_col(i)} = ${h}`);
  });
  console.log(`  (row2 sample values Z-AC): ${[26, 27, 28].map(c => rows[1]?.[c]).join(" | ")}`);
}
