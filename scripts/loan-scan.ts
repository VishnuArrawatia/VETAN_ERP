import { read, utils } from "xlsx";
const wb = read("F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm", { type: "file" });

for (const nm of ["Loan-SVN", "DSCR"]) {
  const ws = wb.Sheets[nm];
  if (!ws) { console.log(`### ${nm}: MISSING`); continue; }
  const range = ws["!ref"];
  console.log(`\n### ${nm} (ref: ${range}):`);
  const rows = utils.sheet_to_json(ws, { header: 1, range: "A1:N12" });
  for (let r = 0; r < rows.length; r++) {
    const parts: string[] = [`R${r + 1}`];
    (rows[r] || []).forEach((v: any, i: number) => {
      if (v !== undefined && v !== "") parts.push(`${utils.encode_col(i)}=${String(v).slice(0, 22)}`);
    });
    if (parts.length > 1) console.log(parts.join(" | ").slice(0, 450));
  }
}
