import { read, utils } from "xlsx";
const wb = read("E:/Account Master/A-Sakar/11. Data/Loans/SVN Term Loan RPS Working till closure - Revised.xlsx", { type: "file" });

const ws = wb.Sheets["Term Loan"];
console.log("### Term Loan full header-map (R1-R3, all cols A..Z):");
for (let r = 1; r <= 3; r++) {
  const parts: string[] = [`R${r}`];
  for (let c = 0; c < 26; c++) {
    const L = utils.encode_col(c);
    const v = ws[L + r]?.v;
    if (v !== undefined && v !== "") parts.push(`${L}=${String(v).slice(0, 30)}`);
  }
  console.log(parts.join(" | "));
}

// count month rows and check 26-27 block presence
let count2627 = 0;
const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
let curFY = "";
for (let r = 4; r <= last; r++) {
  const a = ws["A" + r]?.v;
  if (a != null && String(a).trim() !== "") curFY = String(a).trim();
  if (curFY === "26-27") count2627++;
}
console.log(`\n26-27 rows: ${count2627} (last row: ${last})`);

// sample rows around 26-27 start
let started = false, shown = 0;
curFY = "";
for (let r = 4; r <= last && shown < 6; r++) {
  const a = ws["A" + r]?.v;
  if (a != null && String(a).trim() !== "") { if (String(a).trim() === "26-27") started = true; curFY = String(a).trim(); }
  if (started) {
    const b = ws["B" + r]?.v;
    const d = ws["D" + r]?.v, e = ws["E" + r]?.v, f = ws["F" + r]?.v;
    const h = ws["H" + r]?.v, i2 = ws["I" + r]?.v, j = ws["J" + r]?.v;
    const l = ws["L" + r]?.v, m = ws["M" + r]?.v, n = ws["N" + r]?.v;
    const p = ws["P" + r]?.v, q = ws["Q" + r]?.v, rr = ws["R" + r]?.v;
    const fmt = (x: any) => (typeof x === "number" ? Math.round(x) : (x ?? ""));
    const date = typeof b === "number" ? new Date(Date.UTC(1899, 11, 30) as any).getTime() + b * 86400000 : b;
    console.log(`R${r} ${curFY} ${String(new Date(date).toISOString().slice(0, 7))} | 860:${fmt(d)}/${fmt(e)}/${fmt(f)} | 861:${fmt(h)}/${fmt(i2)}/${fmt(j)} | WC-8976:${fmt(l)}/${fmt(m)}/${fmt(n)} | WC-894:${fmt(p)}/${fmt(q)}/${fmt(rr)}`);
    shown++;
  }
}
