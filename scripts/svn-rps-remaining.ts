import { read, utils } from "xlsx";
const wb = read("E:/Account Master/A-Sakar/11. Data/Loans/SVN Term Loan RPS Working till closure - Revised.xlsx", { type: "file" });
console.log("ALL SHEETS:", wb.SheetNames.join(", "));

// master summary from Loan Summery sheet
const ls = wb.Sheets["Loan Summery"];
const rows = utils.sheet_to_json(ls, { header: 1 });
console.log("\n--- Loan Summery (rows 1-15, cols A-J) ---");
for (let r = 0; r < 15; r++) {
  const row = rows[r] || [];
  const parts: string[] = [`R${r + 1}`];
  row.forEach((v: any, i: number) => { if (v !== undefined && v !== "") parts.push(`${utils.encode_col(i)}=${String(v).slice(0, 22)}`); });
  if (parts.length > 1) console.log(parts.join(" | ").slice(0, 400));
}

// missing loans: 802920431, 803641167 (ECGS), DBS x2 — search all sheets for these names
console.log("\n--- searching for missing loan names in all sheets ---");
const targets = ["802920431", "803641167", "DBS", "8817320"];
for (const sn of wb.SheetNames) {
  const w = wb.Sheets[sn];
  const last = Number((w["!ref"] as string).split(":")[1].replace(/\D/g, ""));
  const found = new Set<string>();
  for (let r = 1; r <= Math.min(last, 10); r++) {
    for (let c = 0; c < 40; c++) {
      const v = w[utils.encode_col(c) + r]?.v;
      if (v == null) continue;
      const s = String(v);
      for (const t of targets) if (s.includes(t)) found.add(`${utils.encode_col(c)}${r}=${s.slice(0, 40)}`);
    }
  }
  if (found.size) console.log(`${sn}:`, [...found].slice(0, 6).join(" | "));
}
