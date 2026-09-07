import { read, utils } from "xlsx";
const wb = read("F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm", { type: "file" });

// Check Loan-SKR exists? and scan Loan-SVN FY-block structure deeper (cols A..V, all 100 rows)
const ws = wb.Sheets["Loan-SVN"];
console.log("Sheets with 'loan':", wb.SheetNames.filter(n => /loan/i.test(n)));

// Print full A/B values for all 100 rows to map FY blocks
console.log("--- A/B map ---");
let prevFY = "";
for (let r = 4; r <= 100; r++) {
  const a = ws["A" + r]?.v, b = ws["B" + r]?.v;
  if (a !== undefined && String(a).trim() !== "" && String(a) !== prevFY) {
    prevFY = String(a);
  }
  if (b !== undefined) {
    const d = ws["D" + r]?.v, e = ws["E" + r]?.v, f = ws["F" + r]?.v;
    const h = ws["H" + r]?.v, i2 = ws["I" + r]?.v, j = ws["J" + r]?.v;
    const p = ws["P" + r]?.v, q = ws["Q" + r]?.v, rr = ws["R" + r]?.v;
    const t = ws["T" + r]?.v, u = ws["U" + r]?.v, v = ws["V" + r]?.v;
    const fmt = (x: any) => (typeof x === "number" ? Math.round(x) : (x ?? ""));
    console.log(`R${r} ${a ?? "  "} ${String(b).slice(0,5).padEnd(6)} | 854:${fmt(d)}/${fmt(e)}/${fmt(f)} | 860:${fmt(h)}/${fmt(i2)}/${fmt(j)} | WC-P:${fmt(p)}/${fmt(q)}/${fmt(rr)} | WC-T:${fmt(t)}/${fmt(u)}/${fmt(v)}`);
  }
}
