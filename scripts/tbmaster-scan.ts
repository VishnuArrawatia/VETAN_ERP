import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsm";
const wb = read(filePath, { type: "file" });

for (const nm of ["Master-TB-Sakar", "Master-TB-SVN"]) {
  const ws = wb.Sheets[nm];
  if (!ws) { console.log(`### ${nm}: MISSING`); continue; }
  const rows = utils.sheet_to_json(ws, { header: 1, range: "A1:W3" });
  console.log(`### ${nm}:`);
  for (let r = 0; r < 3; r++) {
    const parts: string[] = [`R${r + 1}`];
    (rows[r] || []).forEach((h: any, i: number) => {
      if (h !== undefined && h !== "") parts.push(`${utils.encode_col(i)}=${String(h).slice(0, 24)}`);
    });
    console.log(parts.join(" | ").slice(0, 600));
  }
}
