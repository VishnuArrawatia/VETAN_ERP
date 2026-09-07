import { read, utils } from "xlsx";
const wb = read("E:/Account Master/A-Sakar/11. Data/Loans/SVN Term Loan RPS Working till closure - Revised.xlsx", { type: "file" });
console.log("SHEETS:", wb.SheetNames.join(", "));
for (const sn of wb.SheetNames.slice(0, 3)) {
  const ws = wb.Sheets[sn];
  const ref = ws["!ref"] as string;
  console.log(`\n### ${sn} (${ref}):`);
  const rows = utils.sheet_to_json(ws, { header: 1, range: "A1:R6" });
  for (let r = 0; r < rows.length; r++) {
    const parts: string[] = [`R${r + 1}`];
    (rows[r] || []).forEach((v: any, i: number) => {
      if (v !== undefined && v !== "") parts.push(`${utils.encode_col(i)}=${String(v).slice(0, 25)}`);
    });
    if (parts.length > 1) console.log(parts.join(" | ").slice(0, 500));
  }
}
// also check Term Loan Detail.xlsx
try {
  const wb2 = read("E:/Account Master/A-Sakar/7. Management MIS/MIS/Term Loan Detail.xlsx", { type: "file" });
  console.log("\n### Term Loan Detail.xlsx SHEETS:", wb2.SheetNames.join(", "));
} catch (e: any) { console.log("\nTerm Loan Detail read fail:", e.message.slice(0, 80)); }
